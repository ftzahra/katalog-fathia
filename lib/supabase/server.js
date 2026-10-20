import { createClient } from "@supabase/supabase-js";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

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

// Koneksi server untuk publik/pengunjung memakai SUPABASE_SECRET_KEY
export function buatKoneksiServer() {
  const rawUrl = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY?.trim()?.replace(/^['"]|['"]$/g, "");

  if (!rawUrl || !secretKey) {
    throw new Error(
      "SUPABASE_URL atau SUPABASE_SECRET_KEY belum diatur di environment variable."
    );
  }

  const supabaseUrl = bersihkanSupabaseUrl(rawUrl);

  return createClient(supabaseUrl, secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

// Koneksi sesi admin memakai SUPABASE_PUBLISHABLE_KEY dan cookie login (@supabase/ssr)
export async function buatKoneksiAdmin() {
  const cookieStore = await cookies();

  const rawUrl = process.env.SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY?.trim()?.replace(/^['"]|['"]$/g, "");

  if (!rawUrl || !publishableKey) {
    throw new Error(
      "SUPABASE_URL atau SUPABASE_PUBLISHABLE_KEY belum diatur di environment variable."
    );
  }

  const supabaseUrl = bersihkanSupabaseUrl(rawUrl);

  return createServerClient(supabaseUrl, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Method setAll dipanggil dari Server Component
        }
      },
    },
  });
}

export const createServerClient_ = buatKoneksiServer;
export const createSupabaseServerClient = buatKoneksiServer;
export const createAdminClient = buatKoneksiAdmin;
export const createClientAdmin = buatKoneksiAdmin;
