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
  Download,
  LogIn,
  LogOut,
  UserCheck,
  Lock,
  Heart,
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { STUDENTS_KELAS_4B, StudentItem } from '@/lib/students';

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

  // User session state: role & student
  // role: 'GUEST' | 'MAMA' | 'BENDAHARA'
  const [userRole, setUserRole] = useState<'GUEST' | 'MAMA' | 'BENDAHARA'>('GUEST');
  const [currentMamaStudent, setCurrentMamaStudent] = useState<StudentItem | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginSelectedStudentId, setLoginSelectedStudentId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginRoleType, setLoginRoleType] = useState<'MAMA' | 'BENDAHARA'>('MAMA');
  const [loginError, setLoginError] = useState('');

  // Active navigation tab: 'dashboard' | 'ledger' | 'info'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'info'>('dashboard');

  // Search & Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<'ALL' | 'KAS_LUNAS' | 'KAS_BELUM' | 'THR_LUNAS' | 'THR_BELUM'>('ALL');
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState<'ALL' | 'KAS_MASUK' | 'THR_MASUK' | 'PENGELUARAN'>('ALL');

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

  // Load Boomer mode & Saved Login from localStorage
  useEffect(() => {
    const savedBoomer = localStorage.getItem('ambu_boomer_mode');
    if (savedBoomer === 'true') {
      setIsBoomerMode(true);
      document.body.classList.add('mode-boomer');
    }

    const savedRole = localStorage.getItem('ambu_user_role');
    const savedStudentId = localStorage.getItem('ambu_student_id');

    if (savedRole === 'BENDAHARA') {
      setUserRole('BENDAHARA');
    } else if (savedRole === 'MAMA' && savedStudentId) {
      const found = STUDENTS_KELAS_4B.find((s) => String(s.id) === savedStudentId);
      if (found) {
        setUserRole('MAMA');
        setCurrentMamaStudent(found);
      }
    } else {
      // First time visitor: show welcoming login modal gently
      setIsLoginModalOpen(true);
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

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    // PIN sementara: default "4B" atau "1234"
    const validPins = ['4B', '4b', '1234', ''];

    if (loginRoleType === 'BENDAHARA') {
      if (loginPin.trim() === '4B' || loginPin.trim() === '4b' || loginPin.trim() === 'bendahara' || loginPin.trim() === '1234') {
        setUserRole('BENDAHARA');
        setCurrentMamaStudent(null);
        localStorage.setItem('ambu_user_role', 'BENDAHARA');
        localStorage.removeItem('ambu_student_id');
        setIsLoginModalOpen(false);
        confetti({ particleCount: 60, spread: 60 });
      } else {
        setLoginError('Password pengurus salah. Gunakan kata sandi sementara: 4B');
      }
      return;
    }

    // Login as Mama
    if (!loginSelectedStudentId) {
      setLoginError('Silakan sentuh dan pilih nama ananda Bunda terlebih dahulu.');
      return;
    }

    const st = students.find((s) => String(s.id) === String(loginSelectedStudentId));
    if (!st) {
      setLoginError('Data ananda tidak ditemukan.');
      return;
    }

    setUserRole('MAMA');
    setCurrentMamaStudent(st);
    localStorage.setItem('ambu_user_role', 'MAMA');
    localStorage.setItem('ambu_student_id', String(st.id));
    setIsLoginModalOpen(false);
    confetti({ particleCount: 70, spread: 60 });
  };

  const handleLogout = () => {
    setUserRole('GUEST');
    setCurrentMamaStudent(null);
    localStorage.removeItem('ambu_user_role');
    localStorage.removeItem('ambu_student_id');
    setIsLoginModalOpen(true);
  };

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

  // Current logged in Mama's child status
  const myChildStatus = useMemo(() => {
    if (!currentMamaStudent) return null;
    return studentPaymentStatus.find((s) => s.id === currentMamaStudent.id) || null;
  }, [currentMamaStudent, studentPaymentStatus]);

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
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#0d9488', '#f59e0b', '#ec4899', '#10b981', '#6366f1'],
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

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      // 1. Sheet Buku Kas
      const kasData = sortedTransactionsWithBalance.map((tx) => ({
        'No.': tx.rowNo,
        'Tanggal': tx.date,
        'Keterangan Transaksi': tx.description,
        'Qty': tx.qty || '',
        'Harga Satuan (Rp)': tx.unitPrice || '',
        'Uang Masuk (Rp)': tx.type === 'IN' ? tx.amount : 0,
        'Uang Keluar (Rp)': tx.type === 'OUT' ? tx.amount : 0,
        'Saldo Berjalan (Rp)': tx.runningBalance,
        'PIC / Pengurus': tx.pic || 'Mama Bia',
        'Metode Bayar': tx.paymentMethod || '',
        'Catatan / Rekening': tx.note || '',
      }));

      // 2. Sheet Rekap Murid
      const muridData = studentPaymentStatus.map((s) => ({
        'No. Absen': s.no,
        'Nama Lengkap': s.fullName,
        'Nama Panggilan': s.nickname,
        'Total Kas Dibayar (Rp)': s.totalKasPaid,
        'Status Kas': s.kasLunas ? 'LUNAS' : 'BELUM',
        'Total THR Dibayar (Rp)': s.totalThrPaid,
        'Status THR': s.thrLunas ? 'LUNAS' : 'BELUM',
      }));

      const wb = XLSX.utils.book_new();
      const wsKas = XLSX.utils.json_to_sheet(kasData);
      const wsMurid = XLSX.utils.json_to_sheet(muridData);

      XLSX.utils.book_append_sheet(wb, wsKas, 'Buku Kas 4B');
      XLSX.utils.book_append_sheet(wb, wsMurid, 'Status 25 Murid');

      const dateStr = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Laporan_Kas_Kelas_4B_${dateStr}.xlsx`);
    } catch (err: any) {
      alert('Gagal mengekspor Excel: ' + err.message);
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

  const getAvatarBg = (no: number) => {
    const colors = [
      'bg-gradient-to-br from-pink-50 to-pink-100 text-pink-700 border-pink-200',
      'bg-gradient-to-br from-teal-50 to-teal-100 text-teal-800 border-teal-200',
      'bg-gradient-to-br from-indigo-50 to-indigo-100 text-indigo-700 border-indigo-200',
      'bg-gradient-to-br from-amber-50 to-amber-100 text-amber-800 border-amber-200',
      'bg-gradient-to-br from-emerald-50 to-emerald-100 text-emerald-800 border-emerald-200',
      'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-700 border-purple-200',
      'bg-gradient-to-br from-cyan-50 to-cyan-100 text-cyan-800 border-cyan-200',
    ];
    return colors[no % colors.length];
  };

  return (
    <div className="min-h-screen text-slate-800 relative">
      {/* AMBIENT BACKGROUND ANIMATION */}
      <div className="ambient-bg">
        <div className="ambient-blob blob-1"></div>
        <div className="ambient-blob blob-2"></div>
        <div className="ambient-blob blob-3"></div>
      </div>

      {/* TOP HEADER */}
      <header className="top-header no-print">
        <div className="container-app flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ rotate: 10, scale: 1.05 }}
              className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 text-white flex items-center justify-center text-lg md:text-xl font-black shadow-lg shadow-teal-700/25 border-2 border-white"
            >
              4B
            </motion.div>
            <div>
              <h1 className="text-sm md:text-lg font-black text-slate-900 leading-tight flex items-center gap-1">
                Kas & THR Kelas 4B <span className="inline-block animate-bounce">🌸</span>
              </h1>
              <p className="text-[10px] md:text-xs text-slate-500 font-bold">
                Tahun Ajaran 2026–2027 • Pegangan Mama
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2">
            {/* User Login Indicator */}
            {userRole === 'MAMA' && currentMamaStudent ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLoginModalOpen(true)}
                className="px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1"
                title="Klik untuk ganti nama anak / akun"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span className="truncate max-w-[90px] md:max-w-none">
                  Mama {currentMamaStudent.nickname}
                </span>
              </motion.button>
            ) : userRole === 'BENDAHARA' ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLoginModalOpen(true)}
                className="px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl text-xs font-black bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-purple-700" />
                <span>Pengurus</span>
              </motion.button>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLoginModalOpen(true)}
                className="px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl text-xs font-black bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5 text-teal-700" />
                <span>Pilih Mama</span>
              </motion.button>
            )}

            {/* Boomer Mode Toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleBoomerMode}
              className={`px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl text-xs font-black flex items-center gap-1 border ${
                isBoomerMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
              title="Perbesar teks"
            >
              <Eye className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Huruf:</span>
              <span>{isBoomerMode ? 'Besar' : 'Normal'}</span>
            </motion.button>

            {/* Export Excel Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleExportExcel}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1.5 md:px-3 md:py-2 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm"
              title="Unduh Laporan Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Export Excel</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="container-app py-3 md:py-4 space-y-4">

        {/* WELCOME BANNER KHUSUS MAMA / IBU-IBU */}
        {userRole === 'MAMA' && currentMamaStudent && myChildStatus ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-amber-50 via-teal-50 to-emerald-50 rounded-2xl p-3.5 md:p-4 border-2 border-teal-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                🌸
              </div>
              <div>
                <div className="text-xs font-black text-teal-800 uppercase tracking-wide">
                  Selamat Datang, Bunda / Mama {currentMamaStudent.nickname}! 💖
                </div>
                <div className="text-xs md:text-sm text-slate-600 font-semibold mt-0.5">
                  Ananda: <strong>{currentMamaStudent.fullName}</strong> (No. Absen {currentMamaStudent.no})
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge ${myChildStatus.kasLunas ? 'badge-success' : 'badge-warning'} text-[11px]`}>
                    Kas: {myChildStatus.kasLunas ? '✅ Lunas' : '⏳ Belum Lunas'}
                  </span>
                  <span className={`badge ${myChildStatus.thrLunas ? 'badge-success' : 'badge-warning'} text-[11px]`}>
                    THR: {myChildStatus.thrLunas ? '✅ Lunas' : '⏳ Belum Lunas'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => handleOpenDepositForStudent(currentMamaStudent, 'KAS_MASUK')}
                className="flex-1 sm:flex-initial bg-teal-600 hover:bg-teal-700 text-white font-black px-4 py-2.5 rounded-xl text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-teal-700/20"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Setor untuk {currentMamaStudent.nickname}</span>
              </motion.button>
              <button
                onClick={handleLogout}
                className="text-xs font-bold text-slate-500 hover:text-rose-600 px-2.5 py-2 rounded-lg"
                title="Bukan Mama ini? Klik untuk ganti"
              >
                Ganti
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-3 md:p-3.5 border border-slate-200 shadow-sm flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2.5 text-xs md:text-sm text-slate-700 font-semibold">
              <span className="text-lg">👋</span>
              <span>
                Bunda belum memilih nama ananda?{' '}
                <strong className="text-teal-700">Pilih sekali agar saat setor langsung otomatis!</strong>
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-1.5 rounded-xl text-xs font-black shrink-0"
            >
              Pilih Nama Anak
            </motion.button>
          </motion.div>
        )}
        
        {/* HERO CARD COMPACT */}
        <motion.section
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-800 text-white rounded-3xl p-4 md:p-5 shadow-xl shadow-teal-950/15 relative overflow-hidden border border-teal-700/40"
        >
          <div className="relative z-10 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-teal-100 text-[11px] font-bold backdrop-blur-md border border-white/20">
                  <span className="live-dot"></span>
                  Laporan Transparan Kelas 4B
                </div>
                <h2 className="text-lg md:text-2xl font-black mt-1 tracking-tight">
                  Buku Kas & Uang THR Murid 🌸
                </h2>
              </div>

              {/* SISA SALDO KOTAK */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/20 shadow-inner flex items-center justify-between sm:flex-col sm:items-start sm:min-w-[200px]">
                <div className="text-[11px] font-bold text-teal-200 uppercase tracking-wider">
                  Sisa Saldo Kas
                </div>
                <div className="text-2xl md:text-3xl font-black text-white tracking-tight">
                  Rp {stats.saldoKas.toLocaleString('id-ID')}
                </div>
              </div>
            </div>

            {/* 4 MINI STATS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
                <div className="text-[11px] text-teal-200 font-bold flex items-center gap-1">
                  <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-300" /> Kas Masuk
                </div>
                <div className="text-sm md:text-base font-black text-white mt-0.5 truncate">
                  Rp {stats.totalKasMasuk.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
                <div className="text-[11px] text-teal-200 font-bold flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-rose-300" /> Kas Keluar
                </div>
                <div className="text-sm md:text-base font-black text-white mt-0.5 truncate">
                  Rp {stats.totalKasKeluar.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
                <div className="text-[11px] text-amber-200 font-bold flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-amber-300" /> Uang THR
                </div>
                <div className="text-sm md:text-base font-black text-amber-200 mt-0.5 truncate">
                  Rp {stats.saldoThr.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2.5 border border-white/10">
                <div className="text-[11px] text-teal-200 font-bold flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-teal-300" /> Lunas Kas
                </div>
                <div className="text-sm md:text-base font-black text-white mt-0.5">
                  {studentPaymentStatus.filter((s) => s.kasLunas).length} / 25 Anak
                </div>
              </div>
            </div>

            {/* TOMBOL UTAMA PULSING */}
            <div className="flex flex-col sm:flex-row gap-2 pt-0.5">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setDepositForm({
                    studentId: currentMamaStudent ? String(currentMamaStudent.id) : '',
                    category: 'KAS_MASUK',
                    amount: 200000,
                    date: new Date().toISOString().split('T')[0],
                    paymentMethod: 'Transfer Mandiri',
                    note: currentMamaStudent ? `Setoran kas ananda ${currentMamaStudent.nickname}` : '',
                    customStudentName: currentMamaStudent ? `${currentMamaStudent.fullName} (${currentMamaStudent.nickname})` : '',
                  });
                  setIsDepositModalOpen(true);
                }}
                className="btn-golden-glow flex-1 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-teal-950 font-black px-4 py-3 md:py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm md:text-base border-2 border-white/60"
              >
                <PlusCircle className="w-5 h-5 text-teal-950 stroke-[2.5]" />
                <span>
                  {currentMamaStudent
                    ? `+ SETOR KAS UNTUK ${currentMamaStudent.nickname.toUpperCase()}`
                    : '+ KLIK DI SINI UNTUK SETOR KAS / THR'}
                </span>
              </motion.button>

              {userRole === 'BENDAHARA' && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
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
                  className="bg-rose-600/90 hover:bg-rose-600 text-white font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs md:text-sm border border-rose-400/30 shadow-md"
                >
                  <MinusCircle className="w-4 h-4" />
                  <span>- Catat Pengeluaran</span>
                </motion.button>
              )}
            </div>
          </div>
        </motion.section>

        {/* REKENING MANDIRI CARD */}
        <motion.section
          whileHover={{ y: -2 }}
          className="bg-white rounded-2xl p-3 md:p-3.5 border-2 border-teal-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-2.5"
        >
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold shrink-0">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Rekening Kas & THR (Bank Mandiri)
              </div>
              <div className="text-sm md:text-base font-black text-slate-900 font-mono tracking-wider truncate">
                1270004638738 <span className="text-xs font-sans font-semibold text-teal-800">a/n Naraya (Mama Bia)</span>
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={copyRekening}
            className={`w-full sm:w-auto px-3.5 py-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm ${
              copiedRek
                ? 'bg-emerald-600 text-white'
                : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
            }`}
          >
            {copiedRek ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[3]" /> Tersalin!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" /> Salin No. Rekening
              </>
            )}
          </motion.button>
        </motion.section>

        {/* NAVIGATION TABS */}
        <section className="no-print flex items-center justify-between border-b-2 border-slate-200 pb-1">
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none w-full">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 rounded-xl font-black text-xs md:text-sm flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'dashboard'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-800/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Daftar 25 Murid</span>
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-2 rounded-xl font-black text-xs md:text-sm flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'ledger'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-800/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span>Buku Kas Aktif</span>
            </button>

            <button
              onClick={() => setActiveTab('info')}
              className={`px-3.5 py-2 rounded-xl font-black text-xs md:text-sm flex items-center gap-1.5 transition-all whitespace-nowrap ${
                activeTab === 'info'
                  ? 'bg-teal-700 text-white shadow-md shadow-teal-800/20'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-300'
              }`}
            >
              <Info className="w-4 h-4" />
              <span>Panduan</span>
            </button>

            <button
              onClick={handleExportExcel}
              className="ml-auto px-3.5 py-2 rounded-xl font-black text-xs md:text-sm flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Excel (.xlsx)</span>
            </button>
          </div>
        </section>

        {/* TAB 1: CHECKLIST 25 MURID */}
        {activeTab === 'dashboard' && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            {/* Search & Filters */}
            <div className="bg-white p-3 md:p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ketik nama anak Bunda (misal: Afraz, Queen, Sakha, Fathia...)"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border-2 border-slate-200 focus:border-teal-600 font-bold text-slate-900 text-xs md:text-sm placeholder:font-medium placeholder:text-slate-400"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
                <button
                  onClick={() => setStudentFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black whitespace-nowrap transition-all ${
                    studentFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Semua ({studentPaymentStatus.length})
                </button>
                <button
                  onClick={() => setStudentFilter('KAS_LUNAS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black whitespace-nowrap transition-all ${
                    studentFilter === 'KAS_LUNAS'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  Kas Lunas ({studentPaymentStatus.filter((s) => s.kasLunas).length})
                </button>
                <button
                  onClick={() => setStudentFilter('KAS_BELUM')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black whitespace-nowrap transition-all ${
                    studentFilter === 'KAS_BELUM'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  Kas Belum ({studentPaymentStatus.filter((s) => !s.kasLunas).length})
                </button>
                <button
                  onClick={() => setStudentFilter('THR_LUNAS')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-black whitespace-nowrap transition-all ${
                    studentFilter === 'THR_LUNAS'
                      ? 'bg-teal-600 text-white'
                      : 'bg-teal-50 text-teal-800 border border-teal-200'
                  }`}
                >
                  THR Lunas ({studentPaymentStatus.filter((s) => s.thrLunas).length})
                </button>
              </div>
            </div>

            {/* List 25 Murid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {filteredStudents.map((s, idx) => {
                const isMyChild = currentMamaStudent?.id === s.id;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: Math.min(idx * 0.02, 0.25) }}
                    className={`card-hover-fx bg-white rounded-2xl p-3 border-2 shadow-sm flex flex-col justify-between space-y-2.5 ${
                      isMyChild ? 'border-teal-500 ring-2 ring-teal-300/40 bg-teal-50/20' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border shrink-0 ${getAvatarBg(
                          s.no
                        )}`}
                      >
                        {s.no}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-slate-900 text-sm md:text-base truncate flex items-center gap-1">
                            {s.nickname}
                            {isMyChild && <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.2 rounded-full font-bold">Anak Bunda</span>}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold shrink-0">
                            #{s.no}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium truncate">
                          {s.fullName}
                        </div>
                      </div>
                    </div>

                    {/* Status Pills */}
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          Kas Rutin
                        </div>
                        <div className="mt-0.5 flex items-center justify-between">
                          {s.kasLunas ? (
                            <span className="badge badge-success text-[10px] py-0.5 px-1.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Lunas
                            </span>
                          ) : (
                            <span className="badge badge-warning text-[10px] py-0.5 px-1.5">
                              <Clock className="w-2.5 h-2.5" /> Belum
                            </span>
                          )}
                          <span className="text-[11px] font-black text-slate-700">
                            {s.totalKasPaid > 0 ? `Rp ${(s.totalKasPaid / 1000).toFixed(0)}k` : 'Rp 0'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          Uang THR
                        </div>
                        <div className="mt-0.5 flex items-center justify-between">
                          {s.thrLunas ? (
                            <span className="badge badge-success text-[10px] py-0.5 px-1.5">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Lunas
                            </span>
                          ) : (
                            <span className="badge badge-warning text-[10px] py-0.5 px-1.5">
                              <Clock className="w-2.5 h-2.5" /> Belum
                            </span>
                          )}
                          <span className="text-[11px] font-black text-slate-700">
                            {s.totalThrPaid > 0 ? `Rp ${(s.totalThrPaid / 1000).toFixed(0)}k` : 'Rp 0'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Setor Buttons */}
                    <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOpenDepositForStudent(s, 'KAS_MASUK')}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-2 rounded-lg font-black text-[11px] flex items-center justify-center gap-1 shadow-sm transition-all"
                      >
                        <PlusCircle className="w-3 h-3" /> Setor Kas
                      </motion.button>

                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleOpenDepositForStudent(s, 'THR_MASUK')}
                        className="bg-amber-500 hover:bg-amber-600 text-amber-950 py-1.5 px-2 rounded-lg font-black text-[11px] flex items-center justify-center gap-1 shadow-sm transition-all"
                      >
                        <Gift className="w-3 h-3" /> Setor THR
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* TAB 2: BUKU KAS AKTIF */}
        {activeTab === 'ledger' && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-black text-slate-900 text-sm md:text-base">
                  Buku Kas & Pengeluaran Kelas 4B 📖
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Format pembukuan resmi dengan saldo berjalan otomatis.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={ledgerCategoryFilter}
                  onChange={(e) => setLedgerCategoryFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg border-2 border-slate-200 text-xs font-black bg-white text-slate-800"
                >
                  <option value="ALL">Semua Transaksi</option>
                  <option value="KAS_MASUK">Hanya Kas Masuk</option>
                  <option value="PENGELUARAN">Hanya Pengeluaran Kas</option>
                  <option value="THR_MASUK">Hanya Uang THR</option>
                </select>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExportExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-black flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh
                </motion.button>
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
                    <th>PIC & Rekening</th>
                    {userRole === 'BENDAHARA' && <th className="no-print">Aksi</th>}
                  </tr>
                </thead>
                <tbody>
                  {sortedTransactionsWithBalance.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-slate-400 font-bold text-xs">
                        Belum ada transaksi. Klik tombol "+ Setor Kas" untuk mulai mencatat.
                      </td>
                    </tr>
                  ) : (
                    sortedTransactionsWithBalance.map((tx) => (
                      <tr key={tx.id}>
                        <td className="font-bold text-slate-700 text-xs">{tx.rowNo}.</td>
                        <td className="whitespace-nowrap font-medium text-slate-600 text-xs">
                          {tx.date}
                        </td>
                        <td>
                          <div className="font-bold text-slate-900 text-xs">{tx.description}</div>
                          {tx.note && <div className="text-[10px] text-slate-500 italic mt-0.5">{tx.note}</div>}
                        </td>
                        <td className="text-[11px] text-slate-600">
                          {tx.qty && tx.unitPrice ? (
                            <span>
                              {tx.qty} pcs @ Rp {tx.unitPrice.toLocaleString('id-ID')}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="text-right font-black text-emerald-700 text-xs">
                          {tx.type === 'IN' ? `Rp ${tx.amount.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="text-right font-black text-rose-700 text-xs">
                          {tx.type === 'OUT' ? `Rp ${tx.amount.toLocaleString('id-ID')}` : '-'}
                        </td>
                        <td className="text-right font-black text-slate-900 text-xs">
                          Rp {tx.runningBalance.toLocaleString('id-ID')}
                        </td>
                        <td className="text-xs text-slate-700">
                          <span className="font-bold text-teal-800">{tx.pic || 'Mama Bia'}</span>
                          {tx.paymentMethod && (
                            <span className="block text-[10px] text-slate-500">
                              via {tx.paymentMethod}
                            </span>
                          )}
                        </td>
                        {userRole === 'BENDAHARA' && (
                          <td className="no-print">
                            <button
                              onClick={() => handleDeleteTransaction(tx.id, tx.description)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              title="Hapus baris ini"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="font-black text-slate-900 text-xs">
                      TOTAL SALDO KAS KELAS 4B:
                    </td>
                    <td className="text-right font-black text-emerald-800 text-xs">
                      Rp {stats.totalKasMasuk.toLocaleString('id-ID')}
                    </td>
                    <td className="text-right font-black text-rose-800 text-xs">
                      Rp {stats.totalKasKeluar.toLocaleString('id-ID')}
                    </td>
                    <td className="text-right font-black text-teal-900 text-xs md:text-sm">
                      Rp {stats.saldoKas.toLocaleString('id-ID')}
                    </td>
                    <td colSpan={userRole === 'BENDAHARA' ? 2 : 1}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </motion.section>
        )}

        {/* TAB 3: PANDUAN */}
        {activeTab === 'info' && (
          <motion.section
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm md:text-base">
                    Rekening Kas & THR Kelas 4B
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Tujuan transfer uang kas & THR</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white p-3.5 rounded-2xl space-y-2 shadow-md">
                <div className="flex items-center justify-between text-xs text-teal-200 font-bold">
                  <span>BANK MANDIRI</span>
                  <span className="badge badge-success text-[10px]">Aktif</span>
                </div>
                <div className="text-lg md:text-xl font-mono font-black tracking-wider text-white">
                  1270004638738
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/10">
                  <div className="font-bold text-teal-100 text-[11px]">a/n Naraya XX (Mama Bia)</div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={copyRekening}
                    className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Salin
                  </motion.button>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <div className="font-black text-amber-900">💡 Catatan untuk Bunda:</div>
                <p className="mt-0.5 leading-relaxed text-[11px]">
                  Setelah transfer, Bunda tinggal klik tombol kuning <strong>"+ KLIK DI SINI UNTUK SETOR"</strong>, pilih nama ananda, dan tekan simpan. Praktis & selesai dalam 5 detik!
                </p>
              </div>
            </div>

            <div className="bg-white rounded-3xl p-4 border-2 border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-900 flex items-center justify-center font-bold">
                  <Info className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm md:text-base">
                    Petunjuk 3 Langkah
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Sangat mudah dipahami</p>
                </div>
              </div>

              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    1
                  </div>
                  <div>
                    <div className="font-black text-slate-900">Cek Status Anak Bunda</div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Lihat kartu nama ananda di daftar 25 murid. Status bertuliskan <strong>Lunas (Hijau)</strong> atau <strong>Belum (Kuning)</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    2
                  </div>
                  <div>
                    <div className="font-black text-slate-900">Tinggal Klik & Submit</div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Klik <strong>"Setor Kas"</strong> di kartu anak, pilih nominal instan (Rp 50rb, 100rb, atau 200rb), lalu klik <strong>"Simpan Pembayaran"</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                    3
                  </div>
                  <div>
                    <div className="font-black text-slate-900">Salin Rekap ke WhatsApp Grup</div>
                    <p className="text-slate-500 text-[11px] mt-0.5">
                      Pengurus tinggal klik tombol <strong>"Kirim ke WA"</strong> untuk langsung meng-copy format pesan cantik ke grup WhatsApp kelas 4B.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
        )}
      </main>

      {/* MODAL 0: SELAMAT DATANG & LOGIN SEMENTARA RAMAH IBU-IBU */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content p-5 md:p-6"
            >
              <div className="text-center space-y-1 pb-3 border-b border-slate-100">
                <span className="inline-block text-3xl animate-bounce">🌸</span>
                <h3 className="text-lg md:text-xl font-black text-slate-900">
                  Selamat Datang Bunda & Mama! 💖
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Aplikasi Kas & THR Murid Kelas 4B (2026–2027)
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-3">
                {/* Switch: Masuk sebagai Mama Murid ATAU Pengurus */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginRoleType('MAMA');
                      setLoginError('');
                    }}
                    className={`py-2 rounded-lg text-xs font-black transition-all ${
                      loginRoleType === 'MAMA'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    👩 Saya Mama / Wali Murid
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginRoleType('BENDAHARA');
                      setLoginError('');
                    }}
                    className={`py-2 rounded-lg text-xs font-black transition-all ${
                      loginRoleType === 'BENDAHARA'
                        ? 'bg-purple-700 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    📋 Pengurus / Bendahara
                  </button>
                </div>

                {loginRoleType === 'MAMA' ? (
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      Sentuh & Pilih Nama Ananda Bunda: *
                    </label>
                    <select
                      value={loginSelectedStudentId}
                      onChange={(e) => setLoginSelectedStudentId(e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-teal-300 focus:border-teal-600 font-bold text-slate-900 bg-white text-sm"
                      required
                    >
                      <option value="">-- Sentuh untuk Pilih Nama Anak Bunda --</option>
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          #{s.no}. {s.nickname} — {s.fullName}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-teal-700 font-semibold bg-teal-50 p-2 rounded-lg">
                      💡 <em>Cukup pilih sekali!</em> Setiap kali Bunda membuka web ini, form setor akan <strong>otomatis langsung terisi nama ananda</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      Password Pengurus / Bendahara:
                    </label>
                    <input
                      type="password"
                      placeholder="Masukkan kata sandi sementara (misal: 4B)"
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-purple-300 focus:border-purple-600 font-bold text-slate-900 text-sm"
                    />
                    <p className="text-[11px] text-purple-700 font-semibold bg-purple-50 p-2 rounded-lg">
                      🔑 Password sementara pengurus: <strong>4B</strong>
                    </p>
                  </div>
                )}

                {loginError && (
                  <div className="text-xs text-rose-600 font-bold bg-rose-50 p-2 rounded-lg border border-rose-200">
                    ⚠️ {loginError}
                  </div>
                )}

                <div className="pt-2 flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-black py-3 rounded-xl text-sm shadow-md shadow-teal-700/25 flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>MASUK SEKARANG</span>
                  </motion.button>
                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(false)}
                    className="px-3 py-3 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100"
                  >
                    Tutup
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 1: SETOR KAS / THR */}
      <AnimatePresence>
        {isDepositModalOpen && (
          <div className="modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content p-5 md:p-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="badge badge-success text-[11px]">Formulir Cepat</span>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 mt-0.5">
                    Catat Setoran Kas / THR 💰
                  </h3>
                </div>
                <button
                  onClick={() => setIsDepositModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-black"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitDeposit} className="space-y-3 pt-3">
                {/* 1. Pilih Anak */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    1. Nama Anak (25 Murid Kelas 4B) *
                  </label>
                  <select
                    required
                    value={depositForm.studentId}
                    onChange={(e) => setDepositForm({ ...depositForm, studentId: e.target.value })}
                    className="w-full p-2.5 rounded-xl border-2 border-slate-300 focus:border-teal-600 text-sm font-bold text-slate-900 bg-white"
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
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    2. Jenis Pembayaran *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setDepositForm({ ...depositForm, category: 'KAS_MASUK', amount: 200000 })
                      }
                      className={`p-2.5 rounded-xl font-black text-xs md:text-sm border-2 transition-all flex items-center justify-center gap-1.5 ${
                        depositForm.category === 'KAS_MASUK'
                          ? 'border-teal-600 bg-teal-50 text-teal-950 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <Wallet className="w-4 h-4 text-teal-700" /> Uang Kas Rutin
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setDepositForm({ ...depositForm, category: 'THR_MASUK', amount: 100000 })
                      }
                      className={`p-2.5 rounded-xl font-black text-xs md:text-sm border-2 transition-all flex items-center justify-center gap-1.5 ${
                        depositForm.category === 'THR_MASUK'
                          ? 'border-amber-500 bg-amber-50 text-amber-950 shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <Gift className="w-4 h-4 text-amber-700" /> Uang THR
                    </button>
                  </div>
                </div>

                {/* 3. Tombol Cepat Nominal */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    3. Pilih Nominal (Tinggal Klik) *
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
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400">
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
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border-2 border-slate-300 focus:border-teal-600 font-black text-slate-900 text-base"
                    />
                  </div>
                </div>

                {/* 4. Tanggal & Metode */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Tanggal Bayar
                    </label>
                    <input
                      type="date"
                      required
                      value={depositForm.date}
                      onChange={(e) => setDepositForm({ ...depositForm, date: e.target.value })}
                      className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Metode Pembayaran
                    </label>
                    <select
                      value={depositForm.paymentMethod}
                      onChange={(e) =>
                        setDepositForm({ ...depositForm, paymentMethod: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-800 bg-white text-xs"
                    >
                      <option value="Transfer Mandiri">Transfer Bank Mandiri</option>
                      <option value="Transfer BCA">Transfer Bank BCA</option>
                      <option value="Transfer BRI">Transfer Bank BRI</option>
                      <option value="Tunai">Tunai / Cash</option>
                      <option value="Lainnya">Lainnya / E-Wallet</option>
                    </select>
                  </div>
                </div>

                {/* 5. Catatan */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Misal: Trf Mandiri an Bunda..."
                    value={depositForm.note}
                    onChange={(e) => setDepositForm({ ...depositForm, note: e.target.value })}
                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-medium text-slate-800 text-xs"
                  />
                </div>

                {/* Tombol Simpan */}
                <div className="pt-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black text-base py-3.5 rounded-xl shadow-lg shadow-teal-700/25 flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>SIMPAN & CATAT PEMBAYARAN</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: CATAT PENGELUARAN (BENDAHARA ONLY) */}
      <AnimatePresence>
        {isExpenseModalOpen && (
          <div className="modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content p-5 md:p-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="badge badge-danger text-[11px]">Uang Keluar</span>
                  <h3 className="text-lg md:text-xl font-black text-slate-900 mt-0.5">
                    Catat Pengeluaran Kas Kelas 📝
                  </h3>
                </div>
                <button
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-black"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitExpense} className="space-y-3 pt-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    1. Kategori Pengeluaran *
                  </label>
                  <select
                    value={expenseForm.expenseCategory}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, expenseCategory: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border-2 border-slate-300 focus:border-rose-500 font-bold text-slate-900 bg-white text-xs md:text-sm"
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
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    2. Keterangan / Nama Kegiatan *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Misal: Tanda cinta sakit ananda..., snack pensi"
                    value={expenseForm.description}
                    onChange={(e) =>
                      setExpenseForm({ ...expenseForm, description: e.target.value })
                    }
                    className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-900 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                      Qty / Jumlah
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
                      className="w-full p-2 rounded-lg border border-slate-200 font-black text-slate-800 bg-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
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
                      className="w-full p-2 rounded-lg border border-slate-200 font-black text-slate-800 bg-white text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    3. Total Nominal Pengeluaran (Rp) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-black text-slate-400">
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
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border-2 border-rose-300 focus:border-rose-600 font-black text-rose-900 text-base"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      required
                      value={expenseForm.date}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, date: e.target.value })
                      }
                      className="w-full p-2 rounded-xl border-2 border-slate-200 font-bold text-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
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
                      className="w-full p-2 rounded-xl border-2 border-slate-200 font-bold text-slate-800 text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-sm md:text-base py-3 rounded-xl shadow-lg shadow-rose-700/25 flex items-center justify-center gap-2"
                  >
                    <MinusCircle className="w-4 h-4" />
                    <span>SIMPAN PENGELUARAN KAS</span>
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: REKAP WHATSAPP */}
      <AnimatePresence>
        {isWaModalOpen && (
          <div className="modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content p-5 md:p-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-black text-slate-900">
                      Format Pesan WhatsApp Grup 📲
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">Tinggal klik salin lalu paste di grup WA</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsWaModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-black"
                >
                  ✕
                </button>
              </div>

              <div className="pt-3 space-y-3">
                <div className="bg-slate-900 text-slate-100 p-3.5 rounded-2xl font-mono text-xs max-h-[300px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                  {waReportText}
                </div>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={copyToClipboard}
                  className={`w-full font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-sm md:text-base transition-all ${
                    copiedWa
                      ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/30'
                      : 'bg-teal-600 hover:bg-teal-700 text-white shadow-lg shadow-teal-700/25'
                  }`}
                >
                  {copiedWa ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>BERHASIL DISALIN KE CLIPBOARD!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>SALIN PESAN UNTUK WA GRUP (1 KLIK)</span>
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM BAR */}
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
              studentId: currentMamaStudent ? String(currentMamaStudent.id) : '',
              category: 'KAS_MASUK',
              amount: 200000,
              date: new Date().toISOString().split('T')[0],
              paymentMethod: 'Transfer Mandiri',
              note: currentMamaStudent ? `Setoran kas ananda ${currentMamaStudent.nickname}` : '',
              customStudentName: currentMamaStudent ? `${currentMamaStudent.fullName} (${currentMamaStudent.nickname})` : '',
            });
            setIsDepositModalOpen(true);
          }}
          className="bottom-tab-item text-teal-900"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="w-11 h-11 rounded-full bg-gradient-to-r from-amber-400 to-yellow-400 text-teal-950 flex items-center justify-center -mt-5 shadow-lg shadow-amber-400/50 border-2 border-white"
          >
            <PlusCircle className="w-6 h-6 stroke-[2.5]" />
          </motion.div>
          <span className="font-black text-teal-950 text-[10px] mt-0.5">Setor</span>
        </button>

        <button
          onClick={() => setActiveTab('ledger')}
          className={`bottom-tab-item ${activeTab === 'ledger' ? 'active' : ''}`}
        >
          <BookOpen />
          <span>Buku Kas</span>
        </button>

        <button
          onClick={handleExportExcel}
          className="bottom-tab-item text-emerald-700"
        >
          <Download />
          <span>Excel</span>
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
