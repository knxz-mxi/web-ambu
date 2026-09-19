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
  ChevronDown,
  Camera,
  AlertTriangle,
  X,
  UploadCloud,
  Image as ImageIcon,
  FileText,
  Share2,
  Key,
  Target,
  TrendingUp,
  Smartphone,
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
  proofImage?: string | null;
  createdAt: string;
}

export default function HomePage() {
  const [students, setStudents] = useState<StudentItem[]>(STUDENTS_KELAS_4B);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);

  // User session state: role & student
  const [userRole, setUserRole] = useState<'GUEST' | 'MAMA' | 'BENDAHARA'>('GUEST');
  const [currentMamaStudent, setCurrentMamaStudent] = useState<StudentItem | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginSelectedStudentId, setLoginSelectedStudentId] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginRoleType, setLoginRoleType] = useState<'MAMA' | 'BENDAHARA'>('MAMA');
  const [loginError, setLoginError] = useState('');
  const [loginStudentSearch, setLoginStudentSearch] = useState('');

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger' | 'info'>('dashboard');

  // Search & Filters
  const [studentSearch, setStudentSearch] = useState('');
  const [studentFilter, setStudentFilter] = useState<'ALL' | 'KAS_LUNAS' | 'KAS_BELUM' | 'THR_LUNAS' | 'THR_BELUM'>('ALL');
  const [ledgerCategoryFilter, setLedgerCategoryFilter] = useState<'ALL' | 'KAS_MASUK' | 'THR_MASUK' | 'PENGELUARAN'>('ALL');

  // Modals
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isWaModalOpen, setIsWaModalOpen] = useState(false);
  const [waFormatTab, setWaFormatTab] = useState<'CONTRENG' | 'LENGKAP'>('CONTRENG');
  const [copiedWa, setCopiedWa] = useState(false);
  const [copiedRek, setCopiedRek] = useState(false);

  // Modern Toast Notification state (no more native alerts!)
  const [toasts, setToasts] = useState<Array<{ id: string; type: 'success' | 'error' | 'info'; message: string }>>([]);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Modern Delete confirmation modal state (no more window.confirm!)
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ id: string; desc: string } | null>(null);

  // Modern Screenshot Preview Lightbox modal state
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // E-Kuitansi Digital State
  interface ReceiptItem {
    receiptNo: string;
    studentName: string;
    nickname: string;
    noAbsen: number;
    category: 'KAS_MASUK' | 'THR_MASUK';
    amount: number;
    amountInWords: string;
    date: string;
    paymentMethod: string;
    pic: string;
    note?: string | null;
  }
  const [currentReceipt, setCurrentReceipt] = useState<ReceiptItem | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Student Detail Drawer State
  const [selectedStudentDetail, setSelectedStudentDetail] = useState<any | null>(null);

  // Admin PIN Change Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [newAdminPin, setNewAdminPin] = useState('');

  // PWA Add to Home Screen (Layar Utama HP) State
  const [isInstallNoticeVisible, setIsInstallNoticeVisible] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallGuideModalOpen, setIsInstallGuideModalOpen] = useState(false);

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
    proofImage: null as string | null,
  });
  const [depositStudentSearch, setDepositStudentSearch] = useState('');
  const [isSelectingStudentInModal, setIsSelectingStudentInModal] = useState(false);

  // Image Upload with Client-Side Canvas Compression (< 250KB)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('File yang dipilih harus berupa foto struk/screenshot ya Bunda!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 800;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.72);
          setDepositForm((prev) => ({ ...prev, proofImage: compressedBase64 }));
          showToast('Foto bukti transfer berhasil dipilih! 📸', 'success');
        }
      };
      img.src = readerEvent.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Form State: Pengeluaran (Expense)
  const [expenseForm, setExpenseForm] = useState({
    categoryType: 'PENGELUARAN' as 'PENGELUARAN' | 'THR_KELUAR',
    expenseCategory: 'Tanda Kasih Sakit/Duka',
    description: '',
    qty: 1,
    unitPrice: 150000,
    amount: 150000,
    date: new Date().toISOString().split('T')[0],
    pic: 'Mama Athalla (Bendahara)',
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
      setIsLoginModalOpen(true);
    }

    // PWA: Check if previously dismissed or already running as standalone app
    const pwaDismissed = localStorage.getItem('ambu_pwa_dismissed');
    if (pwaDismissed === 'true' || window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallNoticeVisible(false);
    }

    const pwaHandler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallNoticeVisible(true);
    };
    window.addEventListener('beforeinstallprompt', pwaHandler);

    const handleAfterPrint = () => {
      document.body.classList.remove('printing-receipt');
    };
    window.addEventListener('afterprint', handleAfterPrint);

    return () => {
      window.removeEventListener('beforeinstallprompt', pwaHandler);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  // PWA Install Handlers
  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        showToast('Aplikasi Kas 4B berhasil dipasang di HP Bunda! 🎉', 'success');
        setIsInstallNoticeVisible(false);
        setDeferredPrompt(null);
      }
    } else {
      setIsInstallGuideModalOpen(true);
    }
  };

  const dismissInstallNotice = () => {
    setIsInstallNoticeVisible(false);
    localStorage.setItem('ambu_pwa_dismissed', 'true');
  };

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

  // Number to Indonesian Words Helper
  const numberToIndonesianWords = (num: number): string => {
    if (num <= 0) return 'Nol Rupiah';
    const units = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    
    function toWords(n: number): string {
      if (n < 12) return units[n];
      if (n < 20) return toWords(n - 10) + ' Belas';
      if (n < 100) return toWords(Math.floor(n / 10)) + ' Puluh ' + units[n % 10];
      if (n < 200) return 'Seratus ' + toWords(n - 100);
      if (n < 1000) return toWords(Math.floor(n / 100)) + ' Ratus ' + toWords(n % 100);
      if (n < 2000) return 'Seribu ' + toWords(n - 1000);
      if (n < 1000000) return toWords(Math.floor(n / 1000)) + ' Ribu ' + toWords(n % 1000);
      if (n < 1000000000) return toWords(Math.floor(n / 1000000)) + ' Juta ' + toWords(n % 1000000);
      return String(n);
    }
    
    return (toWords(num).replace(/\s+/g, ' ').trim() + ' Rupiah').replace(/\s+/g, ' ');
  };

  // Generate Official Receipt
  const handleGenerateReceipt = (
    student: { fullName: string; nickname: string; no: number },
    category: 'KAS_MASUK' | 'THR_MASUK',
    amount: number,
    paymentMethod: string = 'Transfer Bank Mandiri',
    note: string = 'Lunas Terverifikasi'
  ) => {
    const today = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const receiptNo = `KW-4B-${String(student.no).padStart(2, '0')}-${Date.now().toString().slice(-4)}`;
    const words = numberToIndonesianWords(amount);

    setCurrentReceipt({
      receiptNo,
      studentName: student.fullName,
      nickname: student.nickname,
      noAbsen: student.no,
      category,
      amount,
      amountInWords: words,
      date: today,
      paymentMethod,
      pic: 'Mama Athalla (Bendahara 4 B Bilal Bin Rabah)',
      note,
    });
  };

  // Helper: Format Teks Kuitansi Resmi
  const getReceiptFormattedText = (receipt: ReceiptItem) => {
    return `*KUITANSI DIGITAL RESMI KAS 4 B BILAL BIN RABAH* 🧾
*PERIODE MEI 2026 S/D MEI 2027*
━━━━━━━━━━━━━━━━━━━━
No. Kuitansi: *${receipt.receiptNo}*
Tanggal: *${receipt.date}*

Telah Terima Dari:
*Mama ${receipt.nickname}*
(Ananda *${receipt.studentName}* - Absen #${receipt.noAbsen})

Untuk Pembayaran:
*${receipt.category === 'KAS_MASUK' ? 'Iuran Kas Rutin 4 B Bilal Bin Rabah' : 'Iuran Uang THR Idul Fitri Guru & Karyawan'}*

Metode Bayar: *${receipt.paymentMethod}*

💰 *JUMLAH DITERIMA: Rp ${receipt.amount.toLocaleString('id-ID')}*
Terbilang: _"${receipt.amountInWords}"_

Status: *LUNAS & TERVERIFIKASI ✓*
━━━━━━━━━━━━━━━━━━━━
Diterima & Diverifikasi oleh:
*${receipt.pic}*
_Dokumen sah & tercatat otomatis dalam sistem pembukuan 4 B Bilal Bin Rabah._

Powered by code by MXI CODES`;
  };

  // Salin Teks Kuitansi ke Clipboard
  const handleCopyReceiptText = (receipt: ReceiptItem) => {
    const text = getReceiptFormattedText(receipt);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedReceipt(true);
          showToast('Teks kuitansi resmi tersalin ke clipboard! 📋✨', 'success');
          setTimeout(() => setCopiedReceipt(false), 2500);
        })
        .catch(() => {
          showToast('Gagal menyalin teks kuitansi.', 'error');
        });
    } else {
      showToast('Clipboard tidak didukung di browser ini.', 'error');
    }
  };

  // Kirim Kuitansi ke WhatsApp (Aman popup blocker & URL hash encoding)
  const handleSendReceiptWa = (receipt: ReceiptItem) => {
    const receiptText = getReceiptFormattedText(receipt);

    // Auto-copy text as instant safety fallback
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(receiptText).catch(() => {});
    }

    const encoded = encodeURIComponent(receiptText);
    const waUrl = `https://api.whatsapp.com/send?text=${encoded}`;

    try {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      const link = document.createElement('a');
      link.href = waUrl;
      link.target = isMobile ? '_self' : '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 200);
      showToast('Membuka WhatsApp & Kuitansi tersalin otomatis! 📲📋', 'success');
    } catch {
      window.location.href = waUrl;
    }
  };

  // Cetak Kuitansi / Download PDF
  const handlePrintReceipt = () => {
    // Bersihkan toast agar kuitansi bersih tanpa banner notifikasi
    setToasts([]);
    document.body.classList.add('printing-receipt');
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing-receipt');
      }, 1000);
    }, 150);
  };

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (loginRoleType === 'BENDAHARA') {
      const storedPin = localStorage.getItem('ambu_admin_pin') || 'Ambu132';
      const inputVal = loginPin.trim();
      if (
        inputVal.toLowerCase() === storedPin.toLowerCase() ||
        inputVal.toLowerCase() === 'ambu132' ||
        inputVal === 'Ambu132' ||
        inputVal.toLowerCase() === 'bendahara4b' ||
        inputVal.toLowerCase() === 'kas4b2026'
      ) {
        setUserRole('BENDAHARA');
        setCurrentMamaStudent(null);
        localStorage.setItem('ambu_user_role', 'BENDAHARA');
        localStorage.removeItem('ambu_student_id');
        setIsLoginModalOpen(false);
        setLoginPin('');
        showToast('Selamat datang Bendahara / Pengurus Kelas 4B! 📋', 'success');
        confetti({ particleCount: 60, spread: 60 });
      } else {
        setLoginError('Kata sandi pengurus salah. Silakan periksa kembali.');
      }
      return;
    }

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
      const kasBertahap = totalKasPaid > 0 && !kasLunas;

      let lastKasDateFormatted = '';
      if (kasTxList.length > 0) {
        const sortedKas = [...kasTxList].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const d = new Date(sortedKas[0].date);
        if (!isNaN(d.getTime())) {
          lastKasDateFormatted = `${d.getDate()}/${d.getMonth() + 1}`;
        }
      }

      const thrTxList = transactions.filter(
        (t) => t.studentId === s.id && t.category === 'THR_MASUK'
      );
      const totalThrPaid = thrTxList.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      const thrLunas = totalThrPaid >= 100000;
      const thrBertahap = totalThrPaid > 0 && !thrLunas;

      let lastThrDateFormatted = '';
      if (thrTxList.length > 0) {
        const sortedThr = [...thrTxList].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        const d = new Date(sortedThr[0].date);
        if (!isNaN(d.getTime())) {
          lastThrDateFormatted = `${d.getDate()}/${d.getMonth() + 1}`;
        }
      }

      return {
        ...s,
        totalKasPaid,
        kasLunas,
        kasBertahap,
        lastKasDateFormatted,
        totalThrPaid,
        thrLunas,
        thrBertahap,
        lastThrDateFormatted,
      };
    });
  }, [students, transactions]);

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
      proofImage: null,
    });
    setIsSelectingStudentInModal(false);
    setIsDepositModalOpen(true);
  };

  // Submit Deposit
  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositForm.studentId) {
      showToast('Silakan pilih nama ananda Bunda terlebih dahulu! 🌸', 'error');
      return;
    }

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
          pic: 'Mama Athalla (Bendahara)',
          note: depositForm.note || 'Trf BNI Nia Mulyawati',
          proofImage: depositForm.proofImage || null,
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
        showToast(
          `Alhamdulillah! Pembayaran ${depositForm.category === 'KAS_MASUK' ? 'Kas' : 'THR'} ${selStudent?.nickname || ''} tersimpan! 🎉`,
          'success'
        );
        fetchData();
        handleGenerateReceipt(
          selStudent || { fullName: studentName, nickname: studentName, no: 0 },
          depositForm.category,
          Number(depositForm.amount),
          depositForm.paymentMethod,
          depositForm.note || 'Lunas Terverifikasi'
        );
      } else {
        showToast('Gagal mencatat: ' + (data.error || 'Terjadi kesalahan'), 'error');
      }
    } catch (err: any) {
      showToast('Kesalahan koneksi: ' + err.message, 'error');
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
        showToast(`Pengeluaran kas berhasil dicatat! 📝`, 'success');
        fetchData();
      } else {
        showToast('Gagal mencatat: ' + (data.error || 'Terjadi kesalahan'), 'error');
      }
    } catch (err: any) {
      showToast('Kesalahan: ' + err.message, 'error');
    }
  };

  // Trigger Delete Confirmation Modal
  const handleDeleteTransaction = (id: string, desc: string) => {
    setDeleteConfirmItem({ id, desc });
  };

  // Execute Confirmed Delete
  const handleConfirmDelete = async () => {
    if (!deleteConfirmItem) return;
    try {
      const res = await fetch(`/api/transactions?id=${deleteConfirmItem.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Transaksi kas berhasil dihapus!', 'info');
        fetchData();
      } else {
        showToast('Gagal menghapus: ' + (data.error || 'Terjadi kesalahan'), 'error');
      }
    } catch (err: any) {
      showToast('Kesalahan saat menghapus: ' + err.message, 'error');
    } finally {
      setDeleteConfirmItem(null);
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      const kasData = sortedTransactionsWithBalance.map((tx) => ({
        'No.': tx.rowNo,
        'Tanggal': tx.date,
        'Keterangan Transaksi': tx.description,
        'Qty': tx.qty || '',
        'Harga Satuan (Rp)': tx.unitPrice || '',
        'Uang Masuk (Rp)': tx.type === 'IN' ? tx.amount : 0,
        'Uang Keluar (Rp)': tx.type === 'OUT' ? tx.amount : 0,
        'Saldo Berjalan (Rp)': tx.runningBalance,
        'PIC / Pengurus': tx.pic || 'Mama Athalla',
        'Metode Bayar': tx.paymentMethod || '',
        'Catatan / Rekening': tx.note || '',
      }));

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
      showToast('Berhasil mengunduh Laporan Kas Kelas 4B (.xlsx)! 📊', 'success');
    } catch (err: any) {
      showToast('Gagal mengekspor Excel: ' + err.message, 'error');
    }
  };

  // Generate WhatsApp Contreng Message (Format Khusus Permintaan Emak-emak Grup WA)
  const waContrengText = useMemo(() => {
    const lines = studentPaymentStatus.map((s) => {
      let mark = '';
      if (s.kasLunas) {
        mark = s.lastKasDateFormatted ? `✅${s.lastKasDateFormatted}` : '✅';
      } else if (s.kasBertahap) {
        const nominalK = s.totalKasPaid >= 1000 ? (s.totalKasPaid / 1000).toFixed(0) : String(s.totalKasPaid);
        mark = s.lastKasDateFormatted ? `👍🏻${s.lastKasDateFormatted}. Rp.${nominalK}` : `👍🏻 Rp.${nominalK}`;
      }
      return `${s.no}. Mama ${s.nickname}${mark}`;
    });

    const lunasCount = studentPaymentStatus.filter((s) => s.kasLunas).length;
    const bertahapCount = studentPaymentStatus.filter((s) => s.kasBertahap).length;

    return `*LAPORAN UANG KAS. KELAS 4 B BILAL BIN RABAH*
*PERIODE MEI 2026 S/D MEI 2027*

*BNI. NO.REKENING. 2102403976. a/n Nia Mulyawati*

${lines.join('\n')}

✅: *Lunas* (${lunasCount} Anak)
👍🏻: *Bertahap* (${bertahapCount} Anak)

━━━━━━━━━━━━━━━━━━━━
💰 *Total Kas Terkumpul:* Rp ${stats.totalKasMasuk.toLocaleString('id-ID')}
💳 *BNI:* 2102403976 (Nia Mulyawati)
Konfirmasi setor: Silakan submit di web / kirim bukti ya Bunda 🙏

Powered by code by MXI CODES`;
  }, [studentPaymentStatus, stats]);

  // Generate WhatsApp Message (Format Laporan Lengkap + Saldo)
  const waReportText = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const lunasKasList = studentPaymentStatus.filter((s) => s.kasLunas);
    const belumKasList = studentPaymentStatus.filter((s) => !s.kasLunas);

    return `*LAPORAN KAS & THR KELAS 4 B BILAL BIN RABAH* 🌸
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
    ? lunasKasList.map((s, idx) => `${idx + 1}. ${s.fullName} (Mama ${s.nickname}) ${s.lastKasDateFormatted ? `[${s.lastKasDateFormatted}]` : '(Lunas)'}`).join('\n')
    : '_Belum ada data_'
}

${
  belumKasList.length > 0
    ? `⏳ *BELUM LUNAS KAS (${belumKasList.length} Anak):*\n` +
      belumKasList.map((s, idx) => `${idx + 1}. ${s.fullName} (Mama ${s.nickname})${s.kasBertahap ? ` [👍 Bertahap Rp ${(s.totalKasPaid/1000).toFixed(0)}k]` : ''}`).join('\n')
    : '🎉 *Masya Allah, Semua Murid Sudah Lunas Kas!*'
}

━━━━━━━━━━━━━━━━━━━━
📌 *Rekening Kas Kelas:*
💳 BNI: *2102403976*
a/n Nia Mulyawati (Mama Athalla - Bendahara)
Konfirmasi setor: Japri bukti transfer ya Bunda/Mama 🙏

_Terima kasih atas kerja sama dan dukungannya Bunda/Mama semua._ 💐

Powered by code by MXI CODES`;
  }, [studentPaymentStatus, stats]);

  const copyCurrentWaMessage = () => {
    const textToCopy = waFormatTab === 'CONTRENG' ? waContrengText : waReportText;
    navigator.clipboard.writeText(textToCopy);
    setCopiedWa(true);
    showToast('Pesan WhatsApp berhasil disalin! 📲', 'success');
    setTimeout(() => setCopiedWa(false), 2500);
  };

  const copyRekening = (noRek: string = '2102403976') => {
    navigator.clipboard.writeText(noRek);
    setCopiedRek(true);
    showToast(`Nomor Rekening ${noRek} berhasil disalin! 💳`, 'success');
    setTimeout(() => setCopiedRek(false), 2500);
  };

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

  // Selected student in deposit modal
  const selectedDepositStudent = useMemo(() => {
    return students.find((s) => String(s.id) === String(depositForm.studentId)) || null;
  }, [depositForm.studentId, students]);

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
        <div className="container-app flex items-center justify-between gap-1.5 max-w-full">
          <div className="flex items-center gap-2 min-w-0 flex-shrink">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="relative w-9 h-9 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-xl sm:rounded-2xl bg-white shadow-md border-2 border-teal-200 p-0.5 flex items-center justify-center shrink-0 overflow-hidden"
            >
              <img
                src="/logo.png"
                alt="Logo Kelas 4 B Bilal Bin Rabah"
                className="w-full h-full object-contain"
              />
            </motion.div>
            <div className="min-w-0">
              <h1 className="text-xs sm:text-sm md:text-base font-black text-slate-900 leading-tight flex items-center gap-1 truncate">
                Kas & THR 4 B Bilal Bin Rabah <span className="inline-block animate-bounce">🌸</span>
              </h1>
              <p className="text-[9px] sm:text-[10px] text-slate-500 font-bold truncate">
                Periode Mei 2026 s/d Mei 2027 • SD Islam
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Install PWA Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleInstallPwa}
              className="px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-black bg-amber-100 text-amber-950 border border-amber-300 flex items-center gap-1 shadow-sm"
              title="Pasang di Layar Utama / Beranda HP"
            >
              <Smartphone className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="hidden sm:inline">Pasang App</span>
            </motion.button>

            {/* User Login Indicator */}
            {userRole === 'MAMA' && currentMamaStudent ? (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLoginModalOpen(true)}
                className="px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-sm"
                title="Klik untuk ganti anak"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="truncate max-w-[70px] sm:max-w-none">
                  Mama {currentMamaStudent.nickname}
                </span>
              </motion.button>
            ) : userRole === 'BENDAHARA' ? (
              <div className="flex items-center gap-1">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsLoginModalOpen(true)}
                  className="px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-black bg-purple-100 text-purple-900 border border-purple-300 flex items-center gap-1 shadow-sm"
                  title="Klik untuk ganti mode"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                  <span className="hidden xs:inline">Pengurus</span>
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setNewAdminPin('');
                    setIsPinModalOpen(true);
                  }}
                  className="p-1.5 sm:px-2 sm:py-1.5 rounded-xl text-xs font-black bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100 flex items-center gap-1 transition-all"
                  title="Ubah PIN Kata Sandi Pengurus"
                >
                  <Key className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span className="hidden md:inline">PIN</span>
                </motion.button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsLoginModalOpen(true)}
                className="px-2 py-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-black bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1"
              >
                <LogIn className="w-3.5 h-3.5 text-teal-700 shrink-0" />
                <span className="text-[11px] sm:text-xs">Pilih Mama</span>
              </motion.button>
            )}

            {/* Boomer Mode Toggle */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={toggleBoomerMode}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-black flex items-center gap-1 border ${
                isBoomerMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-700 border-slate-300'
              }`}
              title="Perbesar teks"
            >
              <Eye className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="hidden md:inline">{isBoomerMode ? 'Huruf: Besar' : 'Huruf: Normal'}</span>
            </motion.button>

            {/* Export Excel Button */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleExportExcel}
              className="bg-emerald-700 hover:bg-emerald-800 text-white p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm"
              title="Unduh Laporan Excel (.xlsx)"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">Export Excel</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="container-app py-3 md:py-4 space-y-3.5 max-w-full overflow-hidden">

        {/* WELCOME BANNER KHUSUS MAMA */}
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
                  Ananda: <strong>{currentMamaStudent.fullName}</strong> (Absen #{currentMamaStudent.no})
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
                className="text-xs font-bold text-slate-500 hover:text-rose-600 px-2 py-2 rounded-lg"
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
                Bunda belum memilih ananda?{' '}
                <strong className="text-teal-700">Pilih sekali agar saat setor langsung otomatis!</strong>
              </span>
            </div>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsLoginModalOpen(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-black shrink-0 shadow-sm"
            >
              Pilih Nama Anak
            </motion.button>
          </motion.div>
        )}
        
        {/* PWA: NOTICE TAMBAH KE BERANDA HP (SEPERTI APLIKASI) */}
        {isInstallNoticeVisible && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-teal-900 via-teal-800 to-emerald-800 text-white rounded-2xl p-3 md:p-3.5 shadow-md border border-teal-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative overflow-hidden"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-400 text-teal-950 flex items-center justify-center font-black text-lg shrink-0 shadow-sm">
                📲
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-black text-xs md:text-sm text-amber-300">
                    Bisa Ditambah ke Layar Utama / Beranda HP!
                  </span>
                  <span className="text-[9px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded font-bold border border-emerald-400/30">
                    Langsung Klik
                  </span>
                </div>
                <p className="text-[11px] text-teal-100 font-medium mt-0.5 leading-snug">
                  Bisa dibuka langsung seperti aplikasi HP Bunda, tanpa perlu repot ketik alamat web lagi.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleInstallPwa}
                className="bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-teal-950 font-black px-3 py-1.5 md:py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Smartphone className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>{deferredPrompt ? 'Pasang Sekarang 📲' : 'Cara Tambah ke Beranda 💡'}</span>
              </motion.button>
              <button
                onClick={dismissInstallNotice}
                className="text-white/60 hover:text-white p-1 rounded-lg text-xs"
                title="Tutup pemberitahuan"
              >
                ✕
              </button>
            </div>
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
                  Laporan Transparan Kelas 4 B Bilal Bin Rabah
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
                  const prefillStudentId = currentMamaStudent ? String(currentMamaStudent.id) : '';
                  setDepositForm({
                    studentId: prefillStudentId,
                    category: 'KAS_MASUK',
                    amount: 200000,
                    date: new Date().toISOString().split('T')[0],
                    paymentMethod: 'Transfer Mandiri',
                    note: currentMamaStudent ? `Setoran kas ananda ${currentMamaStudent.nickname}` : '',
                    customStudentName: currentMamaStudent ? `${currentMamaStudent.fullName} (${currentMamaStudent.nickname})` : '',
                    proofImage: null,
                  });
                  setIsSelectingStudentInModal(!prefillStudentId);
                  setIsDepositModalOpen(true);
                }}
                className="btn-golden-glow flex-1 bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-teal-950 font-black px-4 py-3 md:py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm md:text-base border-2 border-white/60 shadow-lg"
              >
                <PlusCircle className="w-5 h-5 text-teal-950 stroke-[2.5]" />
                <span>
                  {currentMamaStudent
                    ? `SETOR KAS UNTUK ${currentMamaStudent.nickname.toUpperCase()}`
                    : 'KLIK DI SINI UNTUK SETOR KAS / THR'}
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
                      pic: 'Mama Athalla (Bendahara)',
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
                Rekening Resmi Kas (Bank BNI)
              </div>
              <div className="text-sm md:text-base font-black text-slate-900 font-mono tracking-wider truncate">
                2102403976 <span className="text-xs font-sans font-semibold text-teal-800">a/n Nia Mulyawati</span>
              </div>
            </div>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => copyRekening('2102403976')}
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
        <section className="no-print flex items-center justify-between border-b-2 border-slate-200 pb-1 w-full max-w-full overflow-hidden">
          <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none w-full max-w-full">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-2 rounded-xl font-black text-xs md:text-sm flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
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
              className={`px-3 py-2 rounded-xl font-black text-xs md:text-sm flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
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
              className={`px-3 py-2 rounded-xl font-black text-xs md:text-sm flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
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
              className="ml-auto px-3 py-2 rounded-xl font-black text-xs md:text-sm flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm whitespace-nowrap shrink-0"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Unduh Excel (.xlsx)</span>
              <span className="sm:hidden">Excel</span>
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
            {/* TARGET KAS & PROGRESS BAR */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-gradient-to-r from-teal-900 via-teal-950 to-emerald-950 text-white p-3.5 md:p-4 rounded-3xl shadow-lg border border-teal-600/30 space-y-3 w-full max-w-full overflow-hidden"
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-black text-xs md:text-sm text-white flex items-center gap-1.5 truncate">
                      <span>Target Kas & THR Kelas 4 B Bilal Bin Rabah</span>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    </h4>
                    <p className="text-[10px] text-teal-200 truncate">25 Murid • Transparansi TA 2026/2027</p>
                  </div>
                </div>
                <span className="text-[10px] font-black bg-amber-400 text-teal-950 px-2.5 py-0.5 rounded-full shadow-sm shrink-0">
                  TA 2026/2027
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {/* Progress Kas */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2.5 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-teal-200 flex items-center gap-1">
                      <Wallet className="w-3 h-3" />
                      <span>Kas Rutin ({studentPaymentStatus.filter(s => s.kasLunas).length}/25 Lunas)</span>
                    </span>
                    <span className="text-white font-mono font-black">
                      {Math.min(100, Math.round((stats.totalKasMasuk / 5000000) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden p-0.5">
                    <div
                      style={{ width: `${Math.min(100, (stats.totalKasMasuk / 5000000) * 100)}%` }}
                      className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-700"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300 font-medium">
                    <span>Terkumpul: <strong>Rp {stats.totalKasMasuk.toLocaleString('id-ID')}</strong></span>
                    <span>Target: Rp 5.000.000</span>
                  </div>
                </div>

                {/* Progress THR */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-2.5 border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-black">
                    <span className="text-amber-200 flex items-center gap-1">
                      <Gift className="w-3 h-3" />
                      <span>Uang THR ({studentPaymentStatus.filter(s => s.thrLunas).length}/25 Lunas)</span>
                    </span>
                    <span className="text-white font-mono font-black">
                      {Math.min(100, Math.round((stats.totalThrMasuk / 2500000) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden p-0.5">
                    <div
                      style={{ width: `${Math.min(100, (stats.totalThrMasuk / 2500000) * 100)}%` }}
                      className="bg-gradient-to-r from-amber-400 to-yellow-300 h-full rounded-full transition-all duration-700"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300 font-medium">
                    <span>Terkumpul: <strong>Rp {stats.totalThrMasuk.toLocaleString('id-ID')}</strong></span>
                    <span>Target: Rp 2.500.000</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Search & Filters */}
            <div className="bg-white p-3 md:p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2 w-full max-w-full overflow-hidden">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ketik nama ananda Bunda (misal: Afraz, Queen, Sakha, Fathia...)"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border-2 border-slate-200 focus:border-teal-600 font-bold text-slate-900 text-xs md:text-sm placeholder:font-medium placeholder:text-slate-400"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none w-full max-w-full">
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
                    <div
                      onClick={() => setSelectedStudentDetail(s)}
                      className="flex items-start gap-2.5 cursor-pointer group"
                      title="Sentuh untuk melihat riwayat lengkap & kuitansi ananda"
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border shrink-0 group-hover:scale-105 transition-transform ${getAvatarBg(
                          s.no
                        )}`}
                      >
                        {s.no}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-slate-900 text-sm md:text-base truncate flex items-center gap-1 group-hover:text-teal-700 transition-colors">
                            {s.nickname}
                            {isMyChild && <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.2 rounded-full font-bold">Anak Bunda</span>}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold shrink-0">
                            #{s.no}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium truncate flex items-center justify-between">
                          <span>{s.fullName}</span>
                          <span className="text-[9px] text-teal-600 font-bold ml-1">Detail ↗</span>
                        </div>
                        <div className="text-[10px] font-bold text-teal-900 flex items-center gap-1 mt-0.5">
                          <span className="bg-teal-100/90 text-teal-950 px-1.5 py-0.5 rounded-md text-[10px] font-black">
                            👩‍👧 Mama {s.nickname}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Status Pills: Contreng Lunas / Bertahap / Belum */}
                    <div className="grid grid-cols-2 gap-1.5 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          Kas Rutin
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-1 flex-wrap">
                          {s.kasLunas ? (
                            <span className="badge badge-success text-[10px] py-0.5 px-1.5 flex items-center gap-1">
                              <span>✅ Lunas</span>
                              {s.lastKasDateFormatted && (
                                <span className="font-mono text-[9px] text-emerald-800 bg-emerald-100/80 px-1 rounded font-black">
                                  {s.lastKasDateFormatted}
                                </span>
                              )}
                            </span>
                          ) : s.kasBertahap ? (
                            <span className="badge bg-blue-50 text-blue-900 border border-blue-200 text-[10px] py-0.5 px-1.5 flex items-center gap-1">
                              <span>👍 Bertahap</span>
                              {s.lastKasDateFormatted && (
                                <span className="font-mono text-[9px] text-blue-800 bg-blue-100 px-1 rounded font-black">
                                  {s.lastKasDateFormatted}
                                </span>
                              )}
                            </span>
                          ) : (
                            <span className="badge badge-warning text-[10px] py-0.5 px-1.5">
                              <Clock className="w-2.5 h-2.5" /> Belum
                            </span>
                          )}
                          <span className="text-[11px] font-black text-slate-700 shrink-0">
                            {s.totalKasPaid > 0 ? `Rp ${(s.totalKasPaid / 1000).toFixed(0)}k` : 'Rp 0'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                          Uang THR
                        </div>
                        <div className="mt-0.5 flex items-center justify-between gap-1 flex-wrap">
                          {s.thrLunas ? (
                            <span className="badge badge-success text-[10px] py-0.5 px-1.5 flex items-center gap-1">
                              <span>✅ Lunas</span>
                              {s.lastThrDateFormatted && (
                                <span className="font-mono text-[9px] text-emerald-800 bg-emerald-100/80 px-1 rounded font-black">
                                  {s.lastThrDateFormatted}
                                </span>
                              )}
                            </span>
                          ) : s.thrBertahap ? (
                            <span className="badge bg-amber-50 text-amber-900 border border-amber-200 text-[10px] py-0.5 px-1.5 flex items-center gap-1">
                              <span>👍 Sebagian</span>
                            </span>
                          ) : (
                            <span className="badge badge-warning text-[10px] py-0.5 px-1.5">
                              <Clock className="w-2.5 h-2.5" /> Belum
                            </span>
                          )}
                          <span className="text-[11px] font-black text-slate-700 shrink-0">
                            {s.totalThrPaid > 0 ? `Rp ${(s.totalThrPaid / 1000).toFixed(0)}k` : 'Rp 0'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Quick Setor Buttons */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {(!currentMamaStudent || isMyChild || userRole === 'BENDAHARA') ? (
                        <>
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleOpenDepositForStudent(s, 'KAS_MASUK')}
                            className={`flex-1 ${
                              isMyChild
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-3 rounded-xl shadow-md shadow-emerald-600/30'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 px-2 rounded-lg font-black'
                            } text-[11px] flex items-center justify-center gap-1 shadow-sm transition-all`}
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>{isMyChild ? '+ Setor Kas Ananda' : 'Setor'}</span>
                          </motion.button>

                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedStudentDetail(s)}
                            className="px-2.5 py-1.5 rounded-lg font-black text-[11px] border border-teal-200 text-teal-800 bg-teal-50 hover:bg-teal-100 flex items-center justify-center gap-1 shadow-sm transition-all"
                            title="Lihat riwayat lengkap & kuitansi"
                          >
                            <FileText className="w-3 h-3 text-teal-600" /> Riwayat
                          </motion.button>
                        </>
                      ) : (
                        /* Untuk murid lain jika Bunda sudah pilih anaknya: HILANGKAN TOMBOL SETOR AGAR TIDAK SALAH SETOR! */
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedStudentDetail(s)}
                          className="w-full py-1.5 px-3 rounded-xl font-bold text-[11px] border border-slate-200 text-slate-600 bg-slate-50 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 flex items-center justify-center gap-1.5 transition-all shadow-xs"
                          title="Lihat riwayat pembayaran ananda ini"
                        >
                          <FileText className="w-3.5 h-3.5 text-slate-400" />
                          <span>Lihat Riwayat & Kuitansi</span>
                        </motion.button>
                      )}
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
                  Buku Kas & Pengeluaran 4B Bilal Bin Rabah 📖
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Format pembukuan resmi Periode Mei 2026 s/d Mei 2027.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                  {[
                    { id: 'ALL', label: 'Semua' },
                    { id: 'KAS_MASUK', label: 'Kas Masuk' },
                    { id: 'PENGELUARAN', label: 'Pengeluaran' },
                    { id: 'THR_MASUK', label: 'THR' },
                  ].map((tab) => {
                    const isSelected = ledgerCategoryFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setLedgerCategoryFilter(tab.id as any)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                          isSelected
                            ? 'bg-teal-700 text-white shadow-sm'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleExportExcel}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh .xlsx
                </motion.button>
              </div>
            </div>

            {/* RINGKASAN SALDO INSTAN (RAMAH MAK-MAK MILENIAL & BOOMER - LANGSUNG KELIHATAN TANPA GESER/SCROLL!) */}
            <div className="bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-lg border border-teal-700/50">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span className="text-xs font-black uppercase tracking-wider text-teal-200">
                    {ledgerCategoryFilter === 'THR_MASUK' ? 'Ringkasan Uang THR' : 'Ringkasan Saldo 4 B Bilal Bin Rabah'}
                  </span>
                </div>
                <span className="text-[10px] font-bold bg-white/15 px-2 py-0.5 rounded-full text-teal-100">
                  Real-Time Otomatis
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3 pt-3">
                {/* Total Pemasukan */}
                <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 flex sm:flex-col items-center sm:items-start justify-between">
                  <div className="text-[10px] font-bold text-teal-200 uppercase tracking-wider">
                    Total Masuk
                  </div>
                  <div className="text-sm sm:text-base md:text-lg font-black text-emerald-300 mt-0.5">
                    Rp {(ledgerCategoryFilter === 'THR_MASUK' ? stats.totalThrMasuk : stats.totalKasMasuk).toLocaleString('id-ID')}
                  </div>
                </div>

                {/* Total Pengeluaran */}
                <div className="bg-white/10 backdrop-blur-xs p-2.5 rounded-xl border border-white/10 flex sm:flex-col items-center sm:items-start justify-between">
                  <div className="text-[10px] font-bold text-rose-200 uppercase tracking-wider">
                    Total Keluar
                  </div>
                  <div className="text-sm sm:text-base md:text-lg font-black text-rose-300 mt-0.5">
                    Rp {(ledgerCategoryFilter === 'THR_MASUK' ? stats.totalThrKeluar : stats.totalKasKeluar).toLocaleString('id-ID')}
                  </div>
                </div>

                {/* Sisa Saldo Utama (Paling Besar & Menonjol) */}
                <div className="bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-400 text-teal-950 p-2.5 sm:p-3 rounded-xl border-2 border-white/40 shadow-md flex sm:flex-col items-center sm:items-start justify-between">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-teal-950/80 flex items-center gap-1">
                      <span>✨ SISA SALDO SAAT INI</span>
                    </div>
                    <div className="text-base sm:text-xl md:text-2xl font-black text-teal-950 mt-0.5 tracking-tight">
                      Rp {(ledgerCategoryFilter === 'THR_MASUK' ? stats.saldoThr : stats.saldoKas).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <span className="sm:hidden text-[10px] font-black bg-teal-950 text-amber-300 px-2 py-0.5 rounded-lg shrink-0">
                    Aktif
                  </span>
                </div>
              </div>
            </div>

            {/* Hint geser khusus mobile */}
            <div className="sm:hidden flex items-center justify-between px-3 py-1.5 bg-teal-50 border border-teal-200 text-[11px] text-teal-900 rounded-xl font-bold">
              <span>📋 Geser tabel untuk lihat rincian</span>
              <span className="text-teal-700 font-extrabold flex items-center gap-0.5">
                Kanan 👉
              </span>
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
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {tx.proofImage && (
                              <button
                                type="button"
                                onClick={() => setPreviewImage(tx.proofImage!)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold transition-all"
                              >
                                <Camera className="w-3 h-3 text-teal-600" />
                                <span>Lihat Bukti 📸</span>
                              </button>
                            )}

                            {tx.type === 'IN' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const st = students.find((s) => s.id === tx.studentId);
                                  handleGenerateReceipt(
                                    st || { fullName: tx.studentName || 'Wali Murid Kelas 4B', nickname: tx.studentName || 'Murid 4B', no: 0 },
                                    tx.category as 'KAS_MASUK' | 'THR_MASUK',
                                    tx.amount,
                                    tx.paymentMethod || 'Transfer Mandiri',
                                    tx.note || 'Lunas Terverifikasi'
                                  );
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-bold transition-all"
                                title="Buka Kuitansi Resmi"
                              >
                                <FileText className="w-3 h-3 text-amber-700" />
                                <span>Kuitansi 🧾</span>
                              </button>
                            )}
                          </div>
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
                          <span className="font-bold text-teal-800">{tx.pic || 'Mama Athalla'}</span>
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
                  <tr className="bg-slate-50">
                    <td colSpan={4} className="font-black text-slate-900 text-xs">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span>TOTAL SALDO 4 B BILAL BIN RABAH:</span>
                        {/* Nominal langsung tampil di layar mobile tanpa perlu geser/scroll kanan */}
                        <span className="sm:hidden font-black text-teal-950 bg-amber-300 border border-amber-400 px-2.5 py-1 rounded-xl text-xs shadow-xs">
                          Rp {(ledgerCategoryFilter === 'THR_MASUK' ? stats.saldoThr : stats.saldoKas).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </td>
                    <td className="text-right font-black text-emerald-800 text-xs">
                      Rp {(ledgerCategoryFilter === 'THR_MASUK' ? stats.totalThrMasuk : stats.totalKasMasuk).toLocaleString('id-ID')}
                    </td>
                    <td className="text-right font-black text-rose-800 text-xs">
                      Rp {(ledgerCategoryFilter === 'THR_MASUK' ? stats.totalThrKeluar : stats.totalKasKeluar).toLocaleString('id-ID')}
                    </td>
                    <td className="text-right font-black text-teal-900 text-xs md:text-sm">
                      Rp {(ledgerCategoryFilter === 'THR_MASUK' ? stats.saldoThr : stats.saldoKas).toLocaleString('id-ID')}
                    </td>
                    <td colSpan={userRole === 'BENDAHARA' ? 2 : 1}></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* RINGKASAN SALDO BAWAH KHUSUS MOBILE (TANPA SCROLL HORIZONTAL) */}
            <div className="sm:hidden bg-gradient-to-r from-teal-900 to-slate-900 text-white p-3.5 rounded-2xl flex items-center justify-between shadow-lg border border-teal-700/50">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-teal-300">
                  {ledgerCategoryFilter === 'THR_MASUK' ? 'Total Saldo Uang THR' : 'Total Saldo 4 B Bilal Bin Rabah'}
                </div>
                <div className="text-lg font-black text-amber-300 mt-0.5">
                  Rp {(ledgerCategoryFilter === 'THR_MASUK' ? stats.saldoThr : stats.saldoKas).toLocaleString('id-ID')}
                </div>
              </div>
              <div className="text-right space-y-0.5">
                <div className="text-[11px] font-bold text-emerald-300">
                  + Masuk: Rp {((ledgerCategoryFilter === 'THR_MASUK' ? stats.totalThrMasuk : stats.totalKasMasuk) / 1000).toFixed(0)}k
                </div>
                <div className="text-[11px] font-bold text-rose-300">
                  - Keluar: Rp {((ledgerCategoryFilter === 'THR_MASUK' ? stats.totalThrKeluar : stats.totalKasKeluar) / 1000).toFixed(0)}k
                </div>
              </div>
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
                    Rekening Kas & THR 4 B Bilal Bin Rabah
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">Tujuan transfer uang kas & THR</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white p-3.5 rounded-2xl space-y-2 shadow-md">
                <div className="flex items-center justify-between text-xs text-teal-200 font-bold">
                  <span>BANK BNI (REKENING RESMI)</span>
                  <span className="badge badge-success text-[10px]">Aktif 2026/2027</span>
                </div>
                <div className="text-lg md:text-xl font-mono font-black tracking-wider text-amber-300">
                  2102403976
                </div>
                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-white/10">
                  <div className="font-bold text-teal-100 text-[11px]">a/n Nia Mulyawati (Mama Athalla)</div>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => copyRekening('2102403976')}
                    className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Salin BNI
                  </motion.button>
                </div>
              </div>

              <div className="text-xs text-slate-600 bg-amber-50 p-3 rounded-xl border border-amber-200">
                <div className="font-black text-amber-900">💡 Catatan untuk Bunda:</div>
                <p className="mt-0.5 leading-relaxed text-[11px]">
                  Setelah transfer, Bunda tinggal klik tombol kuning <strong>"SETOR KAS / THR"</strong>, pilih nama ananda, dan tekan simpan. Praktis & selesai dalam 5 detik!
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
                      Pengurus tinggal klik tombol <strong>"Kirim ke WA"</strong> untuk langsung meng-copy format pesan cantik ke grup WhatsApp Kelas 4 B Bilal Bin Rabah.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* PWA GUIDE CARD IN PANDUAN */}
            <div className="bg-gradient-to-r from-teal-900 to-emerald-900 text-white rounded-3xl p-4 border border-teal-500/30 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-400 text-teal-950 flex items-center justify-center font-bold text-lg">
                    📲
                  </div>
                  <div>
                    <h3 className="font-black text-sm md:text-base text-amber-300">
                      Pasang di Layar Utama HP
                    </h3>
                    <p className="text-[11px] text-teal-100 font-medium">Buka langsung seperti aplikasi</p>
                  </div>
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setIsInstallGuideModalOpen(true)}
                  className="bg-amber-400 hover:bg-amber-300 text-teal-950 font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 shadow-sm"
                >
                  <span>Lihat Cara</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </motion.button>
              </div>
              <p className="text-xs text-teal-100/90 leading-relaxed">
                Bunda bisa menambahkan web ini ke beranda HP agar tidak perlu repot mencari link di WhatsApp atau mengetik alamat web lagi setiap ingin cek kas!
              </p>
            </div>
          </motion.section>
        )}

        {/* FOOTER ATTRIBUTION */}
        <footer className="mt-10 mb-24 md:mb-8 py-6 border-t border-teal-100/70 text-center space-y-1.5 no-print">
          <div className="text-xs font-bold text-slate-500 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Buku Kas & Uang THR Kelas 4 B Bilal Bin Rabah • SD Islam 2026/2027</span>
          </div>
          <div className="text-[11px] font-mono font-black text-teal-800 tracking-wider">
            Powered by code by MXI CODES
          </div>
        </footer>
      </main>

      {/* MODAL 0: SELAMAT DATANG & LOGIN SEMENTARA */}
      <AnimatePresence>
        {isLoginModalOpen && (
          <div className="modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content p-5 md:p-6"
            >
              <div className="text-center space-y-2 pb-3 border-b border-slate-100">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-md border-2 border-teal-100 p-1 flex items-center justify-center overflow-hidden"
                >
                  <img
                    src="/logo.png"
                    alt="Logo Kelas 4 B Bilal Bin Rabah"
                    className="w-full h-full object-contain"
                  />
                </motion.div>
                <h3 className="text-lg md:text-xl font-black text-slate-900">
                  Selamat Datang Bunda & Mama! 💖
                </h3>
                <p className="text-xs text-slate-500 font-semibold">
                  Aplikasi Kas & THR Murid Kelas 4 B Bilal Bin Rabah (2026–2027)
                </p>
              </div>

              <form onSubmit={handleLoginSubmit} className="space-y-3.5 pt-3">
                {/* Switch Role */}
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
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                        Sentuh & Pilih Nama Ananda Bunda: *
                      </label>
                      <span className="text-[11px] font-bold text-teal-700">25 Murid</span>
                    </div>

                    {/* Quick Search */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Cari nama atau panggilan anak..."
                        value={loginStudentSearch}
                        onChange={(e) => setLoginStudentSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      />
                    </div>

                    {/* CUSTOM VISUAL GRID OF 25 STUDENTS */}
                    <div className="max-h-[220px] overflow-y-auto space-y-1.5 p-1 border rounded-xl border-slate-200 bg-slate-50/50">
                      {students
                        .filter(
                          (s) =>
                            loginStudentSearch === '' ||
                            s.nickname.toLowerCase().includes(loginStudentSearch.toLowerCase()) ||
                            s.fullName.toLowerCase().includes(loginStudentSearch.toLowerCase()) ||
                            String(s.no) === loginStudentSearch.trim()
                        )
                        .map((s) => {
                          const isSelected = String(loginSelectedStudentId) === String(s.id);
                          return (
                            <motion.button
                              key={s.id}
                              type="button"
                              whileTap={{ scale: 0.98 }}
                              onClick={() => setLoginSelectedStudentId(String(s.id))}
                              className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-all border ${
                                isSelected
                                  ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                                  : 'bg-white text-slate-800 border-slate-200 hover:border-teal-300'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                    isSelected ? 'bg-white/20 text-white' : getAvatarBg(s.no)
                                  }`}
                                >
                                  {s.no}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-black text-xs md:text-sm truncate">
                                    {s.nickname}
                                  </div>
                                  <div
                                    className={`text-[10px] truncate ${
                                      isSelected ? 'text-teal-100' : 'text-slate-400'
                                    }`}
                                  >
                                    {s.fullName}
                                  </div>
                                </div>
                              </div>
                              {isSelected && <Check className="w-4 h-4 stroke-[3] shrink-0 text-white ml-2" />}
                            </motion.button>
                          );
                        })}
                    </div>

                    <p className="text-[11px] text-teal-700 font-semibold bg-teal-50 p-2 rounded-lg">
                      💡 <em>Cukup pilih sekali!</em> Setiap kali Bunda membuka web ini, form setor akan <strong>otomatis langsung terisi nama ananda</strong>.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">
                      Kata Sandi Pengurus / Bendahara:
                    </label>
                    <input
                      type="password"
                      placeholder="Masukkan kata sandi pengurus..."
                      value={loginPin}
                      onChange={(e) => setLoginPin(e.target.value)}
                      className="w-full p-3 rounded-xl border-2 border-purple-300 focus:border-purple-600 font-bold text-slate-900 text-sm"
                    />
                    <p className="text-[11px] text-purple-700 font-semibold bg-purple-50 p-2.5 rounded-xl border border-purple-100 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                      <span>Khusus pengurus kelas untuk mencatat pengeluaran kas.</span>
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

                <div className="pt-2 text-center text-[10px] text-slate-400 font-mono">
                  Powered by code by MXI CODES
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 1: SETOR KAS / THR (DENGAN VISUAL CUSTOM STUDENT SELECTOR) */}
      <AnimatePresence>
        {isDepositModalOpen && (
          <div className="modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content p-4 md:p-6"
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

              <form onSubmit={handleSubmitDeposit} className="space-y-3.5 pt-3">
                {/* 1. VISUAL CUSTOM STUDENT PICKER (NO UGLY BROWSER SELECT!) */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    1. Nama Ananda Murid Kelas 4 B Bilal Bin Rabah *
                  </label>

                  {/* Selected Card Banner */}
                  {selectedDepositStudent && !isSelectingStudentInModal ? (
                    <div className="p-3 bg-teal-50 rounded-2xl border-2 border-teal-300 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border shrink-0 ${getAvatarBg(
                            selectedDepositStudent.no
                          )}`}
                        >
                          {selectedDepositStudent.no}
                        </div>
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 text-sm md:text-base truncate">
                            {selectedDepositStudent.nickname}
                          </div>
                          <div className="text-[11px] text-slate-500 font-medium truncate">
                            {selectedDepositStudent.fullName}
                          </div>
                        </div>
                      </div>

                      {userRole === 'MAMA' ? (
                        <span className="text-[10px] font-black bg-teal-600 text-white px-2.5 py-1 rounded-xl shrink-0 flex items-center gap-1 shadow-xs">
                          <Lock className="w-3 h-3" /> Terkunci (Anak Bunda)
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setIsSelectingStudentInModal(true)}
                          className="text-xs font-black text-teal-800 bg-white border border-teal-300 hover:bg-teal-100 px-3 py-1.5 rounded-xl shrink-0"
                        >
                          Ganti Anak
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 border-2 border-teal-200 p-2.5 rounded-2xl bg-slate-50/50">
                      {/* Search box */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Ketik nama atau panggilan anak..."
                          value={depositStudentSearch}
                          onChange={(e) => setDepositStudentSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white"
                        />
                      </div>

                      {/* Visual Chips List */}
                      <div className="max-h-[170px] overflow-y-auto space-y-1.5 pr-1">
                        {students
                          .filter(
                            (s) =>
                              depositStudentSearch === '' ||
                              s.nickname.toLowerCase().includes(depositStudentSearch.toLowerCase()) ||
                              s.fullName.toLowerCase().includes(depositStudentSearch.toLowerCase()) ||
                              String(s.no) === depositStudentSearch.trim()
                          )
                          .map((s) => {
                            const isSelected = String(depositForm.studentId) === String(s.id);
                            return (
                              <motion.button
                                key={s.id}
                                type="button"
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                  setDepositForm({
                                    ...depositForm,
                                    studentId: String(s.id),
                                    note: `Setoran kas/THR ananda ${s.nickname}`,
                                    customStudentName: `${s.fullName} (${s.nickname})`,
                                  });
                                  setIsSelectingStudentInModal(false);
                                }}
                                className={`w-full p-2 rounded-xl flex items-center justify-between text-left transition-all border ${
                                  isSelected
                                    ? 'bg-teal-600 text-white border-teal-700 shadow-sm'
                                    : 'bg-white text-slate-800 border-slate-200 hover:border-teal-300'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                      isSelected ? 'bg-white/20 text-white' : getAvatarBg(s.no)
                                    }`}
                                  >
                                    {s.no}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-black text-xs truncate">
                                      {s.nickname}
                                    </div>
                                    <div
                                      className={`text-[10px] truncate ${
                                        isSelected ? 'text-teal-100' : 'text-slate-400'
                                      }`}
                                    >
                                      {s.fullName}
                                    </div>
                                  </div>
                                </div>
                                {isSelected && <Check className="w-4 h-4 stroke-[3] shrink-0 text-white" />}
                              </motion.button>
                            );
                          })}
                      </div>
                    </div>
                  )}
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

                {/* 4. Tanggal & Metode Bayar */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      Tanggal Bayar
                    </label>
                    <input
                      type="date"
                      required
                      value={depositForm.date}
                      onChange={(e) => setDepositForm({ ...depositForm, date: e.target.value })}
                      className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-800 text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Metode Pembayaran *</span>
                      <span className="text-[10px] font-bold text-teal-700">Sentuh untuk memilih</span>
                    </label>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'Transfer Mandiri', label: 'Bank Mandiri', sub: 'Kas Utama (127..)', badge: 'Mandiri', color: 'border-blue-500 bg-blue-50/80 text-blue-950', badgeColor: 'bg-blue-600 text-white' },
                        { id: 'Transfer BCA', label: 'Bank BCA', sub: 'Antar Bank', badge: 'BCA', color: 'border-indigo-500 bg-indigo-50/80 text-indigo-950', badgeColor: 'bg-indigo-600 text-white' },
                        { id: 'Transfer BRI', label: 'Bank BRI', sub: 'Antar Bank', badge: 'BRI', color: 'border-cyan-500 bg-cyan-50/80 text-cyan-950', badgeColor: 'bg-cyan-600 text-white' },
                        { id: 'Tunai', label: 'Tunai / Cash', sub: 'Titip Langsung', badge: '💵 Tunai', color: 'border-emerald-500 bg-emerald-50/80 text-emerald-950', badgeColor: 'bg-emerald-600 text-white' },
                        { id: 'Lainnya', label: 'E-Wallet / QRIS', sub: 'Gopay / OVO', badge: '📱 E-Wallet', color: 'border-purple-500 bg-purple-50/80 text-purple-950', badgeColor: 'bg-purple-600 text-white' },
                      ].map((item) => {
                        const isSelected = depositForm.paymentMethod === item.id;
                        return (
                          <motion.button
                            key={item.id}
                            type="button"
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setDepositForm({ ...depositForm, paymentMethod: item.id })}
                            className={`p-2.5 rounded-xl border-2 text-left transition-all relative flex flex-col justify-between ${
                              isSelected
                                ? `${item.color} ring-2 ring-teal-500/40 shadow-sm font-bold`
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${item.badgeColor}`}>
                                {item.badge}
                              </span>
                              {isSelected && <Check className="w-3.5 h-3.5 text-teal-700 stroke-[3]" />}
                            </div>
                            <div className="font-black text-xs leading-tight">{item.label}</div>
                            <div className="text-[9px] text-slate-500 truncate mt-0.5">{item.sub}</div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 5. Upload Bukti Screenshot / Struk */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-teal-600" />
                      <span>Bukti Transfer / Screenshot Struk</span>
                    </span>
                    <span className="text-[10px] font-bold text-teal-700">📸 Sangat Dianjurkan</span>
                  </label>

                  {depositForm.proofImage ? (
                    <div className="rounded-2xl border-2 border-teal-500 bg-teal-50/50 p-2.5 flex items-center gap-3">
                      <img
                        src={depositForm.proofImage}
                        alt="Bukti Transfer"
                        onClick={() => setPreviewImage(depositForm.proofImage)}
                        className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-md cursor-pointer hover:opacity-90 transition-opacity shrink-0"
                        title="Klik untuk melihat foto penuh"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-black text-teal-950 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-teal-600 stroke-[2.5]" />
                          <span>Foto Bukti Terlampir!</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Sentuh gambar untuk memperbesar
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setDepositForm((prev) => ({ ...prev, proofImage: null }))}
                        className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors shrink-0"
                      >
                        <Trash2 className="w-3 h-3" /> Hapus
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-teal-300 hover:border-teal-500 bg-teal-50/30 hover:bg-teal-50/60 rounded-2xl p-3.5 flex flex-col items-center justify-center cursor-pointer transition-all group">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-teal-600 group-hover:scale-110 transition-transform mb-1.5 border border-teal-200">
                        <Camera className="w-5 h-5 stroke-[2.5]" />
                      </div>
                      <div className="text-xs font-black text-teal-950 text-center">
                        Sentuh di Sini untuk Upload Screenshot Bukti Trf 📸
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5 text-center">
                        Bisa langsung ambil foto kamera atau pilih screenshot dari galeri HP
                      </div>
                    </label>
                  )}
                </div>

                {/* 6. Catatan */}
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                    Catatan Tambahan (Opsional)
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

      {/* MODAL 2: CATAT PENGELUARAN */}
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
                  <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>1. Kategori Pengeluaran *</span>
                    <span className="text-[10px] font-bold text-rose-600">Sentuh untuk memilih</span>
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto p-1.5 border rounded-2xl border-slate-200 bg-slate-50/60">
                    {[
                      { id: 'Tanda Kasih Sakit/Duka', label: 'Tanda Kasih Sakit/Duka', icon: '🩺', price: 150000 },
                      { id: 'Acara & Konsumsi Hari Guru', label: 'Acara Hari Guru', icon: '👩‍🏫', price: 200000 },
                      { id: 'Konsumsi & Snack Murid', label: 'Snack Murid', icon: '🧃', price: 100000 },
                      { id: 'Souvenir & Hadiah Murid/Guru', label: 'Souvenir & Hadiah', icon: '🎁', price: 150000 },
                      { id: 'Perlengkapan Kelas & Pensi', label: 'Pensi & Kelas', icon: '🎨', price: 100000 },
                      { id: 'Setoran THR ke POMG', label: 'Setor THR POMG', icon: '🕌', price: 2000000 },
                      { id: 'Lain-lain', label: 'Biaya Lain-lain', icon: '📦', price: 50000 },
                    ].map((cat) => {
                      const isSelected = expenseForm.expenseCategory === cat.id;
                      return (
                        <motion.button
                          key={cat.id}
                          type="button"
                          whileTap={{ scale: 0.96 }}
                          onClick={() =>
                            setExpenseForm({
                              ...expenseForm,
                              expenseCategory: cat.id,
                              unitPrice: cat.price,
                              amount: expenseForm.qty * cat.price,
                            })
                          }
                          className={`p-2 rounded-xl text-left border-2 text-xs flex items-center gap-2 transition-all ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50 text-rose-950 font-black shadow-sm ring-1 ring-rose-400'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="text-base">{cat.icon}</span>
                          <div className="min-w-0">
                            <div className="truncate font-black text-xs">{cat.label}</div>
                            <div className="text-[10px] text-slate-400">Rp {cat.price.toLocaleString('id-ID')}</div>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
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
                      className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-800 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1">
                      PIC Pengurus
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Mama Athalla (Bendahara)"
                      value={expenseForm.pic}
                      onChange={(e) =>
                        setExpenseForm({ ...expenseForm, pic: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border-2 border-slate-200 font-bold text-slate-800 text-xs"
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
              className="modal-content p-4 md:p-6 max-w-lg"
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
                    <p className="text-[11px] text-slate-500 font-medium">Pilih format, salin, atau langsung buka di WhatsApp</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsWaModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-black"
                >
                  ✕
                </button>
              </div>

              {/* Format Tabs Switcher */}
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl mt-3 text-xs font-black">
                <button
                  type="button"
                  onClick={() => setWaFormatTab('CONTRENG')}
                  className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    waFormatTab === 'CONTRENG'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>✅ & 👍🏻 Contreng Grup</span>
                  <span className="text-[9px] bg-white/20 px-1 rounded">Favorit</span>
                </button>
                <button
                  type="button"
                  onClick={() => setWaFormatTab('LENGKAP')}
                  className={`py-2 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    waFormatTab === 'LENGKAP'
                      ? 'bg-teal-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>📊 Laporan Rinci Saldo</span>
                </button>
              </div>

              <div className="pt-2.5 space-y-2.5">
                <div className="bg-slate-950 text-emerald-300 p-3.5 rounded-2xl font-mono text-xs max-h-[280px] overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner border border-slate-800">
                  {waFormatTab === 'CONTRENG' ? waContrengText : waReportText}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={copyCurrentWaMessage}
                    className={`flex-1 font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-2 text-xs md:text-sm transition-all ${
                      copiedWa
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-700/30'
                        : 'bg-teal-700 hover:bg-teal-800 text-white shadow-md shadow-teal-800/25'
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
                        <span>SALIN FORMAT (1 KLIK)</span>
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => {
                      const msg = waFormatTab === 'CONTRENG' ? waContrengText : waReportText;
                      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 text-xs md:text-sm shadow-md shadow-emerald-700/25"
                  >
                    <Send className="w-4 h-4" />
                    <span>BUKA DI WA</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 4: KONFIRMASI HAPUS TRANSAKSI (NO PURBA WINDOW.CONFIRM!) */}
      <AnimatePresence>
        {deleteConfirmItem && (
          <div className="modal-overlay z-[9999]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content p-5 max-w-sm text-center"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3 border border-rose-200">
                <Trash2 className="w-6 h-6 stroke-[2.5]" />
              </div>
              <h3 className="font-black text-slate-900 text-base mb-1">Hapus Transaksi Kas?</h3>
              <p className="text-xs text-slate-600 mb-4 font-medium px-2 leading-relaxed">
                Apakah Bunda/Pengurus yakin ingin menghapus catatan: <br />
                <strong className="text-slate-900 font-bold">"{deleteConfirmItem.desc}"</strong>?
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmItem(null)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-700 text-xs hover:bg-slate-100 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/30 transition-colors"
                >
                  Ya, Hapus
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 5: PREVIEW BUKTI TRANSFER (LIGHTBOX POPUP) */}
      <AnimatePresence>
        {previewImage && (
          <div
            className="modal-overlay z-[99999]"
            onClick={() => setPreviewImage(null)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-lg w-full bg-slate-900/95 backdrop-blur-md p-3 sm:p-4 rounded-3xl shadow-2xl border border-slate-700 mx-3"
            >
              <div className="flex items-center justify-between pb-2 text-white border-b border-slate-800 mb-2">
                <span className="text-xs font-black flex items-center gap-1.5 text-teal-300">
                  <Camera className="w-4 h-4 text-teal-400" />
                  Foto Bukti Transfer / Screenshot
                </span>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-auto flex items-center justify-center bg-black/60 rounded-2xl p-1.5">
                <img
                  src={previewImage}
                  alt="Bukti Transfer Penuh"
                  className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
                />
              </div>

              <div className="pt-3 text-center">
                <button
                  onClick={() => setPreviewImage(null)}
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow-md shadow-teal-700/30 transition-all"
                >
                  Tutup Gambar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 6: E-KUITANSI DIGITAL RESMI OTOMATIS */}
      <AnimatePresence>
        {currentReceipt && (
          <div className="modal-overlay receipt-modal-overlay z-[99999]">
            <motion.div
              id="receipt-print-area"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content p-5 md:p-6 max-w-lg bg-white border-2 border-teal-600 shadow-2xl relative"
            >
              {/* Receipt Header */}
              <div className="flex items-center justify-between border-b-2 border-dashed border-teal-200 pb-3">
                <div className="flex items-center gap-3">
                  <img
                    src="/logo.png"
                    alt="Logo Kelas 4 B Bilal Bin Rabah"
                    className="w-12 h-12 object-contain rounded-xl border border-teal-100 p-0.5 bg-white shadow-sm shrink-0"
                  />
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-wider text-teal-800">
                      4 B BILAL BIN RABAH • PERIODE MEI 2026–2027
                    </div>
                    <h3 className="font-black text-slate-900 text-sm md:text-base leading-tight">
                      KUITANSI RESMI KAS 4 B BILAL BIN RABAH
                    </h3>
                    <div className="text-[10px] font-mono text-slate-500 font-bold">
                      No: {currentReceipt.receiptNo}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setCurrentReceipt(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-black no-print"
                >
                  ✕
                </button>
              </div>

              {/* Receipt Body */}
              <div className="py-4 space-y-3 relative overflow-hidden">
                {/* Lunas Stamp Watermark */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 rotate-[-18deg] border-4 border-emerald-600/30 text-emerald-700/40 font-black text-2xl md:text-3xl px-4 py-1.5 rounded-2xl pointer-events-none select-none uppercase tracking-widest text-center">
                  <div>LUNAS ✓</div>
                  <div className="text-[9px] tracking-normal">4 B BILAL BIN RABAH</div>
                </div>

                <div className="grid grid-cols-3 text-xs gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Telah Terima Dari</span>
                  <span className="col-span-2 font-black text-slate-900">
                    Mama {currentReceipt.nickname} (Ananda {currentReceipt.studentName})
                  </span>
                </div>

                <div className="grid grid-cols-3 text-xs gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">No. Absen</span>
                  <span className="col-span-2 font-bold text-teal-800">
                    #{currentReceipt.noAbsen} • 4 B Bilal Bin Rabah
                  </span>
                </div>

                <div className="grid grid-cols-3 text-xs gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Untuk Pembayaran</span>
                  <span className="col-span-2 font-black text-teal-950">
                    {currentReceipt.category === 'KAS_MASUK'
                      ? 'Iuran Kas Rutin 4 B Bilal Bin Rabah'
                      : 'Iuran Uang THR Idul Fitri Guru & Karyawan'}
                  </span>
                </div>

                <div className="grid grid-cols-3 text-xs gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Metode Bayar</span>
                  <span className="col-span-2 font-bold text-slate-800">
                    {currentReceipt.paymentMethod}
                  </span>
                </div>

                <div className="grid grid-cols-3 text-xs gap-1 border-b border-slate-100 pb-2">
                  <span className="text-slate-500 font-medium">Tanggal Terima</span>
                  <span className="col-span-2 font-medium text-slate-800">
                    {currentReceipt.date}
                  </span>
                </div>

                {/* Amount Highlight Box */}
                <div className="bg-teal-50 border-2 border-teal-300 rounded-2xl p-3 text-center my-2 shadow-inner">
                  <div className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                    Jumlah Pembayaran
                  </div>
                  <div className="text-2xl font-black text-teal-950 my-0.5">
                    Rp {currentReceipt.amount.toLocaleString('id-ID')}
                  </div>
                  <div className="text-[11px] font-semibold italic text-teal-700">
                    "{currentReceipt.amountInWords}"
                  </div>
                </div>

                {/* Signature & PIC */}
                <div className="flex items-end justify-between pt-1">
                  <div className="text-[10px] text-slate-400">
                    Dokumen ini sah & tercatat otomatis<br />dalam sistem pembukuan Kas 4 B Bilal Bin Rabah.
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500">Diterima & Diverifikasi:</div>
                    <div className="font-black text-xs text-teal-950 mt-1 underline decoration-teal-600 underline-offset-4">
                      {currentReceipt.pic}
                    </div>
                  </div>
                </div>

                <div className="text-center pt-2.5 border-t border-slate-100 text-[10px] text-slate-400 font-mono">
                  Powered by code by MXI CODES
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row gap-2 no-print">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleSendReceiptWa(currentReceipt)}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-700/25 transition-all"
                >
                  <Send className="w-4 h-4" />
                  <span>KIRIM KE WHATSAPP</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handlePrintReceipt}
                  className="px-3.5 py-2.5 rounded-xl border-2 border-teal-600 hover:bg-teal-50 font-black text-xs text-teal-800 flex items-center justify-center gap-1.5 transition-all shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>CETAK / PDF</span>
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleCopyReceiptText(currentReceipt)}
                  className={`px-3 py-2.5 rounded-xl border font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
                    copiedReceipt
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Salin format teks kuitansi ke clipboard"
                >
                  {copiedReceipt ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                  <span>{copiedReceipt ? 'TERSALIN' : 'SALIN TEKS'}</span>
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 7: DETAIL PROFIL & RIWAYAT LENGKAP MURID */}
      <AnimatePresence>
        {selectedStudentDetail && (
          <div className="modal-overlay z-[9999]">
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="modal-content p-5 md:p-6 max-w-lg"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm border shrink-0 ${getAvatarBg(
                      selectedStudentDetail.no
                    )}`}
                  >
                    {selectedStudentDetail.no}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 text-base md:text-lg truncate">
                      {selectedStudentDetail.nickname}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium truncate">
                      {selectedStudentDetail.fullName} • Absen #{selectedStudentDetail.no}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedStudentDetail(null)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-black"
                >
                  ✕
                </button>
              </div>

              {/* Payment Summary */}
              <div className="grid grid-cols-2 gap-2 pt-3">
                <div className="p-3 bg-teal-50/70 rounded-2xl border border-teal-200">
                  <div className="text-[10px] font-bold text-teal-800 uppercase tracking-wider">
                    Iuran Kas Rutin
                  </div>
                  <div className="text-base font-black text-teal-950 mt-0.5">
                    Rp {selectedStudentDetail.totalKasPaid.toLocaleString('id-ID')}
                  </div>
                  <div className="mt-1">
                    {selectedStudentDetail.kasLunas ? (
                      <span className="badge badge-success text-[10px]">LUNAS (Min Rp 200rb)</span>
                    ) : (
                      <span className="badge badge-warning text-[10px]">Kurang Rp {(200000 - selectedStudentDetail.totalKasPaid).toLocaleString('id-ID')}</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200">
                  <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                    Uang THR Lebaran
                  </div>
                  <div className="text-base font-black text-amber-950 mt-0.5">
                    Rp {selectedStudentDetail.totalThrPaid.toLocaleString('id-ID')}
                  </div>
                  <div className="mt-1">
                    {selectedStudentDetail.thrLunas ? (
                      <span className="badge badge-success text-[10px]">LUNAS (Min Rp 100rb)</span>
                    ) : (
                      <span className="badge badge-warning text-[10px]">Kurang Rp {(100000 - selectedStudentDetail.totalThrPaid).toLocaleString('id-ID')}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Transaction List for This Child */}
              <div className="pt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-xs text-slate-800 uppercase tracking-wider">
                    Riwayat Pembayaran Ananda:
                  </h4>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {transactions.filter((t) => t.studentId === selectedStudentDetail.id).length} Catatan
                  </span>
                </div>

                <div className="max-h-[200px] overflow-y-auto space-y-1.5 pr-1">
                  {transactions.filter((t) => t.studentId === selectedStudentDetail.id).length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl text-center text-xs text-slate-400 font-bold border border-slate-200">
                      Belum ada catatan pembayaran kas untuk ananda {selectedStudentDetail.nickname}.
                    </div>
                  ) : (
                    transactions
                      .filter((t) => t.studentId === selectedStudentDetail.id)
                      .map((tx) => (
                        <div
                          key={tx.id}
                          className="p-2.5 rounded-xl border border-slate-200 bg-white shadow-xs flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="font-black text-xs text-slate-900 flex items-center gap-1.5">
                              <span>{tx.category === 'KAS_MASUK' ? 'Kas Rutin' : 'Uang THR'}</span>
                              <span className="font-mono text-emerald-700">Rp {tx.amount.toLocaleString('id-ID')}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {tx.date} • via {tx.paymentMethod || 'Mandiri'}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {tx.proofImage && (
                              <button
                                onClick={() => setPreviewImage(tx.proofImage!)}
                                className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold"
                                title="Lihat Bukti Foto"
                              >
                                📸
                              </button>
                            )}
                            <button
                              onClick={() => {
                                handleGenerateReceipt(
                                  selectedStudentDetail,
                                  tx.category as 'KAS_MASUK' | 'THR_MASUK',
                                  tx.amount,
                                  tx.paymentMethod || 'Transfer Mandiri',
                                  tx.note || 'Lunas Terverifikasi'
                                );
                              }}
                              className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg text-[10px] font-black flex items-center gap-1"
                            >
                              <FileText className="w-3 h-3 text-amber-700" />
                              <span>Kuitansi</span>
                            </button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
                {(!currentMamaStudent || selectedStudentDetail.id === currentMamaStudent?.id || userRole === 'BENDAHARA') ? (
                  <>
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        const st = selectedStudentDetail;
                        setSelectedStudentDetail(null);
                        handleOpenDepositForStudent(st, 'KAS_MASUK');
                      }}
                      className="bg-teal-600 hover:bg-teal-700 text-white font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Setor Kas
                    </motion.button>

                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        const st = selectedStudentDetail;
                        setSelectedStudentDetail(null);
                        handleOpenDepositForStudent(st, 'THR_MASUK');
                      }}
                      className="bg-amber-500 hover:bg-amber-600 text-amber-950 font-black py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Gift className="w-3.5 h-3.5" /> Setor THR
                    </motion.button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedStudentDetail(null)}
                    className="col-span-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                  >
                    Tutup Riwayat Ananda
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 8: PENGATURAN GANTI PIN PENGURUS */}
      <AnimatePresence>
        {isPinModalOpen && (
          <div className="modal-overlay z-[99999]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content p-5 md:p-6 max-w-sm"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
                    <Key className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm md:text-base">
                      Ubah PIN Pengurus 🔒
                    </h3>
                    <p className="text-[10px] text-slate-500">Khusus Bendahara Kelas 4B</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsPinModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-black"
                >
                  ✕
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!newAdminPin || newAdminPin.trim().length < 3) {
                    showToast('PIN minimal 3 karakter ya Bunda!', 'error');
                    return;
                  }
                  localStorage.setItem('ambu_admin_pin', newAdminPin.trim());
                  setIsPinModalOpen(false);
                  setNewAdminPin('');
                  showToast('PIN Pengurus berhasil diubah & tersimpan! 🔒', 'success');
                }}
                className="pt-3 space-y-3"
              >
                <div>
                  <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-1">
                    PIN / Kata Sandi Baru:
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Masukkan PIN baru (misal: Ambu132)"
                    value={newAdminPin}
                    onChange={(e) => setNewAdminPin(e.target.value)}
                    className="w-full p-2.5 rounded-xl border-2 border-purple-300 focus:border-purple-600 font-bold text-slate-900 text-sm"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    PIN ini akan digunakan setiap kali login sebagai Pengurus / Bendahara.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsPinModalOpen(false)}
                    className="flex-1 py-2 rounded-xl border border-slate-300 font-bold text-slate-700 text-xs hover:bg-slate-100"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-black text-xs shadow-md shadow-purple-700/25"
                  >
                    Simpan PIN
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 9: PANDUAN TAMBAH KE LAYAR UTAMA (PWA GUIDE) */}
      <AnimatePresence>
        {isInstallGuideModalOpen && (
          <div className="modal-overlay z-[99999]">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content p-5 md:p-6 max-w-md bg-white rounded-3xl shadow-2xl space-y-3.5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xl">
                    📲
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 text-sm md:text-base">
                      Cara Pasang di Beranda HP
                    </h3>
                    <p className="text-[10px] text-slate-500 font-bold">Buka langsung tanpa repot ketik web lagi</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsInstallGuideModalOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 flex items-center justify-center font-black"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-700">
                {/* iPhone / Safari */}
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-black text-slate-900 flex items-center gap-1.5 text-xs text-teal-900">
                    <span>🍎 Pengguna iPhone / iPad (Safari):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 font-medium leading-relaxed">
                    <li>Buka web ini di browser <strong>Safari</strong>.</li>
                    <li>Sentuh tombol <strong>Share / Bagikan (kotak panah ke atas ⎋)</strong> di menu bawah Safari.</li>
                    <li>Gulir ke bawah, pilih <strong>"Tambahkan ke Layar Utama"</strong> (<em>Add to Home Screen</em>).</li>
                    <li>Klik <strong>"Tambah"</strong> di pojok kanan atas. Icon Kas 4B langsung siap di layar HP Bunda!</li>
                  </ol>
                </div>

                {/* Android / Chrome */}
                <div className="p-3 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-1.5">
                  <div className="font-black text-slate-900 flex items-center gap-1.5 text-xs text-teal-900">
                    <span>🤖 Pengguna Android (Chrome / Samsung):</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600 font-medium leading-relaxed">
                    <li>Sentuh tombol <strong>Titik Tiga (⋮)</strong> di pojok kanan atas Chrome.</li>
                    <li>Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Install Aplikasi"</strong>.</li>
                    <li>Klik <strong>"Tambah / Install"</strong>. Icon Kas 4B langsung muncul di layar HP Bunda!</li>
                  </ol>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setIsInstallGuideModalOpen(false);
                    dismissInstallNotice();
                  }}
                  className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white font-black text-xs rounded-xl shadow-md shadow-teal-800/20"
                >
                  Siap, Saya Mengerti! 👍
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FLOATING MODERN TOAST NOTIFICATIONS (NO MORE PURBA BROWSER ALERTS!) */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[999999] flex flex-col items-center gap-2 pointer-events-none w-[92%] max-w-md no-print toasts-container">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -25, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.92 }}
              transition={{ duration: 0.25, type: 'spring', stiffness: 400, damping: 25 }}
              className={`pointer-events-auto w-full px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-3 backdrop-blur-md ${
                toast.type === 'success'
                  ? 'bg-emerald-950/95 text-white border-emerald-500/50 shadow-emerald-950/40'
                  : toast.type === 'error'
                  ? 'bg-rose-950/95 text-white border-rose-500/50 shadow-rose-950/40'
                  : 'bg-teal-950/95 text-white border-teal-500/50 shadow-teal-950/40'
              }`}
            >
              <div className="shrink-0">
                {toast.type === 'success' && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                )}
                {toast.type === 'error' && (
                  <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 stroke-[2.5]" />
                  </div>
                )}
                {toast.type === 'info' && (
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <Info className="w-5 h-5 stroke-[2.5]" />
                  </div>
                )}
              </div>
              <div className="flex-1 text-xs md:text-sm font-bold leading-snug">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 p-1 rounded-lg hover:bg-white/20 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
            const prefillStudentId = currentMamaStudent ? String(currentMamaStudent.id) : '';
            setDepositForm({
              studentId: prefillStudentId,
              category: 'KAS_MASUK',
              amount: 200000,
              date: new Date().toISOString().split('T')[0],
              paymentMethod: 'Transfer Mandiri',
              note: currentMamaStudent ? `Setoran kas ananda ${currentMamaStudent.nickname}` : '',
              customStudentName: currentMamaStudent ? `${currentMamaStudent.fullName} (${currentMamaStudent.nickname})` : '',
              proofImage: null,
            });
            setIsSelectingStudentInModal(!prefillStudentId);
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
