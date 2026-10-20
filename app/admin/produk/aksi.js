"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { buatKoneksiServer, buatKoneksiAdmin } from "@/lib/supabase/server";

export async function tambahProduk(arg1, arg2) {
  const formData = arg2 instanceof FormData ? arg2 : (arg1 instanceof FormData ? arg1 : null);

  let nama = "";
  let kategori = "";
  let hargaRaw = "";
  let foto_url = "";
  let deskripsi = "";

  if (formData) {
    nama = formData.get("nama")?.toString().trim() || "";
    kategori = formData.get("kategori")?.toString().trim() || "";
    hargaRaw = formData.get("harga")?.toString().trim() || "";
    foto_url = formData.get("foto_url")?.toString().trim() || "";
    deskripsi = formData.get("deskripsi")?.toString().trim() || "";
  } else if (arg1 && typeof arg1 === "object") {
    nama = arg1.nama?.toString().trim() || "";
    kategori = arg1.kategori?.toString().trim() || "";
    hargaRaw = arg1.harga?.toString() || "";
    foto_url = arg1.foto_url?.toString().trim() || "";
    deskripsi = arg1.deskripsi?.toString().trim() || "";
  }

  // 1. Validasi admin login di server
  const supabaseAdmin = await buatKoneksiAdmin();
  const {
    data: { user },
    error: authError,
  } = await supabaseAdmin.auth.getUser();

  if (authError || !user) {
    return { error: "Akses ditolak: Anda harus login sebagai admin terlebih dahulu." };
  }

  // 2. Validasi field nama & kategori wajib
  if (!nama) {
    return { error: "Nama produk wajib diisi." };
  }

  if (!kategori) {
    return { error: "Kategori produk wajib diisi." };
  }

  // 3. Validasi harga >= 0
  const harga = parseInt(hargaRaw, 10);
  if (isNaN(harga) || harga < 0) {
    return { error: "Harga harus berupa angka dan tidak boleh kurang dari 0." };
  }

  // 4. Simpan ke database Supabase
  try {
    const supabase = buatKoneksiServer();
    const { error: insertError } = await supabase.from("produk").insert({
      nama,
      kategori,
      harga,
      deskripsi: deskripsi || null,
      foto_url: foto_url || null,
    });

    if (insertError) {
      return { error: insertError.message || "Gagal menyimpan produk ke database." };
    }
  } catch (err) {
    return { error: err?.message || "Terjadi kesalahan saat menghubungi server database." };
  }

  // 5. Revalidasi path dan redirect
  revalidatePath("/admin/produk");
  revalidatePath("/admin");
  revalidatePath("/");

  redirect("/admin/produk");
}

