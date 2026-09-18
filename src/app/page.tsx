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
  FileSpreadsheet
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'ledger' | 'reference_ods' | 'info'>('dashboard');

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

  // Boomer font mode
  const [isBoomerMode, setIsBoomerMode] = useState(false);

  // Form State: Setor (Deposit)
  const [depositForm, setDepositForm] = useState({
    studentId: '',
    category: 'KAS_MASUK' as 'KAS_MASUK' | 'THR_MASUK',
    amount: 200000,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'Transfer Mandiri',
    note: 'Trf ke Rek Kas Kelas',
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

  // Fetch transactions and students from API
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
      // All Kas paid by this student
      const kasTxList = transactions.filter(
        (t) => t.studentId === s.id && t.category === 'KAS_MASUK'
      );
      const totalKasPaid = kasTxList.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const kasLunas = totalKasPaid >= 200000; // Standar kas 1 semester Rp 200rb

      // All THR paid by this student
      const thrTxList = transactions.filter(
        (t) => t.studentId === s.id && t.category === 'THR_MASUK'
      );
      const totalThrPaid = thrTxList.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const thrLunas = totalThrPaid >= 100000; // Standar THR Rp 100rb

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

  // Compute running balance for the current active ledger
  const sortedTransactionsWithBalance = useMemo(() => {
    let runningKas = 0;
    let runningThr = 0;

    // Filter by category if selected
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

  // Handle Quick Deposit Modal Open with Pre-selected Student
  const handleOpenDepositForStudent = (student: StudentItem, category: 'KAS_MASUK' | 'THR_MASUK' = 'KAS_MASUK') => {
    setDepositForm({
      studentId: String(student.id),
      category,
      amount: category === 'KAS_MASUK' ? 200000 : 100000,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'Transfer Mandiri',
      note: `Setoran kas/THR ${student.nickname}`,
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
          note: depositForm.note,
        }),
      });

      const data = await res.json();
      if (data.success) {
        // Trigger celebratory confetti
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
        alert('Gagal mencatat pengeluaran: ' + (data.error || 'Terjadi kesalahan'));
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

    const lunasThrList = studentPaymentStatus.filter((s) => s.thrLunas);
    const belumThrList = studentPaymentStatus.filter((s) => !s.thrLunas);

    return `*LAPORAN KAS & THR KELAS 4B* 🌸
*SD ISLAM TAHUN AJARAN 2026-2027*
Per: ${todayStr}

━━━━━━━━━━━━━━━━━━━━
💰 *RINGKASAN KEUANGAN KAS:*
• Total Pemasukan: Rp ${stats.totalKasMasuk.toLocaleString('id-ID')}
• Total Pengeluaran: Rp ${stats.totalKasKeluar.toLocaleString('id-ID')}
• *SISA SALDO KAS: Rp ${stats.saldoKas.toLocaleString('id-ID')}*

🎁 *RINGKASAN UANG THR:*
• Total Terkumpul: Rp ${stats.totalThrMasuk.toLocaleString('id-ID')}
• Saldo THR Tersimpan: Rp ${stats.saldoThr.toLocaleString('id-ID')}
━━━━━━━━━━━━━━━━━━━━

✅ *STATUS PEMBAYARAN KAS (${lunasKasList.length}/25 Murid Lunas):*
${
  lunasKasList.length > 0
    ? lunasKasList.map((s, idx) => `${idx + 1}. ${s.nickname} (Rp ${s.totalKasPaid.toLocaleString('id-ID')})`).join('\n')
    : '_Belum ada data_'
}

${
  belumKasList.length > 0
    ? `⏳ *BELUM SETOR KAS (${belumKasList.length} Murid):*\n` +
      belumKasList.map((s, idx) => `${idx + 1}. ${s.nickname}`).join('\n')
    : '🎉 *Masya Allah, Semua Murid Sudah Lunas Kas!*'
}

━━━━━━━━━━━━━━━━━━━━
📌 *Rekening Kas Kelas:*
💳 Bank Mandiri: *1270004638738*
a/n Naraya XX (Mama Bia - Bendahara)
Konfirmasi setor: Japri bukti transfer ya Bunda/Mama 🙏

_Jazakumullahu khairan katsiran atas kerja sama dan dukungannya._ 💐`;
  }, [studentPaymentStatus, stats]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(waReportText);
    setCopiedWa(true);
    setTimeout(() => setCopiedWa(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* TOP HEADER */}
      <header className="top-header no-print">
        <div className="container-app flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-teal-700/20">
              4B
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold text-slate-900 leading-tight">
                Kas & THR Kelas 4B 🌸
              </h1>
              <p className="text-xs md:text-sm text-slate-500 font-medium">
                Tahun Ajaran 2026-2027 • Pegangan Mama & Pengurus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Boomer Mode Toggle */}
            <button
              onClick={toggleBoomerMode}
              className={`px-3 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all border ${
                isBoomerMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
              title="Perbesar tulisan agar mudah dibaca ibu-ibu"
            >
              <Eye className="w-4 h-4 text-amber-600" />
              <span className="hidden sm:inline">Huruf Besar</span>
              <span>{isBoomerMode ? 'Aktif' : 'Normal'}</span>
            </button>

            {/* WA Button Header */}
            <button
              onClick={() => setIsWaModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Send className="w-4 h-4" />
              <span className="hidden md:inline">Kirim ke WA</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="container-app py-5 space-y-6">
        {/* HERO GREETING & QUICK BALANCE */}
        <section className="bg-gradient-to-br from-teal-800 via-teal-700 to-emerald-800 text-white rounded-3xl p-5 md:p-7 shadow-xl shadow-teal-900/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none blur-xl"></div>
          <div className="relative z-10 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-900/60 text-teal-200 text-xs font-semibold backdrop-blur-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  Transparan & Ramah Ibu-Ibu
                </span>
                <h2 className="text-xl md:text-2xl font-bold mt-2">
                  Saldo Kas Kelas 4B Saat Ini
                </h2>
                <p className="text-teal-100 text-sm">
                  Update real-time pencatatan kas murid dan pengeluaran kegiatan.
                </p>
              </div>

              {/* Saldo Angka Utama */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[240px]">
                <div className="text-xs text-teal-200 font-medium">Sisa Kas Tersedia</div>
                <div className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mt-0.5">
                  Rp {stats.saldoKas.toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-emerald-200 font-medium mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Uang Kas Aman & Terdata
                </div>
              </div>
            </div>

            {/* Quick Balances Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="text-xs text-teal-200 flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-300" /> Kas Masuk
                </div>
                <div className="text-base md:text-lg font-bold text-white mt-1">
                  Rp {stats.totalKasMasuk.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="text-xs text-teal-200 flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-300" /> Pengeluaran
                </div>
                <div className="text-base md:text-lg font-bold text-white mt-1">
                  Rp {stats.totalKasKeluar.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="text-xs text-amber-200 flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-amber-300" /> Uang THR
                </div>
                <div className="text-base md:text-lg font-bold text-amber-100 mt-1">
                  Rp {stats.saldoThr.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="text-xs text-teal-200 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-teal-300" /> Murid Lunas
                </div>
                <div className="text-base md:text-lg font-bold text-white mt-1">
                  {studentPaymentStatus.filter((s) => s.kasLunas).length} / 25 Anak
                </div>
              </div>
            </div>

            {/* 2 Big Action Buttons: Setor & Keluar */}
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                onClick={() => {
                  setDepositForm({
                    studentId: '',
                    category: 'KAS_MASUK',
                    amount: 200000,
                    date: new Date().toISOString().split('T')[0],
                    paymentMethod: 'Transfer Mandiri',
                    note: 'Trf ke Rek Mandiri Kas',
                    customStudentName: '',
                  });
                  setIsDepositModalOpen(true);
                }}
                className="flex-1 min-w-[160px] bg-emerald-400 hover:bg-emerald-300 text-teal-950 font-black px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-base shadow-lg shadow-emerald-500/20 transition-transform active:scale-98"
              >
                <PlusCircle className="w-5 h-5 text-teal-950" />
                <span>+ Setor Kas / THR</span>
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
                className="flex-1 min-w-[160px] bg-rose-500/90 hover:bg-rose-500 text-white font-bold px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 text-base border border-rose-400/40 shadow-lg shadow-rose-900/20 transition-transform active:scale-98"
              >
                <MinusCircle className="w-5 h-5" />
                <span>- Catat Pengeluaran</span>
              </button>
            </div>
          </div>
        </section>

        {/* DESKTOP / TABLET NAV TABS */}
        <section className="no-print flex items-center justify-between border-b border-slate-200 pb-2">
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm md:text-base flex items-center gap-2 transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Checklist 25 Murid</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm md:text-base flex items-center gap-2 transition-all ${
                activeTab === 'ledger'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Buku Kas Aktif (2026/2027)</span>
            </button>

            <button
              onClick={() => setActiveTab('reference_ods')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm md:text-base flex items-center gap-2 transition-all ${
                activeTab === 'reference_ods'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Arsip Acuan ODS (4 Utsman)</span>
            </button>

            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2.5 rounded-xl font-bold text-sm md:text-base flex items-center gap-2 transition-all ${
                activeTab === 'info'
                  ? 'bg-teal-700 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Rekening Kas & Panduan</span>
            </button>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-white text-slate-700 border border-slate-200 rounded-xl text-sm font-semibold hover:bg-slate-50 flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" /> Cetak Laporan
            </button>
          </div>
        </section>

        {/* TAB 1: CHECKLIST 25 MURID */}
        {activeTab === 'dashboard' && (
          <section className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama anak / panggilan (misal: Afraz, Fathia, Queen...)"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-600 font-medium text-slate-800 text-sm md:text-base"
                />
              </div>

              {/* Status Chips Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                <button
                  onClick={() => setStudentFilter('ALL')}
                  className={`px-3 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                    studentFilter === 'ALL'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua ({studentPaymentStatus.length})
                </button>
                <button
                  onClick={() => setStudentFilter('KAS_LUNAS')}
                  className={`px-3 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                    studentFilter === 'KAS_LUNAS'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  Kas Lunas ({studentPaymentStatus.filter((s) => s.kasLunas).length})
                </button>
                <button
                  onClick={() => setStudentFilter('KAS_BELUM')}
                  className={`px-3 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                    studentFilter === 'KAS_BELUM'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Kas Belum ({studentPaymentStatus.filter((s) => !s.kasLunas).length})
                </button>
                <button
                  onClick={() => setStudentFilter('THR_LUNAS')}
                  className={`px-3 py-2 rounded-xl text-xs md:text-sm font-bold whitespace-nowrap transition-all ${
                    studentFilter === 'THR_LUNAS'
                      ? 'bg-teal-600 text-white'
                      : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
                  }`}
                >
                  THR Lunas ({studentPaymentStatus.filter((s) => s.thrLunas).length})
                </button>
              </div>
            </div>

            {/* List Murid - Responsive Cards for Mobile & Table for Desktop */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredStudents.map((s) => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-900 font-bold flex items-center justify-center text-base border border-teal-200">
                        {s.no}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-base md:text-lg">
                            {s.nickname}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                            No. {s.no}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 line-clamp-1 font-medium">
                          {s.fullName}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Payment Badges */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="text-[11px] text-slate-500 font-semibold">Uang Kas</div>
                      <div className="flex items-center justify-between mt-1">
                        {s.kasLunas ? (
                          <span className="badge badge-success text-xs">
                            <CheckCircle2 className="w-3 h-3" /> Lunas
                          </span>
                        ) : (
                          <span className="badge badge-warning text-xs">
                            <Clock className="w-3 h-3" /> Belum
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-700">
                          {s.totalKasPaid > 0 ? `Rp ${(s.totalKasPaid / 1000).toFixed(0)}k` : 'Rp 0'}
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="text-[11px] text-slate-500 font-semibold">Uang THR</div>
                      <div className="flex items-center justify-between mt-1">
                        {s.thrLunas ? (
                          <span className="badge badge-success text-xs">
                            <CheckCircle2 className="w-3 h-3" /> Lunas
                          </span>
                        ) : (
                          <span className="badge badge-warning text-xs">
                            <Clock className="w-3 h-3" /> Belum
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-700">
                          {s.totalThrPaid > 0 ? `Rp ${(s.totalThrPaid / 1000).toFixed(0)}k` : 'Rp 0'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Setor Action */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleOpenDepositForStudent(s, 'KAS_MASUK')}
                      className="flex-1 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-teal-700" />
                      Setor Kas
                    </button>
                    <button
                      onClick={() => handleOpenDepositForStudent(s, 'THR_MASUK')}
                      className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Gift className="w-3.5 h-3.5 text-amber-700" />
                      Setor THR
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TAB 2: BUKU KAS AKTIF (2026/2027) */}
        {activeTab === 'ledger' && (
          <section className="space-y-4">
            {/* Header & Filter */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">
                  Buku Kas & Pengeluaran Kelas 4B (Aktif)
                </h3>
                <p className="text-xs md:text-sm text-slate-500">
                  Format tabel pembukuan resmi sesuai acuan format ODS (No, Tanggal, Rincian, Pemasukan, Pengeluaran, Saldo).
                </p>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-2">
                <select
                  value={ledgerCategoryFilter}
                  onChange={(e) => setLedgerCategoryFilter(e.target.value as any)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs md:text-sm font-semibold bg-white text-slate-700"
                >
                  <option value="ALL">Semua Transaksi</option>
                  <option value="KAS_MASUK">Hanya Kas Masuk</option>
                  <option value="PENGELUARAN">Hanya Pengeluaran Kas</option>
                  <option value="THR_MASUK">Hanya Uang THR</option>
                </select>

                <button
                  onClick={() => setIsDepositModalOpen(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1"
                >
                  <PlusCircle className="w-4 h-4" /> Catat Baru
                </button>
              </div>
            </div>

            {/* ODS Standard Ledger Table */}
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
                      <td colSpan={9} className="text-center py-8 text-slate-400 font-medium">
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
                          <div className="font-semibold text-slate-900">{tx.description}</div>
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
                        <td className="text-right font-bold text-emerald-700">
                          {tx.type === 'IN' ? `Rp ${tx.amount.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="text-right font-bold text-rose-700">
                          {tx.type === 'OUT' ? `Rp ${tx.amount.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="text-right font-black text-slate-900">
                          Rp {tx.runningBalance.toLocaleString('id-ID')}
                        </td>
                        <td className="text-xs text-slate-700">
                          <span className="font-semibold text-teal-800">{tx.pic || 'Mama Bia'}</span>
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
                    <td className="text-right font-black text-teal-900 text-base">
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
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="badge badge-info">Dokumen Acuan</span>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    Arsip Laporan Kas 4 Utsman (Acuan ODS Asli)
                  </h3>
                </div>
                <p className="text-xs md:text-sm text-slate-500 mt-1">
                  Data asli yang diekstrak langsung dari file <code className="bg-slate-100 px-1 py-0.5 rounded text-teal-800 font-mono">Laporan Kas 4 Utsman Juni 2026-END.ods</code> sebagai pedoman format laporan kelas.
                </p>
              </div>

              {/* Switch Sheet: Cash vs THR */}
              <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setOdsSheetTab('cash')}
                  className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${
                    odsSheetTab === 'cash'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sheet Kas (50 Transaksi)
                </button>
                <button
                  onClick={() => setOdsSheetTab('thr')}
                  className={`px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all ${
                    odsSheetTab === 'thr'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Sheet THR (26 Transaksi)
                </button>
              </div>
            </div>

            {/* ODS Historical Data Table */}
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
                      <td className="font-medium text-slate-900 max-w-xs">{row.description}</td>
                      <td className="text-xs text-slate-600">{row.qty || '-'}</td>
                      <td className="text-xs text-slate-600">{row.unitPrice || '-'}</td>
                      <td className="text-xs text-slate-600">{row.totalPrice || '-'}</td>
                      <td className="text-right font-bold text-emerald-700">
                        {row.income || '-'}
                      </td>
                      <td className="text-right font-bold text-rose-700">
                        {row.expense || '-'}
                      </td>
                      <td className="text-right font-extrabold text-slate-900">
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

        {/* TAB 4: REKENING & PANDUAN */}
        {activeTab === 'info' && (
          <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Rekening Kas Info Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    Rekening Resmi Kas Kelas 4B
                  </h3>
                  <p className="text-xs text-slate-500">Tujuan transfer uang kas & THR</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white p-5 rounded-2xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between text-xs text-teal-200">
                  <span>BANK MANDIRI</span>
                  <span className="badge badge-success text-[10px]">Aktif</span>
                </div>
                <div>
                  <div className="text-xs text-slate-400">Nomor Rekening:</div>
                  <div className="text-2xl font-mono font-black tracking-wider text-white">
                    1270004638738
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10">
                  <div>
                    <div className="text-[11px] text-slate-400">Atas Nama:</div>
                    <div className="font-bold text-teal-100">Naraya XX (Mama Bia)</div>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText('1270004638738');
                      alert('Nomor rekening Mandiri berhasil disalin!');
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" /> Salin No. Rek
                  </button>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-amber-50 p-3.5 rounded-xl border border-amber-200 space-y-1">
                <div className="font-bold text-amber-900">💡 Catatan untuk Bunda & Mama:</div>
                <p>
                  Setelah transfer, mohon kirim bukti transfer ke WhatsApp Mama Bia (Bendahara) atau bisa langsung masukkan via tombol <strong>"+ Setor Kas"</strong> di aplikasi ini.
                </p>
              </div>
            </div>

            {/* Panduan Mak-Mak */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-900 flex items-center justify-center">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    Petunjuk Penggunaan Mudah
                  </h3>
                  <p className="text-xs text-slate-500">Dirancang khusus agar praktis di HP</p>
                </div>
              </div>

              <div className="space-y-3 text-sm text-slate-700">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Buka Checklist 25 Murid</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Cari nama anak Bunda di kolom pencarian. Status pembayaran Kas & THR terlihat langsung (Lunas / Belum).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Klik "Setor Kas" atau "+ Setor"</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pilih nominal cepat (Rp 50rb, 100rb, atau 200rb), lalu klik tombol hijau <strong>"Simpan Setoran"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Salin Rekap ke WhatsApp Grup</div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Bendahara / pengurus tinggal klik tombol <strong>"Kirim ke WA"</strong> untuk langsung meng-copy format rekap cantik ke grup kelas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* MODAL 1: SETOR UANG KAS / THR (SUPER MUDAH UNTUK MAK-MAK) */}
      {isDepositModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="badge badge-success text-xs">Formulir Cepat</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  Catat Setoran Kas / THR 💰
                </h3>
              </div>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitDeposit} className="space-y-4 pt-4">
              {/* 1. Pilih Anak */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Pilih Nama Anak (25 Murid Kelas 4B) *
                </label>
                <select
                  required
                  value={depositForm.studentId}
                  onChange={(e) => setDepositForm({ ...depositForm, studentId: e.target.value })}
                  className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-teal-600 text-base font-semibold text-slate-900 bg-white"
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  2. Jenis Pembayaran *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDepositForm({ ...depositForm, category: 'KAS_MASUK', amount: 200000 })
                    }
                    className={`p-3 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-1.5 ${
                      depositForm.category === 'KAS_MASUK'
                        ? 'border-teal-600 bg-teal-50 text-teal-900'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <Wallet className="w-4 h-4" /> Uang Kas Rutin
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setDepositForm({ ...depositForm, category: 'THR_MASUK', amount: 100000 })
                    }
                    className={`p-3 rounded-xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-1.5 ${
                      depositForm.category === 'THR_MASUK'
                        ? 'border-amber-500 bg-amber-50 text-amber-900'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <Gift className="w-4 h-4" /> Uang THR
                  </button>
                </div>
              </div>

              {/* 3. Tombol Cepat Nominal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  3. Pilih Nominal Setoran (Tinggal Klik) *
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
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
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
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
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-slate-200 focus:border-teal-600 font-black text-slate-900 text-lg"
                  />
                </div>
              </div>

              {/* 4. Tanggal & Metode */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal Bayar
                  </label>
                  <input
                    type="date"
                    required
                    value={depositForm.date}
                    onChange={(e) => setDepositForm({ ...depositForm, date: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={depositForm.paymentMethod}
                    onChange={(e) =>
                      setDepositForm({ ...depositForm, paymentMethod: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-800 bg-white"
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan / Keterangan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Trf atas nama Bunda ..., lunas semester 1"
                  value={depositForm.note}
                  onChange={(e) => setDepositForm({ ...depositForm, note: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 font-medium text-slate-800 text-sm"
                />
              </div>

              {/* Tombol Simpan Besar Ramah Jempol */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-lg py-4 rounded-2xl shadow-lg shadow-teal-700/25 flex items-center justify-center gap-2 transition-transform active:scale-98"
                >
                  <Check className="w-6 h-6 stroke-[3]" />
                  <span>SIMPAN & CATAT PEMBAYARAN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CATAT PENGELUARAN (UNTUK PENGURUS/BENDAHARA) */}
      {isExpenseModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="badge badge-danger text-xs">Uang Keluar</span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  Catat Pengeluaran Kas Kelas 📝
                </h3>
              </div>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  1. Kategori Pengeluaran *
                </label>
                <select
                  value={expenseForm.expenseCategory}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, expenseCategory: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border-2 border-slate-200 focus:border-rose-500 font-semibold text-slate-900 bg-white"
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
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
                  className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-900 text-sm"
                />
              </div>

              {/* Rincian Qty x Harga Satuan */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
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
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold text-slate-800 bg-white"
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
                    className="w-full p-2.5 rounded-lg border border-slate-200 font-bold text-slate-800 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  3. Total Nominal Pengeluaran (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400">
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
                    className="w-full pl-11 pr-4 py-3 rounded-xl border-2 border-rose-300 focus:border-rose-600 font-black text-rose-900 text-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    required
                    value={expenseForm.date}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, date: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                    className="w-full p-3 rounded-xl border border-slate-200 font-semibold text-slate-800 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Catatan Rekening / Nota
                </label>
                <input
                  type="text"
                  placeholder="Misal: Trf ke rek BCA an..., CO Shopee, Struk Toko"
                  value={expenseForm.note}
                  onChange={(e) =>
                    setExpenseForm({ ...expenseForm, note: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-slate-200 font-medium text-slate-800 text-sm"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-lg py-4 rounded-2xl shadow-lg shadow-rose-700/25 flex items-center justify-center gap-2 transition-transform active:scale-98"
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
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">
                    Format Pesan WhatsApp Grup 📲
                  </h3>
                  <p className="text-xs text-slate-500">Tinggal klik salin lalu paste di grup WA</p>
                </div>
              </div>
              <button
                onClick={() => setIsWaModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center font-bold"
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
                  className={`flex-1 font-extrabold py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-base transition-all ${
                    copiedWa
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/30'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-700/25'
                  }`}
                >
                  {copiedWa ? (
                    <>
                      <Check className="w-5 h-5 stroke-[3]" />
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

      {/* MOBILE BOTTOM BAR (NAVIGASI KHUSUS HP RAMAH IBU-IBU) */}
      <nav className="mobile-bottom-bar no-print">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`bottom-tab-item ${activeTab === 'dashboard' ? 'active' : ''}`}
        >
          <Users />
          <span>Murid</span>
        </button>

        <button
          onClick={() => {
            setDepositForm({
              studentId: '',
              category: 'KAS_MASUK',
              amount: 200000,
              date: new Date().toISOString().split('T')[0],
              paymentMethod: 'Transfer Mandiri',
              note: 'Trf ke Rek Mandiri Kas',
              customStudentName: '',
            });
            setIsDepositModalOpen(true);
          }}
          className="bottom-tab-item text-emerald-700"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center -mt-4 shadow-md shadow-emerald-700/30">
            <PlusCircle className="w-6 h-6" />
          </div>
          <span className="font-extrabold text-emerald-700 text-[11px] mt-0.5">Setor</span>
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
          className="bottom-tab-item text-teal-700"
        >
          <Send />
          <span>WA</span>
        </button>
      </nav>
    </div>
  );
}
