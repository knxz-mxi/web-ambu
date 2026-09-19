# 🌸 Buku Kas & THR Kelas 4B (SD Islam 2026-2027)

Aplikasi web modern, responsif, dan sangat mudah digunakan (*"tinggal submit"*) yang dirancang khusus untuk mempermudah para ibu-ibu (mak-mak milenial & generasi boomer) serta pengurus kelas dalam pencatatan uang kas, uang THR, dan pengeluaran kegiatan.

Dibuat mengacu pada struktur dan data file **`Laporan Kas 4 Utsman Juni 2026-END.ods`**.

---

## ✨ Fitur Unggulan

- 📱 **Mobile-First & Ramah Mak-Mak**:
  - Tampilan dioptimalkan khusus untuk layar HP smartphone (Android & iPhone) dan laptop/desktop.
  - **Bottom Navigation Bar**: Tombol menu praktis di bagian bawah layar HP agar mudah dijangkau jempol.
  - **Mode Huruf Besar (Ramah Boomer)**: Tombol pembesar teks dengan kontras tinggi untuk memudahkan membaca tanpa kacamata.
- ⚡ **Formulir "Tinggal Submit"**:
  - Dropdown nama anak lengkap 25 murid beserta nama panggilan (*Afraz, Queen, Arsen, Alarick, dll*).
  - Tombol nominal instan 1-klik (`Rp 50.000`, `Rp 100.000`, `Rp 200.000`).
  - Animasi konfeti perayaan saat setoran berhasil disimpan.
- 📋 **Checklist Status 25 Murid**:
  - Menampilkan status Kas (Lunas/Belum) & THR (Lunas/Belum).
  - Tombol cepat setor langsung di samping nama anak.
  - Filter pencarian nama panggilan anak.
- 📖 **Buku Kas Standar Acuan ODS**:
  - Kolom resmi: No, Tanggal, Keterangan, Rincian (Qty × Harga), Uang Masuk, Uang Keluar, Saldo Berjalan, dan PIC.
  - Dilengkapi tab **Arsip Acuan ODS Asli (50 transaksi kas + 26 transaksi THR)**.
- 📲 **1-Klik Salin Format Pesan ke WhatsApp Grup**:
  - Langsung membuat teks rekapitulasi rapi ber-emotikon yang siap dipaste ke grup WhatsApp wali murid.
- 💳 **Informasi Rekening Resmi**:
  - Nomor rekening Bank Mandiri dan tombol 1-klik salin nomor rekening.

---

## 🚀 Cara Menjalankan di Komputer Lokal

1. **Clone repository**:
   ```bash
   git clone https://github.com/knxz-mxi/web-ambu.git
   cd web-ambu
   ```

2. **Install dependensi**:
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan**:
   ```bash
   npm run dev
   ```
   Buka browser di `http://localhost:3000`.

---

## ☁️ Cara Deploy ke Vercel (1 Menit)

1. Buka [Vercel Dashboard](https://vercel.com).
2. Klik **"Add New"** > **"Project"**.
3. Hubungkan akun GitHub Anda dan pilih repository `knxz-mxi/web-ambu`.
4. Klik tombol **"Deploy"**!
   > Aplikasi ini sudah memiliki *Smart Database Fallback*, sehingga langsung bisa berjalan di Vercel tanpa perlu setup database terlebih dahulu!

---

## 🗄️ Menghubungkan ke Database Persisten (Opsional / Rekomendasi)

Untuk menyimpan data secara permanen di cloud (database PostgreSQL gratis dari Supabase atau Neon):

1. Buat database gratis di [Neon.tech](https://neon.tech) atau [Supabase.com](https://supabase.com).
2. Dapatkan *Connection String* PostgreSQL, contohnya:
   ```env
   DATABASE_URL="postgres://username:password@ep-cool-sample.neon.tech/neondb?sslmode=require"
   ```
3. Di dashboard Vercel proyek Anda:
   - Masuk ke **Settings** > **Environment Variables**.
   - Tambahkan variabel `DATABASE_URL` dengan nilai connection string di atas.
4. Lakukan *Redeploy*. Aplikasi otomatis beralih menggunakan database PostgreSQL!

---

Developed & Maintained by **MXI CODES — A Digital & Cloud Service Division by PT KENXZO META XPLORASI INDONESIA**
