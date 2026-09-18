'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Gift,
  Users,
  BookOpen,
  Send,
  PlusCircle,
  MinusCircle,
  Search,
  CheckCircle2,
  Clock,
  Printer,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  Calendar,
  CreditCard,
  Building2,
  Trash2,
  Eye,
  ChevronRight,
  FileSpreadsheet,
  HelpCircle,
  HeartHandshake
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { STUDENTS_KELAS_4B, StudentItem } from '@/lib/students';
import { ODS_CASH_REFERENCE, ODS_THR_REFERENCE, OdsRow } from '@/lib/odsReferenceData';

interface TransactionItem {
  id: string;
  date: string;
  category: 'KAS_MASUK' | 'THR_MASUK' | 'PENGELUARAN' | 'THR_KELUAR';
  type: 'IN' | 'OUT';
  studentId?: number | null;
  studentName?: string | null;
  description: string;
  amount: number;
  qty?: number | null;
  unitPrice?: number | null;
  paymentMethod?: string | null;
  pic?: string | null;
  note?: string | null;
  createdAt: string;
}

export default function HomePage() {
  const [students, setStudents] = useState<StudentItem[]>(STUDENTS_KELAS_4B);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Active navigation tab: 'dashboard' | 'students' | 'ledger' | 'reference_ods' | 'info'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'reference_ods' | 'info'>('dashboard');

  // Search & Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<'ALL' | 'KAS_LUNAS' | 'KAS_BELUM' | 'THR_LUNAS' | 'THR_BELUM'>('ALL');
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState<'ALL' | 'KAS_MASUK' | 'THR_MASUK' | 'PENGELUARAN'>('ALL');

  // ODS Reference Tab
  const [odsSheetTab, setOdsSheetTab] = useState<'cash' | 'thr'>('cash');

  // Modals
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [copiedWa, setCopiedWa] = useState(false);
  const [copiedRek, setCopiedRek] = useState(false);

  // Boomer font mode
  const [isBoomerMode, setIsBoomerMode] = useState(false);

  // Form State: Setor (Deposit)
  const [depositForm, setDepositForm] = useState({
    studentId: '',
    category: 'KAS_MASUK' as 'KAS_MASUK' | 'THR_MASUK',
    amount: 200000,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Transfer Mandiri',
    note: '',
    customStudentName: '',
  });

  // Form State: Pengeluaran (Expense)
  const [expenseForm, setExpenseForm] = useState({
    categoryType: 'PENGELUARAN' as 'PENGELUARAN' | 'THR_KELUAR',
    expenseCategory: 'Tanda Kasih Sakit/Duka',
    description: '',
    qty: 1,
    unitPrice: 150000,
    amount: 150000,
    date: new Date().toISOString().split('T')[0],
    pic: 'Mama Bia (Bendahara)',
    note: 'Struk / Bukti Terlampir',
  });

  // Load Boomer mode preference
  useEffect(() => {
    const saved = localStorage.getItem('ambu_boomer_mode');
    if (saved === 'true') {
      setIsBoomerMode(true);
      document.body.classList.add('mode-boomer');
    }
  }, []);

  const toggleBoomerMode = () => {
    const next = !isBoomerMode;
    setIsBoomerMode(next);
    localStorage.setItem('ambu_boomer_mode', String(next));
    if (next) {
      document.body.classList.add('mode-boomer');
    } else {
      document.body.classList.remove('mode-boomer');
    }
  };

  // Fetch data
  const fetchData = async () => {
    try {
      setLoading(true);
      const [txRes, stRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/students'),
      ]);
      const txData = await txRes.json();
      const stData = await stRes.json();

      if (txData.success && Array.isArray(txData.data)) {
        setTransactions(txData.data);
      }
      if (stData.success && Array.isArray(stData.data) && stData.data.length > 0) {
        setStudents(stData.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute Balances
  const stats = useMemo(() => {
    let totalKasMasuk = 0;
    let totalKasKeluar = 0;
    let totalThrMasuk = 0;
    let totalThrKeluar = 0;

    transactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.category === 'KAS_MASUK') totalKasMasuk += amt;
      else if (tx.category === 'PENGELUARAN') totalKasKeluar += amt;
      else if (tx.category === 'THR_MASUK') totalThrMasuk += amt;
      else if (tx.category === 'THR_KELUAR') totalThrKeluar += amt;
    });

    const saldoKas = totalKasMasuk - totalKasKeluar;
    const saldoThr = totalThrMasuk - totalThrKeluar;

    return {
      totalKasMasuk,
      totalKasKeluar,
      saldoKas,
      totalThrMasuk,
      totalThrKeluar,
      saldoThr,
    };
  }, [transactions]);

  // Map student payment status
  const studentPaymentStatus = useMemo(() => {
    return students.map((s) => {
      const kasTxList = transactions.filter(
        (t) => t.studentId === s.id && t.category === 'KAS_MASUK'
      );
      const totalKasPaid = kasTxList.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const kasLunas = totalKasPaid >= 200000;

      const thrTxList = transactions.filter(
        (t) => t.studentId === s.id && t.category === 'THR_MASUK'
      );
      const totalThrPaid = thrTxList.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const thrLunas = totalThrPaid >= 100000;

      return {
        ...s,
        totalKasPaid,
        kasLunas,
        totalThrPaid,
        thrLunas,
      };
    });
  }, [students, transactions]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return studentPaymentStatus.filter((s) => {
      const matchSearch =
        studentSearch === '' ||
        s.fullName.toLowerCase().includes(studentSearch.toLowerCase()) ||
        s.nickname.toLowerCase().includes(studentSearch.toLowerCase()) ||
        String(s.no) === studentSearch.trim();

      if (!matchSearch) return false;

      if (studentFilter === 'KAS_LUNAS') return s.kasLunas;
      if (studentFilter === 'KAS_BELUM') return !s.kasLunas;
      if (studentFilter === 'THR_LUNAS') return s.thrLunas;
      if (studentFilter === 'THR_BELUM') return !s.thrLunas;
      return true;
    });
  }, [studentPaymentStatus, studentSearch, studentFilter]);

  // Running balance for active ledger
  const sortedTransactionsWithBalance = useMemo(() => {
    let runningKas = 0;
    let runningThr = 0;

    const filtered = transactions.filter((tx) => {
      if (ledgerCategoryFilter === 'ALL') return true;
      return tx.category === ledgerCategoryFilter;
    });

    return filtered.map((tx, idx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.category === 'KAS_MASUK') runningKas += amt;
      else if (tx.category === 'PENGELUARAN') runningKas -= amt;
      else if (tx.category === 'THR_MASUK') runningThr += amt;
      else if (tx.category === 'THR_KELUAR') runningThr -= amt;

      const currentBalance =
        tx.category === 'THR_MASUK' || tx.category === 'THR_KELUAR' ? runningThr : runningKas;

      return {
        ...tx,
        rowNo: idx + 1,
        runningBalance: currentBalance,
      };
    });
  }, [transactions, ledgerCategoryFilter]);

  // Open Deposit Modal with Pre-selected Student
  const handleOpenDepositForStudent = (student: StudentItem, category: 'KAS_MASUK' | 'THR_MASUK' = 'KAS_MASUK') => {
    setDepositForm({
      studentId: String(student.id),
      category,
      amount: category === 'KAS_MASUK' ? 200000 : 100000,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Transfer Mandiri',
      note: `Setoran kas/THR ananda ${student.nickname}`,
      customStudentName: `${student.fullName} (${student.nickname})`,
    });
    setIsDepositModalOpen(true);
  };

  // Submit Deposit
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selStudent = students.find((s) => String(s.id) === String(depositForm.studentId));
    const studentName = selStudent
      ? `${selStudent.fullName} (${selStudent.nickname})`
      : depositForm.customStudentName || 'Murid Kelas 4B';

    const desc =
      depositForm.category === 'KAS_MASUK'
        ? `Diterima uang kas dari ${selStudent ? selStudent.fullName : studentName}`
        : `Diterima uang THR dari ${selStudent ? selStudent.fullName : studentName}`;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: depositForm.category,
          amount: Number(depositForm.amount),
          date: depositForm.date,
          studentId: selStudent ? selStudent.id : null,
          studentName,
          description: desc,
          paymentMethod: depositForm.paymentMethod,
          pic: 'Mama Bia (Bendahara)',
          note: depositForm.note || 'Trf Bank Mandiri',
        }),
      });

      const data = await res.json();
      if (data.success) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
        setIsDepositModalOpen(false);
        fetchData();
      } else {
        alert('Gagal mencatat: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch (err: any) {
      alert('Kesalahan koneksi: ' + err.message);
    }
  };

  // Submit Expense
  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = expenseForm.qty > 1 ? expenseForm.qty * expenseForm.unitPrice : expenseForm.amount;

    const desc = expenseForm.description
      ? `${expenseForm.expenseCategory}: ${expenseForm.description}`
      : expenseForm.expenseCategory;

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: expenseForm.categoryType,
          amount: Number(totalAmount),
          date: expenseForm.date,
          description: desc,
          qty: expenseForm.qty > 1 ? expenseForm.qty : null,
          unitPrice: expenseForm.qty > 1 ? expenseForm.unitPrice : null,
          paymentMethod: 'Transfer',
          pic: expenseForm.pic,
          note: expenseForm.note,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setIsExpenseModalOpen(false);
        fetchData();
      } else {
        alert('Gagal mencatat: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch (err: any) {
      alert('Kesalahan: ' + err.message);
    }
  };

  // Delete Transaction
  const handleDeleteTransaction = async (id: string, desc: string) => {
    if (!confirm(`Hapus transaksi ini?\n"${desc}"`)) return;
    try {
      const res = await fetch(`/api/transactions?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // Generate WhatsApp Message
  const waReportText = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const lunasKasList = studentPaymentStatus.filter((s) => s.kasLunas);
    const belumKasList = studentPaymentStatus.filter((s) => !s.kasLunas);

    return `*LAPORAN KAS & THR KELAS 4B* 🌸
*SD ISLAM TAHUN AJARAN 2026-2027*
Per: ${todayStr}

━━━━━━━━━━━━━━━━━━━━
💰 *RINGKASAN KAS KELAS:*
• Total Pemasukan: Rp ${stats.totalKasMasuk.toLocaleString('id-ID')}
• Total Pengeluaran: Rp ${stats.totalKasKeluar.toLocaleString('id-ID')}
• *SISA SALDO KAS: Rp ${stats.saldoKas.toLocaleString('id-ID')}*

🎁 *RINGKASAN UANG THR:*
• Saldo THR Terkumpul: Rp ${stats.saldoThr.toLocaleString('id-ID')}
━━━━━━━━━━━━━━━━━━━━

✅ *SUDAH BAYAR KAS (${lunasKasList.length}/25 Anak):*
${
  lunasKasList.length > 0
    ? lunasKasList.map((s, idx) => `${idx + 1}. ${s.nickname} (Lunas)`).join('\n')
    : '_Belum ada data_'
}

${
  belumKasList.length > 0
    ? `⏳ *BELUM SETOR KAS (${belumKasList.length} Anak):*\n` +
      belumKasList.map((s, idx) => `${idx + 1}. ${s.nickname}`).join('\n')
    : '🎉 *Masya Allah, Semua Murid Sudah Lunas Kas!*'
}

━━━━━━━━━━━━━━━━━━━━
📌 *Rekening Kas Kelas:*
💳 Bank Mandiri: *1270004638738*
a/n Naraya XX (Mama Bia - Bendahara)
Konfirmasi setor: Japri bukti transfer ya Bunda/Mama 🙏

_Terima kasih atas kerja sama dan dukungannya Bunda/Mama semua._ 💐`;
  }, [studentPaymentStatus, stats]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(waReportText);
    setCopiedWa(true);
    setTimeout(() => setCopiedWa(false), 2500);
  };

  const copyRekening = () => {
    navigator.clipboard.writeText('1270004638738');
    setCopiedRek(true);
    setTimeout(() => setCopiedRek(false), 2500);
  };

  // Color generator for student initial avatars
  const getAvatarBg = (no: number) => {
    const colors = [
      'bg-pink-100 text-pink-700 border-pink-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-indigo-100 text-indigo-700 border-indigo-200',
      'bg-amber-100 text-amber-800 border-amber-200',
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-purple-100 text-purple-700 border-purple-200',
      'bg-cyan-100 text-cyan-800 border-cyan-200',
    ];
    return colors[no % colors.length];
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* TOP HEADER */}
      <header className="top-header no-print">
        <div className="container-app flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl font-black shadow-md shadow-teal-700/20">
              4B
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-black text-slate-900 leading-tight flex items-center gap-1.5">
                Kas & THR Kelas 4B 🌸
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-semibold">
                Tahun Ajaran 2026–2027 • Khusus Wali Murid & Pengurus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Boomer Mode Toggle */}
            <button
              onClick={toggleBoomerMode}
              className={`px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-black flex items-center gap-1.5 transition-all border ${
                isBoomerMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-sm'
                  : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
              title="Perbesar huruf agar mudah dibaca mak-mak"
            >
              <Eye className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Huruf Besar:</span>
              <span>{isBoomerMode ? 'Aktif 🔍' : 'Normal'}</span>
            </button>

            {/* WA Button Header */}
            <button
              onClick={() => setIsWaModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-black flex items-center gap-1.5 shadow-md shadow-emerald-700/20 transition-all"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Kirim ke WA Grup</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="container-app py-5 space-y-6">
        
        {/* BANNER UTAMA RAMAH MAK-MAK */}
        <section className="bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-800 text-white rounded-3xl p-5 md:p-7 shadow-xl shadow-teal-950/15 relative overflow-hidden border border-teal-600/30">
          <div className="relative z-10 space-y-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 text-teal-100 text-xs font-bold backdrop-blur-md border border-white/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Praktis di HP • Tinggal Klik & Setor
                </span>
                <h2 className="text-2xl md:text-3xl font-black mt-2 tracking-tight">
                  Halo Bunda & Mama Kelas 4B! 👋
                </h2>
                <p className="text-teal-100 text-sm md:text-base font-medium mt-1">
                  Catatan uang kas dan THR transparan, aman, dan bisa dicek kapan saja.
                </p>
              </div>

              {/* KOTAK SALDO BESAR */}
              <div className="bg-white/15 backdrop-blur-md rounded-2xl p-4 md:p-5 border border-white/25 shadow-inner min-w-[260px]">
                <div className="text-xs font-bold text-teal-200 uppercase tracking-wider">
                  Sisa Saldo Kas Kelas
                </div>
                <div className="text-3xl md:text-4xl font-black text-white tracking-tight mt-1">
                  Rp {stats.saldoKas.toLocaleString('id-ID')}
                </div>
                <div className="text-xs font-semibold text-emerald-200 mt-1.5 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Kas Aktif Terverifikasi
                </div>
              </div>
            </div>

            {/* QUICK STATS CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/15">
                <div className="text-xs text-teal-200 font-bold flex items-center gap-1">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-300" /> Kas Masuk
                </div>
                <div className="text-lg md:text-xl font-black text-white mt-1">
                  Rp {stats.totalKasMasuk.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/15">
                <div className="text-xs text-teal-200 font-bold flex items-center gap-1">
                  <ArrowUpRight className="w-4 h-4 text-rose-300" /> Kas Keluar
                </div>
                <div className="text-lg md:text-xl font-black text-white mt-1">
                  Rp {stats.totalKasKeluar.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/15">
                <div className="text-xs text-amber-200 font-bold flex items-center gap-1">
                  <Gift className="w-4 h-4 text-amber-300" /> Uang THR
                </div>
                <div className="text-lg md:text-xl font-black text-amber-200 mt-1">
                  Rp {stats.saldoThr.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/15">
                <div className="text-xs text-teal-200 font-bold flex items-center gap-1">
                  <Users className="w-4 h-4 text-teal-300" /> Murid Lunas Kas
                </div>
                <div className="text-lg md:text-xl font-black text-white mt-1">
                  {studentPaymentStatus.filter((s) => s.kasLunas).length} dari 25 Anak
                </div>
              </div>
            </div>

            {/* 2 TOMBOL BESAR UTAMA */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  setDepositForm({
                    studentId: '',
                    category: 'KAS_MASUK',
                    amount: 200000,
                    date: new Date().toISOString().split('T')[0],
                    paymentMethod: 'Transfer Mandiri',
                    note: '',
                    customStudentName: '',
                  });
                  setIsDepositModalOpen(true);
                }}
                className="flex-1 bg-amber-400 hover:bg-amber-300 text-teal-950 font-black px-6 py-4 rounded-2xl flex items-center justify-center gap-3 text-lg shadow-lg shadow-amber-400/30 transition-transform active:scale-98"
              >
                <PlusCircle className="w-6 h-6 text-teal-950" />
                <span>+ KLIK DI SINI UNTUK SETOR KAS / THR</span>
              </button>

              <button
                onClick={() => {
                  setExpenseForm({
                    categoryType: 'PENGELUARAN',
                    expenseCategory: 'Tanda Kasih Sakit/Duka',
                    description: '',
                    qty: 1,
                    unitPrice: 150000,
                    amount: 150000,
                    date: new Date().toISOString().split('T')[0],
                    pic: 'Mama Bia (Bendahara)',
                    note: 'Struk / Bukti Terlampir',
                  });
                  setIsExpenseModalOpen(true);
                }}
                className="bg-rose-600/90 hover:bg-rose-600 text-white font-black px-6 py-4 rounded-2xl flex items-center justify-center gap-2 text-base border border-rose-400/40 shadow-lg shadow-rose-950/20 transition-transform active:scale-98"
              >
                <MinusCircle className="w-5 h-5" />
                <span>- Catat Pengeluaran Kelas</span>
              </button>
            </div>
          </div>
        </section>

        {/* REKENING CEPAT BANNER */}
        <section className="bg-white rounded-2xl p-4 border-2 border-teal-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Rekening Kas & THR Kelas 4B (Mandiri)
              </div>
              <div className="text-base md:text-lg font-black text-slate-900 font-mono tracking-wider">
                1270004638738 <span className="text-sm font-sans font-semibold text-slate-600">a/n Naraya XX (Mama Bia)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <button
              onClick={copyRekening}
              className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 transition-all ${
                copiedRek
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
              }`}
            >
              {copiedRek ? (
                <>
                  <Check className="w-4 h-4" /> Nomor Rekening Tersalin!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" /> Salin No. Rekening
                </>
              )}
            </button>
          </div>
        </section>

        {/* NAVIGATION TABS */}
        <section className="no-print flex items-center justify-between border-b-2 border-slate-200 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none w-full">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-800/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              <Users className="w-5 h-5" />
              <span>Daftar 25 Murid & Status</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'ledger'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-800/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              <BookOpen className="w-5 h-5" />
              <span>Buku Kas Aktif (2026/2027)</span>
            </button>

            <button
              onClick={() => setActiveTab('reference_ods')}
              className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'reference_ods'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-800/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>Arsip Acuan ODS (4 Utsman)</span>
            </button>

            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-3 rounded-2xl font-black text-sm md:text-base flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === 'info'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-800/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              <Info className="w-5 h-5" />
              <span>Panduan Mudah</span>
            </button>
          </div>
        </section>

        {/* TAB 1: CHECKLIST 25 MURID & STATUS */}
        {activeTab === 'dashboard' && (
          <section className="space-y-4">
            {/* Search & Filter */}
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama anak Bunda (misal: Afraz, Queen, Sakha, Fathia, Arsen...)"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-teal-600 font-bold text-slate-900 text-sm md:text-base placeholder:font-medium placeholder:text-slate-400"
                />
              </div>

              {/* Status Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  onClick={() => setStudentFilter('ALL')}
                  className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-black whitespace-nowrap transition-all ${
                    studentFilter === 'ALL'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Semua ({studentPaymentStatus.length})
                </button>
                <button
                  onClick={() => setStudentFilter('KAS_LUNAS')}
                  className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-black whitespace-nowrap transition-all ${
                    studentFilter === 'KAS_LUNAS'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  Kas Lunas ({studentPaymentStatus.filter((s) => s.kasLunas).length})
                </button>
                <button
                  onClick={() => setStudentFilter('KAS_BELUM')}
                  className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-black whitespace-nowrap transition-all ${
                    studentFilter === 'KAS_BELUM'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                  }`}
                >
                  Kas Belum ({studentPaymentStatus.filter((s) => !s.kasLunas).length})
                </button>
                <button
                  onClick={() => setStudentFilter('THR_LUNAS')}
                  className={`px-3.5 py-2 rounded-xl text-xs md:text-sm font-black whitespace-nowrap transition-all ${
                    studentFilter === 'THR_LUNAS'
                      ? 'bg-teal-600 text-white shadow-sm'
                      : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-200'
                  }`}
                >
                  THR Lunas ({studentPaymentStatus.filter((s) => s.thrLunas).length})
                </button>
              </div>
            </div>

            {/* List 25 Murid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-3xl p-5 border-2 border-slate-200 shadow-sm hover:shadow-md hover:border-teal-400 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border-2 shrink-0 ${getAvatarBg(
                        s.no
                      )}`}
                    >
                      {s.no}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-black text-slate-900 text-lg md:text-xl truncate">
                          {s.nickname}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold shrink-0">
                          Absen #{s.no}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                        {s.fullName}
                      </div>
                    </div>
                  </div>

                  {/* Status Badges Box */}
                  <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Kas Rutin
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        {s.kasLunas ? (
                          <span className="badge badge-success text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                          </span>
                        ) : (
                          <span className="badge badge-warning text-xs">
                            <Clock className="w-3.5 h-3.5" /> Belum
                          </span>
                        )}
                        <span className="text-xs font-black text-slate-700">
                          Rp {(s.totalKasPaid / 1000).toFixed(0)}k
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                        Uang THR
                      </div>
                      <div className="mt-1 flex items-center justify-between">
                        {s.thrLunas ? (
                          <span className="badge badge-success text-xs">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lunas
                          </span>
                        ) : (
                          <span className="badge badge-warning text-xs">
                            <Clock className="w-3.5 h-3.5" /> Belum
                          </span>
                        )}
                        <span className="text-xs font-black text-slate-700">
                          Rp {(s.totalThrPaid / 1000).toFixed(0)}k
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2 Quick Action Buttons per Murid */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleOpenDepositForStudent(s, 'KAS_MASUK')}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-700/20 active:scale-98 transition-all"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>Setor Kas</span>
                    </button>

                    <button
                      onClick={() => handleOpenDepositForStudent(s, 'THR_MASUK')}
                      className="bg-amber-500 hover:bg-amber-600 text-amber-950 py-2.5 px-3 rounded-xl font-black text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-sm shadow-amber-600/20 active:scale-98 transition-all"
                    >
                      <Gift className="w-4 h-4" />
                      <span>Setor THR</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 2: BUKU KAS AKTIF */}
        {activeTab === 'ledger' && (
          <section className="space-y-4">
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-900 text-lg md:text-xl">
                  Buku Kas & Pengeluaran Kelas 4B (Aktif) 📖
                </h3>
                <p className="text-xs md:text-sm text-slate-500 font-medium">
                  Format tabel pembukuan resmi sesuai acuan format ODS (No, Tanggal, Rincian, Pemasukan, Pengeluaran, Saldo).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={ledgerCategoryFilter}
                  onChange={(e) => setLedgerCategoryFilter(e.target.value as any)}
                  className="px-3.5 py-2.5 rounded-xl border-2 border-slate-300 text-xs md:text-sm font-black bg-white text-slate-800"
                >
                  <option value="ALL">Semua Transaksi</option>
                  <option value="KAS_MASUK">Hanya Kas Masuk</option>
                  <option value="PENGELUARAN">Hanya Pengeluaran Kas</option>
                  <option value="THR_MASUK">Hanya Uang THR</option>
                </select>

                <button
                  onClick={() => setIsDepositModalOpen(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-black flex items-center gap-1.5 shadow-md shadow-teal-700/20"
                >
                  <PlusCircle className="w-4 h-4" /> Catat Baru
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="ods-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Tanggal</th>
                    <th>Keterangan / Transaksi</th>
                    <th>Rincian (Qty × Harga)</th>
                    <th className="text-right">Uang Masuk</th>
                    <th className="text-right">Uang Keluar</th>
                    <th className="text-right">Saldo</th>
                    <th>PIC & Info Rekening</th>
                    <th className="no-print">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactionsWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-10 text-slate-400 font-bold">
                        Belum ada transaksi yang tercatat. Klik tombol "+ Setor Kas" untuk mulai mencatat.
                      </td>
                    </tr>
                  ) : (
                    sortedTransactionsWithBalance.map((tx) => (
                      <tr key={tx.id}>
                        <td className="font-bold text-slate-700">{tx.rowNo}.</td>
                        <td className="whitespace-nowrap font-medium text-slate-600">
                          {tx.date}
                        </td>
                        <td>
                          <div className="font-bold text-slate-900">{tx.description}</div>
                          {tx.note && <div className="text-xs text-slate-500 italic mt-0.5">{tx.note}</div>}
                        </td>
                        <td className="text-xs text-slate-600">
                          {tx.qty && tx.unitPrice ? (
                            <span>
                              {tx.qty} pcs @ Rp {tx.unitPrice.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="text-right font-black text-emerald-700">
                          {tx.type === 'IN' ? `Rp ${tx.amount.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="text-right font-black text-rose-700">
                          {tx.type === 'OUT' ? `Rp ${tx.amount.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="text-right font-black text-slate-900 text-base">
                          Rp {tx.runningBalance.toLocaleString('id-ID')}
                        </td>
                        <td className="text-xs text-slate-700">
                          <span className="font-bold text-teal-800">{tx.pic || 'Mama Bia'}</span>
                          {tx.paymentMethod && (
                            <span className="block text-[11px] text-slate-500">
                              via {tx.paymentMethod}
                            </span>
                          )}
                        </td>
                        <td className="no-print">
                          <button
                            onClick={() => handleDeleteTransaction(tx.id, tx.description)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus baris ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="font-black text-slate-900">
                      TOTAL SALDO KAS KELAS 4B:
                    </td>
                    <td className="text-right font-black text-emerald-800">
                      Rp {stats.totalKasMasuk.toLocaleString('id-ID')}
                    </td>
                    <td className="text-right font-black text-rose-800">
                      Rp {stats.totalKasKeluar.toLocaleString('id-ID')}
                    </td>
                    <td className="text-right font-black text-teal-900 text-lg">
                      Rp {stats.saldoKas.toLocaleString('id-ID')}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* TAB 3: ARSIP ACUAN ODS HISTORIS */}
        {activeTab === 'reference_ods' && (
          <section className="space-y-4">
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-info">Dokumen Acuan Asli</span>
                  <h3 className="font-black text-slate-900 text-lg md:text-xl">
                    Laporan Kas 4 Utsman (Format ODS Acuan)
                  </h3>
                </div>
                <p className="text-xs md:text-sm text-slate-500 font-medium mt-1">
                  Data asli yang diekstrak dari file <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-mono">Laporan Kas 4 Utsman Juni 2026-END.ods</code> sebagai standar pembukuan.
                </p>
              </div>

              {/* Switch Sheet */}
              <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
                <button
                  onClick={() => setOdsSheetTab('cash')}
                  className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all ${
                    odsSheetTab === 'cash'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sheet Kas (50 Baris)
                </button>
                <button
                  onClick={() => setOdsSheetTab('thr')}
                  className={`px-4 py-2.5 rounded-xl text-xs md:text-sm font-black transition-all ${
                    odsSheetTab === 'thr'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sheet THR (26 Baris)
                </button>
              </div>
            </div>

            <div className="table-responsive">
              <table className="ods-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Tanggal</th>
                    <th>Keterangan</th>
                    <th>Qty</th>
                    <th>Harga Satuan</th>
                    <th>Total Harga</th>
                    <th className="text-right">Uang Masuk</th>
                    <th className="text-right">Uang Keluar</th>
                    <th className="text-right">Saldo</th>
                    <th>Keterangan / PIC</th>
                  </tr>
                </thead>
                <tbody>
                  {(odsSheetTab === 'cash' ? ODS_CASH_REFERENCE : ODS_THR_REFERENCE).map((row) => (
                    <tr key={row.no}>
                      <td className="font-bold text-slate-600">{row.no}.</td>
                      <td className="whitespace-nowrap font-medium text-slate-600">{row.date}</td>
                      <td className="font-semibold text-slate-900 max-w-xs">{row.description}</td>
                      <td className="text-xs text-slate-600">{row.qty || '-'}</td>
                      <td className="text-xs text-slate-600">{row.unitPrice || '-'}</td>
                      <td className="text-xs text-slate-600">{row.totalPrice || '-'}</td>
                      <td className="text-right font-bold text-emerald-700">
                        {row.income || '-'}
                      </td>
                      <td className="text-right font-bold text-rose-700">
                        {row.expense || '-'}
                      </td>
                      <td className="text-right font-black text-slate-900">
                        {row.balance}
                      </td>
                      <td className="text-xs text-slate-600 max-w-xs">{row.pic}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 4: PANDUAN MUDAH */}
        {activeTab === 'info' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg md:text-xl">
                    Rekening Kas & THR Kelas 4B
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Tujuan transfer uang kas & THR</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white p-5 rounded-2xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs text-teal-200 font-bold">
                  <span>BANK MANDIRI</span>
                  <span className="badge badge-success text-[10px]">Aktif</span>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Nomor Rekening:</div>
                  <div className="text-2xl md:text-3xl font-mono font-black tracking-wider text-white">
                    1270004638738
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10">
                  <div>
                    <div className="text-[11px] text-slate-400">Atas Nama:</div>
                    <div className="font-bold text-teal-100">Naraya XX (Mama Bia - Bendahara)</div>
                  </div>
                  <button
                    onClick={copyRekening}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Salin
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-amber-50 p-4 rounded-2xl border border-amber-200 space-y-1">
                <div className="font-black text-amber-900">💡 Catatan untuk Bunda & Mama:</div>
                <p className="leading-relaxed">
                  Setelah transfer, Bunda bisa langsung klik tombol kuning <strong>"+ KLIK DI SINI UNTUK SETOR"</strong> di aplikasi ini, pilih nama ananda, dan tekan simpan. Laporan kas langsung terupdate otomatis!
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-900 flex items-center justify-center font-bold">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg md:text-xl">
                    Petunjuk Penggunaan untuk Ibu-Ibu
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Sangat mudah, cuma butuh 3 langkah</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="font-black text-slate-900">Cek Status Anak Bunda</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Lihat kartu nama anak Bunda di daftar 25 murid. Jika sudah bayar, status bertuliskan <strong>Lunas (Hijau)</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="font-black text-slate-900">Tinggal Klik & Submit</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Klik tombol <strong>"Setor Kas"</strong> di sebelah nama anak, pilih nominal instan (Rp 50rb, 100rb, atau 200rb), lalu klik <strong>"Simpan Pembayaran"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <div className="font-black text-slate-900">Salin Rekap ke WhatsApp Grup</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pengurus kelas tinggal klik tombol <strong>"Kirim ke WA"</strong> di pojok kanan atas untuk langsung meng-copy format pesan cantik ke grup WhatsApp kelas 4B.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* MODAL 1: SETOR KAS / THR (SUPER MUDAH UNTUK MAK-MAK) */}
      {isDepositModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="badge badge-success text-xs">Formulir Cepat</span>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                  Catat Setoran Kas / THR 💰
                </h3>
              </div>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-black text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDeposit} className="space-y-4 pt-4">
              {/* 1. Pilih Anak */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Pilih Nama Anak (25 Murid Kelas 4B) *
                </label>
                <select
                  required
                  value={depositForm.studentId}
                  onChange={(e) => setDepositForm({ ...depositForm, studentId: e.target.value })}
                  className="w-full p-3.5 rounded-2xl border-2 border-slate-300 focus:border-teal-600 text-base font-bold text-slate-900 bg-white shadow-sm"
                >
                  <option value="">-- Sentuh untuk Pilih Nama Anak --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.no}. {s.nickname} — {s.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Jenis Setoran */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Jenis Pembayaran *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setDepositForm({ ...depositForm, category: 'KAS_MASUK', amount: 200000 })
                    }
                    className={`p-3.5 rounded-2xl font-black text-sm md:text-base border-2 transition-all flex items-center justify-center gap-2 ${
                      depositForm.category === 'KAS_MASUK'
                        ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-teal-700" /> Uang Kas Rutin
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDepositForm({ ...depositForm, category: 'THR_MASUK', amount: 100000 })
                    }
                    className={`p-3.5 rounded-2xl font-black text-sm md:text-base border-2 transition-all flex items-center justify-center gap-2 ${
                      depositForm.category === 'THR_MASUK'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Gift className="w-5 h-5 text-amber-700" /> Uang THR
                  </button>
                </div>
              </div>

              {/* 3. Tombol Cepat Nominal */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  3. Pilih Nominal (Tinggal Klik) *
                </label>
                <div className="grid grid-cols-3 gap-2.5 mb-2.5">
                  {[50000, 100000, 200000].map((nom) => (
                    <button
                      key={nom}
                      type="button"
                      onClick={() => setDepositForm({ ...depositForm, amount: nom })}
                      className={`chip-btn ${depositForm.amount === nom ? 'active' : ''}`}
                    >
                      Rp {(nom / 1000).toFixed(0)} Ribu
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={depositForm.amount}
                    onChange={(e) =>
                      setDepositForm({ ...depositForm, amount: Number(e.target.value) })
                    }
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-slate-300 focus:border-teal-600 font-black text-slate-900 text-xl"
                  />
                </div>
              </div>

              {/* 4. Tanggal & Metode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Bayar
                  </label>
                  <input
                    type="date"
                    required
                    value={depositForm.date}
                    onChange={(e) => setDepositForm({ ...depositForm, date: e.target.value })}
                    className="w-full p-3.5 rounded-2xl border-2 border-slate-200 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={depositForm.paymentMethod}
                    onChange={(e) =>
                      setDepositForm({ ...depositForm, paymentMethod: e.target.value })
                    }
                    className="w-full p-3.5 rounded-2xl border-2 border-slate-200 font-bold text-slate-800 bg-white"
                  >
                    <option value="Transfer Mandiri">Transfer Bank Mandiri</option>
                    <option value="Transfer BCA">Transfer Bank BCA</option>
                    <option value="Transfer BRI">Transfer Bank BRI</option>
                    <option value="Tunai">Tunai / Cash ke Pengurus</option>
                    <option value="Lainnya">Lainnya / E-Wallet</option>
                  </select>
                </div>
              </div>

              {/* 5. Catatan */}
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Trf Mandiri an Bunda..., lunas s/d Desember"
                  value={depositForm.note}
                  onChange={(e) => setDepositForm({ ...depositForm, note: e.target.value })}
                  className="w-full p-3.5 rounded-2xl border-2 border-slate-200 font-medium text-slate-800 text-sm"
                />
              </div>

              {/* Tombol Simpan Besar */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black text-lg py-4 rounded-2xl shadow-xl shadow-teal-700/25 flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  <Check className="w-6 h-6 stroke-[3]" />
                  <span>SIMPAN & CATAT PEMBAYARAN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CATAT PENGELUARAN */}
      {isExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="badge badge-danger text-xs">Uang Keluar</span>
                <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
                  Catat Pengeluaran Kas Kelas 📝
                </h3>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-black text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Kategori Pengeluaran *
                </label>
                <select
                  value={expenseForm.expenseCategory}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, expenseCategory: e.target.value })
                  }
                  className="w-full p-3.5 rounded-2xl border-2 border-slate-300 focus:border-rose-500 font-bold text-slate-900 bg-white"
                >
                  <option value="Tanda Kasih Sakit/Duka">Tanda Kasih Sakit / Duka (Rp 150.000)</option>
                  <option value="Acara & Konsumsi Hari Guru">Acara & Konsumsi Hari Guru</option>
                  <option value="Konsumsi & Snack Murid">Konsumsi & Snack Murid</option>
                  <option value="Souvenir & Hadiah Murid/Guru">Souvenir & Hadiah Murid / Guru</option>
                  <option value="Perlengkapan Kelas & Pensi">Perlengkapan Kelas / Pensi</option>
                  <option value="Setoran THR ke POMG">Setoran THR ke POMG</option>
                  <option value="Lain-lain">Lain-lain / Biaya Operasional</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Keterangan / Nama Kegiatan *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Tanda cinta sakit ananda..., order pizza PHD, goodybag pensi"
                  value={expenseForm.description}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, description: e.target.value })
                  }
                  className="w-full p-3.5 rounded-2xl border-2 border-slate-200 font-bold text-slate-900 text-sm"
                />
              </div>

              {/* Rincian Qty x Harga Satuan */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Qty / Jumlah (Opsional)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={expenseForm.qty}
                    onChange={(e) => {
                      const q = Math.max(1, Number(e.target.value));
                      setExpenseForm({
                        ...expenseForm,
                        qty: q,
                        amount: q * expenseForm.unitPrice,
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-black text-slate-800 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={expenseForm.unitPrice}
                    onChange={(e) => {
                      const up = Number(e.target.value);
                      setExpenseForm({
                        ...expenseForm,
                        unitPrice: up,
                        amount: expenseForm.qty * up,
                      });
                    }}
                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-black text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  3. Total Nominal Pengeluaran (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-lg">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="1000"
                    required
                    value={expenseForm.amount}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, amount: Number(e.target.value) })
                    }
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 border-rose-300 focus:border-rose-600 font-black text-rose-900 text-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, date: e.target.value })
                    }
                    className="w-full p-3.5 rounded-2xl border-2 border-slate-200 font-bold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    PIC Pengurus
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mama Bia / Ibun Cheryl"
                    value={expenseForm.pic}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, pic: e.target.value })
                    }
                    className="w-full p-3.5 rounded-2xl border-2 border-slate-200 font-bold text-slate-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Rekening / Nota
                </label>
                <input
                  type="text"
                  placeholder="Misal: Trf ke rek BCA an..., CO Shopee, Struk Toko"
                  value={expenseForm.note}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, note: e.target.value })
                  }
                  className="w-full p-3.5 rounded-2xl border-2 border-slate-200 font-medium text-slate-800 text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-lg py-4 rounded-2xl shadow-xl shadow-rose-700/25 flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  <MinusCircle className="w-6 h-6" />
                  <span>SIMPAN PENGELUARAN KAS</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: REKAP FORMAT WHATSAPP (1 KLIK COPY) */}
      {isWaModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-black text-slate-900">
                    Format Pesan WhatsApp Grup 📲
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">Tinggal klik salin lalu paste di grup WA</p>
                </div>
              </div>
              <button
                onClick={() => setIsWaModalOpen(false)}
                className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-black text-lg"
              >
                ✕
              </button>
            </div>

            <div className="pt-4 space-y-4">
              <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl font-mono text-xs md:text-sm max-h-[360px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                {waReportText}
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={copyToClipboard}
                  className={`flex-1 font-black py-4 px-4 rounded-2xl flex items-center justify-center gap-2 text-base transition-all ${
                    copiedWa
                      ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-700/30'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xl shadow-teal-700/25'
                  }`}
                >
                  {copiedWa ? (
                    <>
                      <Check className="w-6 h-6 stroke-[3]" />
                      <span>BERHASIL DISALIN KE CLIPBOARD!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      <span>SALIN PESAN UNTUK WA GRUP (1 KLIK)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM BAR (NAVIGASI KHUSUS HP) */}
      <nav className="mobile-bottom-bar no-print">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`bottom-tab-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <Users />
          <span>25 Murid</span>
        </button>

        <button
          onClick={() => {
            setDepositForm({
              studentId: '',
              category: 'KAS_MASUK',
              amount: 200000,
              date: new Date().toISOString().split('T')[0],
              paymentMethod: 'Transfer Mandiri',
              note: '',
              customStudentName: '',
            });
            setIsDepositModalOpen(true);
          }}
          className="bottom-tab-item text-teal-800"
        >
          <div className="w-12 h-12 rounded-full bg-amber-400 text-teal-950 flex items-center justify-center -mt-6 shadow-lg shadow-amber-400/40 border-2 border-white">
            <PlusCircle className="w-7 h-7 stroke-[2.5]" />
          </div>
          <span className="font-black text-teal-950 text-[11px] mt-0.5">Setor</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`bottom-tab-item ${activeTab === 'ledger' ? 'active' : ''}`}
        >
          <BookOpen />
          <span>Buku Kas</span>
        </button>

        <button
          onClick={() => setActiveTab('reference_ods')}
          className={`bottom-tab-item ${activeTab === 'reference_ods' ? 'active' : ''}`}
        >
          <FileSpreadsheet />
          <span>ODS Asli</span>
        </button>

        <button
          onClick={() => setIsWaModalOpen(true)}
          className="bottom-tab-item text-emerald-700"
        >
          <Send />
          <span>WA</span>
        </button>
      </nav>
    </div>
  );
}
