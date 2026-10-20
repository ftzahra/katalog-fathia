import { createClient } from "@supabase/supabase-js";

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

export const createServerClient = buatKoneksiServer;
export const createSupabaseServerClient = buatKoneksiServer;

