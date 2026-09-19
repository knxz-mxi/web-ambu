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
  proofImage?: string | null;
  createdAt: string;
}

// Transaksi kas riil Kelas 4 B Bilal Bin Rabah Periode Mei 2026 s/d Mei 2027
const initialTransactions: AppTransaction[] = [
  {
    id: 'tx-real-1',
    date: '2026-08-21',
    category: 'KAS_MASUK',
    type: 'IN',
    studentId: 21,
    studentName: 'RAFFASYA AL FAEYZA BAHARTHAH (Fasya)',
    description: 'Diterima uang kas dari Fasya',
    amount: 200000,
    paymentMethod: 'Transfer BNI',
    pic: 'Nia Mulyawati',
    note: 'Lunas 21/8 - Trf BNI 2102403976',
    createdAt: new Date('2026-08-21T08:30:00Z').toISOString(),
  },
  {
    id: 'tx-real-2',
    date: '2026-10-04',
    category: 'KAS_MASUK',
    type: 'IN',
    studentId: 5,
    studentName: 'ANINDITA KHALIQA QUEEN DANIA DURAHMAN (Queen)',
    description: 'Diterima uang kas dari Queen',
    amount: 200000,
    paymentMethod: 'Transfer BNI',
    pic: 'Nia Mulyawati',
    note: 'Lunas 4/10 - Trf BNI 2102403976',
    createdAt: new Date('2026-10-04T09:15:00Z').toISOString(),
  },
  {
    id: 'tx-real-3',
    date: '2026-10-08',
    category: 'KAS_MASUK',
    type: 'IN',
    studentId: 12,
    studentName: 'GHAIDA NUR AQUILA SAKHI (Cneng)',
    description: 'Diterima uang kas dari Cneng (Bertahap)',
    amount: 120000,
    paymentMethod: 'Transfer BNI',
    pic: 'Nia Mulyawati',
    note: 'Bertahap 8/10 Rp 120rb - Trf BNI 2102403976',
    createdAt: new Date('2026-10-08T10:00:00Z').toISOString(),
  },
  {
    id: 'tx-real-4',
    date: '2026-10-18',
    category: 'KAS_MASUK',
    type: 'IN',
    studentId: 15,
    studentName: 'MUHAMMAD ARKAN RAZKA PUTRA (Arkan)',
    description: 'Diterima uang kas dari Arkan',
    amount: 200000,
    paymentMethod: 'Transfer BNI',
    pic: 'Nia Mulyawati',
    note: 'Lunas 18/10 - Trf BNI 2102403976',
    createdAt: new Date('2026-10-18T11:00:00Z').toISOString(),
  },
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
      const created = await (prisma.transaction as any).create({
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
          proofImage: data.proofImage || undefined,
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
        proofImage: (created as any).proofImage,
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
