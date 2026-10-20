import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

function bersihkanSupabaseUrl(rawUrl) {
  if (!rawUrl) return rawUrl;
  let url = rawUrl.trim().replace(/^['"]|['"]$/g, "");
  try {
    const parsed = new URL(url);
    if (parsed.pathname.startsWith("/rest/v1")) {
      return parsed.origin;
    }
    return url.replace(/\/+$/, "");
  } catch {
    return url;
  }
}

export async function proxy(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const rawUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()?.replace(/^['"]|['"]$/g, "");

  if (!rawUrl || !publishableKey) {
    return response;
  }

  const supabaseUrl = bersihkanSupabaseUrl(rawUrl);

  const supabase = createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname.replace(/\/+$/, "") || "/";

  // Jangan batasi akses ke halaman login admin
  if (pathname === "/admin/login") {
    return response;
  }

  // Lindungi semua halaman /admin
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!user) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const middleware = proxy;
export default proxy;

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};

