"use server";

import { redirect } from "next/navigation";
import { buatKoneksiAdmin } from "@/lib/supabase/server";

export async function login(arg1, arg2) {
  let email = "";
  let password = "";

  if (arg2 instanceof FormData) {
    email = arg2.get("email")?.toString().trim() || "";
    password = arg2.get("password")?.toString() || "";
  } else if (arg1 instanceof FormData) {
    email = arg1.get("email")?.toString().trim() || "";
    password = arg1.get("password")?.toString() || "";
  } else if (arg1 && typeof arg1 === "object") {
    email = arg1.email?.toString().trim() || "";
    password = arg1.password?.toString() || "";
  }

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const supabase = await buatKoneksiAdmin();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.message === "Invalid login credentials") {
      return { error: "Email atau password salah." };
    }
    return { error: error.message || "Gagal masuk. Periksa kembali email dan password Anda." };
  }

  redirect("/admin");
}

export const masuk = login;

export async function keluar() {
  const supabase = await buatKoneksiAdmin();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

export const logout = keluar;

export async function gantiPassword(arg1, arg2) {
  let password_baru = "";
  let konfirmasi_password = "";

  if (arg2 instanceof FormData) {
    password_baru = arg2.get("password_baru")?.toString() || "";
    konfirmasi_password = arg2.get("konfirmasi_password")?.toString() || "";
  } else if (arg1 instanceof FormData) {
    password_baru = arg1.get("password_baru")?.toString() || "";
    konfirmasi_password = arg1.get("konfirmasi_password")?.toString() || "";
  } else if (arg1 && typeof arg1 === "object") {
    password_baru = arg1.password_baru?.toString() || "";
    konfirmasi_password = arg1.konfirmasi_password?.toString() || "";
  }

  // Validasi server: password baru minimal 8 karakter
  if (!password_baru || password_baru.length < 8) {
    return { error: "Password baru minimal 8 karakter." };
  }

  // Validasi server: harus sama dengan konfirmasi
  if (password_baru !== konfirmasi_password) {
    return { error: "Konfirmasi password tidak cocok dengan password baru." };
  }

  const supabase = await buatKoneksiAdmin();

  // Validasi bahwa admin sedang login
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Sesi login tidak valid atau telah berakhir. Silakan login kembali." };
  }

  const { error } = await supabase.auth.updateUser({
    password: password_baru,
  });

  if (error) {
    return { error: error.message || "Gagal mengganti password." };
  }

  return { sukses: "Password berhasil diganti." };
}

export const ubahPassword = gantiPassword;
