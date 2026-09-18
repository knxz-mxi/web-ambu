import { PrismaClient } from '@prisma/client';
import { STUDENTS_KELAS_4B, StudentItem } from './students';

// Global Prisma instance for Next.js hot reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient | undefined };

export const prisma: PrismaClient | null =
  process.env.DATABASE_URL
    ? globalForPrisma.prisma ||
      new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
      })
    : null;

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

// Fallback in-memory data store when DATABASE_URL is not set yet
export interface AppTransaction {
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

// Initial sample transactions for Kelas 4B 2026-2027 so the app starts with realistic data
const initialTransactions: AppTransaction[] = [
  {
    id: 'tx-1',
    date: '2026-07-20',
    category: 'KAS_MASUK',
    type: 'IN',
    studentId: 1,
    studentName: 'AFRAZ VILARINO SEHRAN (Afraz)',
    description: 'Diterima uang kas semester 1 dari Afraz',
    amount: 200000,
    paymentMethod: 'Mandiri',
    pic: 'Mama Bia',
    note: 'Trf ke Rek Mandiri 1270004638738',
    createdAt: new Date('2026-07-20T08:30:00Z').toISOString(),
  },
  {
    id: 'tx-2',
    date: '2026-07-20',
    category: 'KAS_MASUK',
    type: 'IN',
    studentId: 2,
    studentName: 'AISHA FATHIA (Fathia)',
    description: 'Diterima uang kas semester 1 dari Fathia',
    amount: 200000,
    paymentMethod: 'BCA',
    pic: 'Mama Bia',
    note: 'Trf ke Rek Mandiri 1270004638738',
    createdAt: new Date('2026-07-20T09:15:00Z').toISOString(),
  },
  {
    id: 'tx-3',
    date: '2026-07-21',
    category: 'KAS_MASUK',
    type: 'IN',
    studentId: 5,
    studentName: 'ANINDITA KHALIQA QUEEN DANIA DURAHMAN (Queen)',
    description: 'Diterima uang kas semester 1 dari Queen',
    amount: 200000,
    paymentMethod: 'Mandiri',
    pic: 'Mama Bia',
    note: 'Trf ke Rek Mandiri 1270004638738',
    createdAt: new Date('2026-07-21T10:00:00Z').toISOString(),
  },
  {
    id: 'tx-4',
    date: '2026-07-22',
    category: 'THR_MASUK',
    type: 'IN',
    studentId: 1,
    studentName: 'AFRAZ VILARINO SEHRAN (Afraz)',
    description: 'Diterima uang THR dari Afraz',
    amount: 100000,
    paymentMethod: 'Mandiri',
    pic: 'Mama Bia',
    note: 'Trf Mandiri',
    createdAt: new Date('2026-07-22T11:00:00Z').toISOString(),
  },
  {
    id: 'tx-5',
    date: '2026-07-25',
    category: 'PENGELUARAN',
    type: 'OUT',
    studentId: null,
    studentName: null,
    description: 'Membeli perlengkapan kebersihan dan kotak P3K kelas 4B',
    amount: 125000,
    qty: 1,
    unitPrice: 125000,
    paymentMethod: 'Tunai',
    pic: 'Ibun Cheryl',
    note: 'Struk terlampir',
    createdAt: new Date('2026-07-25T14:30:00Z').toISOString(),
  }
];

// Fallback memory state (isolated per server instance)
let memoryTransactions: AppTransaction[] = [...initialTransactions];

export async function getStudents(): Promise<StudentItem[]> {
  if (prisma) {
    try {
      const dbStudents = await prisma.student.findMany({
        orderBy: { no: 'asc' },
      });
      if (dbStudents.length > 0) {
        return dbStudents.map((s) => ({
          id: s.id,
          no: s.no,
          fullName: s.fullName,
          nickname: s.nickname,
          gender: (s.gender as 'L' | 'P') || undefined,
        }));
      }
      // If db table is empty, seed it!
      for (const s of STUDENTS_KELAS_4B) {
        await prisma.student.create({
          data: {
            no: s.no,
            fullName: s.fullName,
            nickname: s.nickname,
            gender: s.gender,
          },
        });
      }
      return STUDENTS_KELAS_4B;
    } catch (e) {
      console.warn('DB student query failed, fallback to static list:', e);
      return STUDENTS_KELAS_4B;
    }
  }
  return STUDENTS_KELAS_4B;
}

export async function getTransactions(): Promise<AppTransaction[]> {
  if (prisma) {
    try {
      const list = await prisma.transaction.findMany({
        orderBy: { date: 'asc' },
        include: { student: true },
      });
      return list.map((t) => ({
        id: t.id,
        date: t.date.toISOString().split('T')[0],
        category: t.category as AppTransaction['category'],
        type: t.type as 'IN' | 'OUT',
        studentId: t.studentId,
        studentName: t.studentName || (t.student ? `${t.student.fullName} (${t.student.nickname})` : null),
        description: t.description,
        amount: t.amount,
        qty: t.qty,
        unitPrice: t.unitPrice,
        paymentMethod: t.paymentMethod,
        pic: t.pic,
        note: t.note,
        createdAt: t.createdAt.toISOString(),
      }));
    } catch (e) {
      console.warn('DB transaction query failed, using memory store:', e);
      return memoryTransactions;
    }
  }
  return memoryTransactions;
}

export async function createTransaction(data: Omit<AppTransaction, 'id' | 'createdAt'>): Promise<AppTransaction> {
  if (prisma) {
    try {
      const created = await prisma.transaction.create({
        data: {
          date: new Date(data.date),
          category: data.category,
          type: data.type,
          studentId: data.studentId || undefined,
          studentName: data.studentName || undefined,
          description: data.description,
          amount: data.amount,
          qty: data.qty || undefined,
          unitPrice: data.unitPrice || undefined,
          paymentMethod: data.paymentMethod || undefined,
          pic: data.pic || undefined,
          note: data.note || undefined,
        },
      });
      return {
        id: created.id,
        date: created.date.toISOString().split('T')[0],
        category: created.category as AppTransaction['category'],
        type: created.type as 'IN' | 'OUT',
        studentId: created.studentId,
        studentName: created.studentName,
        description: created.description,
        amount: created.amount,
        qty: created.qty,
        unitPrice: created.unitPrice,
        paymentMethod: created.paymentMethod,
        pic: created.pic,
        note: created.note,
        createdAt: created.createdAt.toISOString(),
      };
    } catch (e) {
      console.warn('DB create failed, saving to memory store:', e);
    }
  }

  const newTx: AppTransaction = {
    ...data,
    id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
  };
  memoryTransactions.push(newTx);
  return newTx;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  if (prisma) {
    try {
      await prisma.transaction.delete({ where: { id } });
      return true;
    } catch (e) {
      console.warn('DB delete failed, trying memory store:', e);
    }
  }
  const initialLength = memoryTransactions.length;
  memoryTransactions = memoryTransactions.filter((tx) => tx.id !== id);
  return memoryTransactions.length < initialLength;
}
