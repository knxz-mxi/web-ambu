'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Users,
  ShieldCheck,
  CreditCard,
  Camera,
  FileSpreadsheet,
  Send,
  Lock,
  RotateCcw,
  Sparkles,
  HelpCircle,
  Smartphone,
  Copy,
  Check,
  Receipt,
  AlertCircle,
  ExternalLink,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export default function DocumentationPage() {
  const [activeTab, setActiveTab] = useState<'BUNDA' | 'BENDAHARA' | 'SECURITY' | 'FAQ'>('BUNDA');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedRek, setCopiedRek] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<string>('Sistem Fresh • Siklus 30m Aktif');
  const [isClearing, setIsClearing] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Copy URL Helper
  const copyDocUrl = () => {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://ambu.mxi.codes/documentation';
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Copy Rekening Helper
  const copyRekeningBni = () => {
    navigator.clipboard.writeText('2102403976');
    setCopiedRek(true);
    setTimeout(() => setCopiedRek(false), 2500);
  };

  // Manual Trigger Cache Clear
  const triggerManualClear = async () => {
    setIsClearing(true);
    setCacheStatus('Membersihkan cache browser...');
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((k) => window.caches.delete(k)));
      }
      setTimeout(() => {
        setIsClearing(false);
        setCacheStatus('Cache Berhasil Dibersihkan! (Data 100% Segar) ✨');
        setTimeout(() => setCacheStatus('Sistem Fresh • Siklus 30m Aktif'), 4000);
      }, 700);
    } catch {
      setIsClearing(false);
      setCacheStatus('Pembersihan lokal selesai ✅');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-teal-50/20 to-slate-100 text-slate-800 pb-20 selection:bg-teal-200">
      {/* TOP NOTIFICATION BAR */}
      <div className="bg-teal-950 text-teal-100 py-2 px-3 sm:px-4 text-[11px] sm:text-xs font-semibold border-b border-teal-800/80">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1.5 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>
              🔒 <strong>Halaman Dokumentasi Privat:</strong> Hanya dapat diakses melalui link langsung{' '}
              <code className="bg-teal-900 text-teal-200 px-1.5 py-0.5 rounded font-mono text-[10px]">
                ambu.mxi.codes/documentation
              </code>
            </span>
          </div>
          <button
            onClick={copyDocUrl}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 hover:text-amber-200 underline underline-offset-2 transition-colors"
          >
            {copiedLink ? <Check className="w-3 h-3 stroke-[3]" /> : <Copy className="w-3 h-3" />}
            <span>{copiedLink ? 'Link Tersalin!' : 'Salin Tautan'}</span>
          </button>
        </div>
      </div>

      {/* HEADER NAV */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold shadow-md shadow-teal-700/20 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base md:text-lg font-black text-slate-900 leading-tight truncate">
                Buku Panduan Kas 4 B Bilal Bin Rabah 🌸
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 font-bold truncate">
                Panduan Khusus Tante Nia (Bendahara) & Seluruh Bunda Kelas 4 B
              </p>
            </div>
          </div>

          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-black shadow-sm transition-all shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Buka Aplikasi</span>
            <span className="sm:hidden">Aplikasi</span>
          </a>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="max-w-6xl mx-auto px-3 sm:px-6 pt-6 pb-4">
        <div className="rounded-3xl bg-gradient-to-r from-teal-800 via-teal-900 to-emerald-900 text-white p-5 sm:p-7 md:p-8 shadow-xl relative overflow-hidden border-2 border-teal-700/40">
          <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -left-10 -top-10 w-60 h-60 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-teal-200 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Panduan Resmi Sistem Kas & Uang Kadeudeuh 2026–2027</span>
            </div>

            <h2 className="text-xl sm:text-2xl md:text-3xl font-black leading-tight text-white">
              Praktis, Transparan, & Sangat Ramah untuk Emak-Emak 💐
            </h2>

            <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed font-medium">
              Aplikasi ini dirancang khusus agar mempermudah <strong>Tante Nia (Bendahara / Mama Athalla)</strong> dalam mengelola keuangan kelas, sekaligus memberikan kemudahan <strong>1-klik</strong> bagi seluruh <strong>Bunda murid Kelas 4 B Bilal Bin Rabah</strong> untuk setor, kirim bukti, dan cek kuitansi tanpa rasa bingung.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs font-bold">
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> 100% Responsif HP & Komputer
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/30 text-amber-200">
                <CreditCard className="w-3.5 h-3.5 text-amber-300" /> Rekening BNI Resmi 2102403976
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-cyan-500/20 border border-cyan-400/30 text-cyan-200">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-300" /> Auto-Clear Cache 30 Menit (Anti-Bobol)
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* TAB NAVIGATION (MOBILE FRIENDLY) */}
      <section className="max-w-6xl mx-auto px-3 sm:px-6 py-2 sticky top-[57px] z-30 bg-slate-50/95 backdrop-blur-md">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1.5 bg-slate-200/80 rounded-2xl border border-slate-300 shadow-inner">
          <button
            type="button"
            onClick={() => setActiveTab('BUNDA')}
            className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all text-center ${
              activeTab === 'BUNDA'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-700/25 scale-[1.01]'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>🌸</span>
            <span>Panduan Bunda</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('BENDAHARA')}
            className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all text-center ${
              activeTab === 'BENDAHARA'
                ? 'bg-amber-600 text-white shadow-md shadow-amber-700/25 scale-[1.01]'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>👑</span>
            <span>Khusus Tante Nia</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SECURITY')}
            className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all text-center ${
              activeTab === 'SECURITY'
                ? 'bg-teal-700 text-white shadow-md shadow-teal-800/25 scale-[1.01]'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>🛡️</span>
            <span>Keamanan & Cache</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FAQ')}
            className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all text-center ${
              activeTab === 'FAQ'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-700/25 scale-[1.01]'
                : 'text-slate-700 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <span>❓</span>
            <span>Tanya Jawab (FAQ)</span>
          </button>
        </div>
      </section>

      {/* MAIN CONTENT AREA */}
      <main className="max-w-6xl mx-auto px-3 sm:px-6 pt-3 space-y-6">
        {/* ============================================================ */}
        {/* TAB 1: PANDUAN BUNDA / WALI MURID */}
        {/* ============================================================ */}
        {activeTab === 'BUNDA' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Quick Rekening BNI Card */}
            <div className="bg-amber-50 rounded-2xl p-4 border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shrink-0 shadow-sm">
                  💳
                </div>
                <div>
                  <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">
                    Nomor Rekening Resmi Kas Kelas (Bank BNI)
                  </div>
                  <div className="text-base sm:text-xl font-black text-slate-900 font-mono tracking-wider">
                    2102403976{' '}
                    <span className="text-xs sm:text-sm font-sans font-bold text-amber-900">
                      a/n Nia Mulyawati (Mama Athalla)
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={copyRekeningBni}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl font-black text-xs bg-amber-400 hover:bg-amber-300 text-amber-950 flex items-center justify-center gap-1.5 transition-all shadow-sm"
              >
                {copiedRek ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                <span>{copiedRek ? 'BERHASIL DISALIN!' : 'SALIN NO. REKENING BNI'}</span>
              </button>
            </div>

            {/* Step-by-Step Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Langkah 1 */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 font-black text-sm flex items-center justify-center">
                      1
                    </span>
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                      Cukup 1 Kali Saja
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base mb-1">
                    Pilih Nama Ananda Saat Pertama Masuk
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Saat Bunda membuka web pertama kali, akan muncul daftar 25 nama anak Kelas 4 B. Sentuh foto/nama ananda Bunda. Sistem akan otomatis mengingat identitas Bunda di HP tersebut. Setiap kali mau setor, nama anak Bunda akan otomatis terpasang tanpa perlu diketik ulang!
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-teal-800 font-semibold flex items-center gap-1">
                  <span>💡 Tip:</span>
                  <span>Jika ingin ganti nama anak, sentuh tombol <strong>"🔄 Ganti"</strong> di banner atas.</span>
                </div>
              </div>

              {/* Langkah 2 */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
                      2
                    </span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      Rp 30.000 / Bulan
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base mb-1">
                    Setor Iuran Uang Kas Kelas (Kelipatan 30 Ribu)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Iuran kas kelas adalah Rp 30.000 per bulan. Bunda dapat membayar untuk 1 bulan (Rp 30.000), 2 bulan (Rp 60.000), 3 bulan (Rp 90.000), atau langsung 1 tahun penuh (Rp 360.000). Cukup tekan tombol emas besar <strong>"SETOR KAS UNTUK [NAMA ANAK]"</strong> di halaman utama.
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-emerald-800 font-semibold flex items-center gap-1">
                  <span>✅ Sistem:</span>
                  <span>Otomatis menghitung status lunas dan tanggal setoran terakhir.</span>
                </div>
              </div>

              {/* Langkah 3 */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black text-sm flex items-center justify-center">
                      3
                    </span>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      🎁 Apresiasi Guru
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base mb-1">
                    Setor Uang Kadeudeuh Guru & Karyawan
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Uang kadeudeuh (pengganti istilah THR) dikumpulkan khusus untuk apresiasi para guru dan karyawan sekolah menjelang hari raya. Saat membuka formulir setor, Bunda cukup memilih tab <strong>"🎁 Uang Kadeudeuh Guru"</strong>.
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-amber-800 font-semibold flex items-center gap-1">
                  <span>📌 Catatan:</span>
                  <span>Target per anak adalah Rp 100.000 (bisa dicicil bertahap).</span>
                </div>
              </div>

              {/* Langkah 4 */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 font-black text-sm flex items-center justify-center">
                      4
                    </span>
                    <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                      📸 Sangat Dianjurkan
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base mb-1">
                    Upload Foto / Screenshot Bukti Transfer
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Setelah transfer di m-Banking (BCA, Mandiri, BRImo, atau BNI Mobile), ambil screenshot bukti transfernya. Pada form setor di web, sentuh kotak kamera untuk memilih gambar dari galeri HP atau langsung foto struk fisik. Foto otomatis dikompres hemat kuota (&lt; 250 KB).
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-teal-800 font-semibold flex items-center gap-1">
                  <span>🔒 Aman:</span>
                  <span>Foto bukti tersimpan di database dan menjadi arsip kuitansi digital.</span>
                </div>
              </div>

              {/* Langkah 5 */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 font-black text-sm flex items-center justify-center">
                      5
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-200">
                      Status Transparan
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base mb-1">
                    Cek Status Pembayaran (Lunas vs Bertahap)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Di daftar murid, Bunda bisa melihat status setoran ananda:
                    <br />
                    • <strong className="text-emerald-700">✅ Lunas:</strong> Bila sudah memenuhi target setoran periode berjalan.
                    <br />
                    • <strong className="text-blue-600">👍🏻 Bertahap:</strong> Bila sudah mulai menyetor sebagian (misal 1 atau 2 bulan).
                    <br />
                    Bunda dapat menyentuh tombol <strong>"Detail / Riwayat 📋"</strong> untuk melihat tanggal serta rincian pembayaran.
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-indigo-800 font-semibold flex items-center gap-1">
                  <span>🛡️ Pengaman Anti-Salah:</span>
                  <span>Bunda tidak akan salah menyetor ke anak lain karena tombol setor dikhususkan untuk ananda Bunda.</span>
                </div>
              </div>

              {/* Langkah 6 */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-teal-300 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-black text-sm flex items-center justify-center">
                      6
                    </span>
                    <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                      🧾 Sah & Otomatis
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base mb-1">
                    E-Kuitansi Digital Resmi Otomatis
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Setiap transaksi sukses langsung menghasilkan kuitansi digital resmi bernomor seri (<code className="text-purple-700 font-bold">KW-4B-...</code>), lengkap dengan stempel lunas, terbilang huruf rupiah, serta PIC bendahara. Bunda bisa sentuh <strong>"KIRIM KE WHATSAPP"</strong> untuk disimpan di WA pribadi atau <strong>"CETAK / PDF"</strong>.
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-purple-800 font-semibold flex items-center gap-1">
                  <span>📱 Ramah HP:</span>
                  <span>Terdapat tombol besar "✕ Tutup Kuitansi" di bagian bawah layar.</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: PANDUAN KHUSUS TANTE NIA (BENDAHARA) */}
        {/* ============================================================ */}
        {activeTab === 'BENDAHARA' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Admin Notice Header */}
            <div className="bg-amber-500 text-amber-950 rounded-2xl p-4 border-2 border-amber-400 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-950 text-amber-300 flex items-center justify-center font-bold text-xl shrink-0 shadow-inner">
                  👑
                </div>
                <div>
                  <div className="text-xs font-black uppercase tracking-wider text-amber-900">
                    Akun Pengurus Kas Kelas 4 B Bilal Bin Rabah
                  </div>
                  <div className="text-base sm:text-lg font-black">
                    Panduan Khusus Tante Nia (Mama Athalla — Bendahara)
                  </div>
                </div>
              </div>
              <div className="bg-amber-950 text-amber-200 px-3 py-1.5 rounded-xl font-mono text-xs font-black shrink-0">
                PIN RESMI: Ambu132
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Feature 1 */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 font-black text-sm flex items-center justify-center">
                      1
                    </span>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                      Akses Pengurus
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base mb-1">
                    Cara Masuk ke Mode Bendahara
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    1. Sentuh tombol gembok atau <strong>"Pilih Mama"</strong> di kanan atas web.<br />
                    2. Pilih opsi <strong>"Masuk sebagai Bendahara / Pengurus"</strong>.<br />
                    3. Ketikkan PIN Rahasia: <code className="font-bold text-amber-800 bg-amber-100 px-1 rounded">Ambu132</code> lalu sentuh Masuk.<br />
                    4. Ketika aktif, akan muncul tombol merah <strong>"- Catat Pengeluaran"</strong> serta fitur kelola buku kas lengkap.
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-amber-900 font-semibold">
                  🛡️ Sesi aman: Sesi otomatis dikunci setelah 30 menit tidak aktif agar saldo aman jika HP ditinggal.
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 font-black text-sm flex items-center justify-center">
                      2
                    </span>
                    <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                      Kostum Angkatan & Lainnya
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base mb-1">
                    Mencatat Pengeluaran + Upload Nota Bon Fisik
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    1. Sentuh tombol merah <strong>"- Catat Pengeluaran"</strong>.<br />
                    2. Pilih kategori pengeluaran: misal <strong>Kostum Angkatan</strong> (otomatis Rp 150.000 x jumlah anak), ATK, atau Kegiatan Kelas.<br />
                    3. <strong>Fitur Baru:</strong> Tante Nia bisa langsung memotret struk atau bon belanja fisik dari toko/penjahit. Foto nota tersimpan permanen di database!
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-rose-900 font-semibold">
                  🧾 Akuntabel: Seluruh wali murid bisa melihat transparansi nota pembelian kapan saja.
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black text-sm flex items-center justify-center">
                      3
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                      1-Klik ke Grup WA
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base mb-1">
                    Kirim Format Rekap WhatsApp (3 Pilihan Tab)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Buka menu <strong>"Rekap WA 📲"</strong> di tab navigasi. Tante Nia memiliki 3 pilihan format pesan rapi:
                    <br />
                    • <strong>✅ Contreng Kas:</strong> Format favorit emak-emak (Mama Athalla✅, Mama Kenzo👍🏻 30k, dst).<br />
                    • <strong>🎁 Contreng Kadeudeuh:</strong> Format contreng khusus uang kadeudeuh guru & karyawan.<br />
                    • <strong>📊 Laporan Lengkap:</strong> Ringkasan saldo kas aktif, kadeudeuh, dan rekening BNI.<br />
                    Sentuh tombol <strong>"BUKA DI WA"</strong>, WhatsApp di HP Tante Nia langsung terbuka!
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-emerald-900 font-semibold">
                  📲 Sangat Cepat: Tidak perlu ketik ulang nama 25 murid satu per satu di WhatsApp.
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 font-black text-sm flex items-center justify-center">
                      4
                    </span>
                    <span className="text-[11px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-200">
                      Excel Otomatis (.xlsx)
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base mb-1">
                    Download Pembukuan Kas Excel Resmi
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sentuh tombol hijau <strong>"Unduh Excel 📊"</strong>. Sistem akan langsung mengunduh file spreadsheet rapi dengan 2 Sheet:
                    <br />
                    • <strong>Sheet 1: Buku Kas 4B:</strong> Seluruh transaksi masuk, keluar, dan saldo berjalan.<br />
                    • <strong>Sheet 2: Status 25 Murid:</strong> Absen 1 s/d 25, total kas dibayar, total kadeudeuh, serta total keseluruhan untuk rekonsiliasi mutasi rekening BNI Tante Nia.
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-blue-900 font-semibold">
                  💼 Siap Rapat: File Excel bisa langsung dicetak atau dibagikan saat rapat wali murid.
                </div>
              </div>

              {/* Feature 5 */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 font-black text-sm flex items-center justify-center">
                      5
                    </span>
                    <span className="text-[11px] font-bold text-purple-800 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                      Koreksi Transaksi
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base mb-1">
                    Menghapus / Memperbaiki Salah Input
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Jika ada transaksi yang salah ketik jumlah nominal atau salah tanggal:
                    <br />
                    1. Masuk ke tab <strong>"Buku Kas"</strong>.<br />
                    2. Cari baris transaksi yang ingin dihapus.<br />
                    3. Sentuh tombol tempat sampah merah <strong>"Hapus 🗑️"</strong>.<br />
                    4. Muncul jendela konfirmasi dialog: pilih <strong>"Ya, Hapus Transaksi"</strong>.<br />
                    Saldo kas dan saldo kadeudeuh otomatis terkoreksi seketika.
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-purple-900 font-semibold">
                  🛡️ Aman: Transaksi tidak terhapus begitu saja tanpa konfirmasi sadar dari Tante Nia.
                </div>
              </div>

              {/* Feature 6 */}
              <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-amber-400 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 font-black text-sm flex items-center justify-center">
                      6
                    </span>
                    <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
                      Editable Admin
                    </span>
                  </div>
                  <h3 className="font-black text-slate-900 text-base mb-1">
                    Atur Nominal Kas & Target Kadeudeuh (Data Center)
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Sesuai permintaan Tante Nia, seluruh nominal di web ini bersifat <strong>sinkron dan dapat diedit oleh Admin</strong>:
                    <br />
                    • Nominal kas bulanan: default kelipatan Rp 30.000 / bulan.<br />
                    • Target bulan: default 12 bulan (Rp 360.000).<br />
                    • Target uang kadeudeuh: default Rp 100.000 per anak.<br />
                    Tante Nia cukup mengubahnya di tab <strong>"Data Center & Pengaturan"</strong>.
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-teal-900 font-semibold">
                  ⚙️ Otomatis Terhubung: Seluruh kartu murid langsung menyesuaikan target baru.
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: KEAMANAN & SIKLUS CLEAR CACHE 30 MENIT */}
        {/* ============================================================ */}
        {activeTab === 'SECURITY' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Interactive Security Banner */}
            <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-teal-950 text-white rounded-3xl p-6 border-2 border-teal-700/50 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-400/40 flex items-center justify-center font-bold text-xl shrink-0">
                    🛡️
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-white">
                      Sistem Keamanan & Auto-Fresh 30 Menit
                    </h3>
                    <p className="text-xs text-teal-300 font-medium">
                      Melindungi kas kelas dari akses tidak sah dan menjaga data di HP selalu segar
                    </p>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-teal-950/80 border border-teal-500/40 text-teal-300 text-xs font-mono font-bold">
                  {cacheStatus}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <div className="font-bold text-amber-300 mb-1">⏱️ Auto-Lock 30 Menit</div>
                  <p className="text-slate-300 text-[11px]">
                    Sesi Bendahara otomatis dikunci kembali setelah 30 menit tidak ada aktivitas, sehingga kas tidak bisa dibobol jika HP tertinggal atau dimainkan anak-anak.
                  </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <div className="font-bold text-emerald-300 mb-1">🍃 Auto-Clear Cache HP</div>
                  <p className="text-slate-300 text-[11px]">
                    Setiap 30 menit, aplikasi menyegarkan data langsung dari server agar browser HP Bunda tidak menampilkan saldo kadaluarsa.
                  </p>
                </div>

                <div className="bg-white/5 rounded-2xl p-3 border border-white/10">
                  <div className="font-bold text-cyan-300 mb-1">🚫 Anti-Spam & DDoS</div>
                  <p className="text-slate-300 text-[11px]">
                    Dilengkapi pembatas frekuensi (Rate Limiting) dan sanitasi input, mencegah script jahat merusak data pembukuan.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  disabled={isClearing}
                  onClick={triggerManualClear}
                  className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-teal-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all disabled:opacity-50"
                >
                  <RotateCcw className={`w-4 h-4 ${isClearing ? 'animate-spin' : ''}`} />
                  <span>{isClearing ? 'Sedang Membersihkan...' : '🧹 Uji Bersihkan Cache Sekarang'}</span>
                </button>
                <span className="text-[11px] text-slate-400 text-center sm:text-left">
                  Bunda atau Tante Nia bisa menekan tombol ini jika tampilan di HP terasa lambat atau data belum update.
                </span>
              </div>
            </div>

            {/* Why 30 Minutes Card */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
              <h4 className="font-black text-slate-900 text-base flex items-center gap-2">
                <span>💡</span>
                <span>Mengapa Sistem Ini Penting untuk Emak-Emak?</span>
              </h4>

              <div className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <p>
                  <strong>1. Mengatasi Masalah Cache WhatsApp Browser:</strong><br />
                  Seringkali saat Bunda membuka web lewat link WhatsApp di HP Android atau iPhone, browser bawaan menyimpan halaman lama dalam memori (cache). Akibatnya, setoran yang baru dibayar belum terlihat. Dengan siklus 30 menit dan tombol Segarkan, data selalu ditarik fresh dari server.
                </p>

                <p>
                  <strong>2. Keamanan Dana Kas Kelas:</strong><br />
                  HP seorang ibu sering dipinjam oleh anak-anak untuk bermain game atau menonton video. Jika sesi Bendahara dibiarkan terbuka terus menerus, ada risiko tombol hapus transaksi terpencet tanpa sengaja. Pembatasan 30 menit memastikan Tante Nia harus memasukkan PIN kembali saat ingin mengelola pengeluaran.
                </p>

                <p>
                  <strong>3. Privasi & Akses Tertutup:</strong><br />
                  Halaman dokumentasi ini sengaja <strong>tidak ditaruh di tombol menu utama</strong> agar pengunjung umum atau anak-anak tidak melihat panduan teknis PIN dan struktur internal. Hanya orang yang memiliki tautan <code className="bg-slate-100 text-teal-800 font-bold px-1 rounded">ambu.mxi.codes/documentation</code> yang dapat membacanya.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============================================================ */}
        {/* TAB 4: TANYA JAWAB (FAQ EMAK-EMAK) */}
        {/* ============================================================ */}
        {activeTab === 'FAQ' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {[
              {
                q: 'Apakah web ini bisa dibuka di semua jenis HP (Android & iPhone)?',
                a: 'Ya, 100% bisa! Web ini dirancang khusus dengan teknologi Progressive Web App (PWA) yang sangat ringan dan responsif di seluruh merk HP (Samsung, iPhone, Xiaomi, Oppo, Vivo, dll) tanpa perlu install aplikasi berat dari Play Store.',
              },
              {
                q: 'Bagaimana cara memasang aplikasi di layar utama HP agar seperti aplikasi biasa?',
                a: 'Saat membuka web di browser Chrome (Android) atau Safari (iPhone), tekan tombol "Pasang App" di bagian atas, atau pilih menu titik tiga di browser lalu pilih "Tambahkan ke Layar Utama" (Add to Home Screen). Logo Kas 4 B akan langsung muncul di beranda HP Bunda!',
              },
              {
                q: 'Bagaimana jika Bunda tidak sengaja salah transfer atau salah klik nominal?',
                a: 'Jangan panik ya Bunda. Cukup japri atau hubungi Tante Nia (Mama Athalla - Bendahara). Karena Tante Nia memiliki akses mode Bendahara, beliau bisa langsung mengoreksi nominal atau menghapus transaksi yang keliru di menu Buku Kas.',
              },
              {
                q: 'Apakah foto bukti transfer yang diupload bisa dilihat oleh wali murid lain?',
                a: 'Foto bukti transfer hanya ditampilkan dalam riwayat resmi dan detail setoran untuk transparansi bersama pengurus. Foto otomatis dikompresi sehingga tidak memakan memori HP Bunda.',
              },
              {
                q: 'Bolehkah menyetor kas langsung beberapa bulan sekaligus?',
                a: 'Sangat boleh! Iuran kas adalah kelipatan Rp 30.000. Bunda bisa menyetor untuk 2 bulan (Rp 60.000), 3 bulan (Rp 90.000), atau 1 tahun lunas (Rp 360.000). Sistem akan langsung menghitung total akumulasi dan status lunas.',
              },
              {
                q: 'Kenapa halaman dokumentasi ini tidak ada tombolnya di menu utama aplikasi?',
                a: 'Halaman ini dibuat khusus sebagai panduan privat untuk Tante Nia dan para Bunda dengan alamat khusus ambu.mxi.codes/documentation. Kami sengaja menyembunyikannya dari menu utama agar tampilan aplikasi tetap bersih, rapi, dan tidak membingungkan saat ibu-ibu ingin setor kas.',
              },
            ].map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 text-left font-black text-xs sm:text-sm text-slate-900 flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-teal-600 font-bold">Q{index + 1}.</span>
                      <span>{faq.q}</span>
                    </span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-teal-600 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pb-4 pt-1 text-xs text-slate-600 border-t border-slate-100 bg-slate-50/50 leading-relaxed"
                      >
                        {faq.a}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </motion.div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="max-w-6xl mx-auto px-3 sm:px-6 pt-12 text-center space-y-2">
        <div className="text-xs font-black text-slate-700">
          Kas & Uang Kadeudeuh Kelas 4 B Bilal Bin Rabah • Periode Mei 2026 s/d Mei 2027
        </div>
        <div className="text-[11px] text-slate-500 font-medium">
          Dikelola secara amanah oleh Bendahara Kelas: <strong>Mama Athalla (Nia Mulyawati)</strong>
        </div>
        <div className="text-[10px] text-teal-800 font-mono pt-2">
          Powered by MXI CODES — A Digital & Cloud Service Division by PT KENXZO META XPLORASI INDONESIA
        </div>
      </footer>
    </div>
  );
}
