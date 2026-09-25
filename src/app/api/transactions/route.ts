import { NextResponse } from 'next/server';
import { getTransactions, createTransaction, deleteTransaction } from '@/lib/db';
import {
  getClientIp,
  isRateLimited,
  sanitizeString,
  validateAmount,
  validateCategory,
  validateBase64Image,
  verifyAdminPin,
} from '@/lib/security';

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip, 'tx-get', 120, 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak permintaan. Silakan tunggu sebentar.' },
        { status: 429 }
      );
    }

    const transactions = await getTransactions();
    return NextResponse.json({ success: true, data: transactions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Terjadi kesalahan sistem.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    
    // Anti-flooding / Anti-spam rate limiter
    if (isRateLimited(ip, 'tx-post', 30, 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Aktivitas pengiriman terlalu cepat. Mohon tunggu 1 menit.' },
        { status: 429 }
      );
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Format data tidak valid.' },
        { status: 400 }
      );
    }

    // 1. Validate Category
    if (!body.category || !validateCategory(body.category)) {
      return NextResponse.json(
        { success: false, error: 'Kategori transaksi tidak valid.' },
        { status: 400 }
      );
    }

    // Normalize KADEUDEUH category to database category
    let finalCategory = body.category;
    if (finalCategory === 'KADEUDEUH_MASUK') finalCategory = 'THR_MASUK';
    if (finalCategory === 'KADEUDEUH_KELUAR') finalCategory = 'THR_KELUAR';

    // 2. Protect Admin-only transactions (Pengeluaran Kas / Kadeudeuh Keluar)
    const isExpense = finalCategory === 'PENGELUARAN' || finalCategory === 'THR_KELUAR';
    if (isExpense) {
      const pinHeader = request.headers.get('x-admin-pin');
      if (!verifyAdminPin(pinHeader)) {
        return NextResponse.json(
          { success: false, error: 'Akses ditolak: Hanya Pengurus/Bendahara resmi yang dapat mencatat pengeluaran.' },
          { status: 401 }
        );
      }
    }

    // 3. Validate Amount
    const amountCheck = validateAmount(body.amount);
    if (!amountCheck.valid) {
      return NextResponse.json(
        { success: false, error: amountCheck.error || 'Nominal tidak valid.' },
        { status: 400 }
      );
    }

    // 4. Sanitize and Validate Description
    const description = sanitizeString(body.description, 200);
    if (!description || description.length < 3) {
      return NextResponse.json(
        { success: false, error: 'Keterangan transaksi minimal 3 karakter.' },
        { status: 400 }
      );
    }

    // 5. Sanitize Student Name & ID
    const studentName = body.studentName ? sanitizeString(body.studentName, 100) : null;
    let studentId = body.studentId ? Number(body.studentId) : null;
    if (studentId !== null && (isNaN(studentId) || studentId < 1 || studentId > 50)) {
      studentId = null;
    }

    // 6. Validate & Sanitize Date (YYYY-MM-DD)
    let dateStr = body.date;
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      dateStr = new Date().toISOString().split('T')[0];
    }

    // 7. Sanitize optional metadata
    const paymentMethod = sanitizeString(body.paymentMethod, 50, 'Transfer BNI');
    const pic = sanitizeString(body.pic, 60, isExpense ? 'Mama Athalla (Bendahara)' : 'Wali Murid');
    const note = body.note ? sanitizeString(body.note, 200) : null;

    // 8. Validate uploaded screenshot image (anti-malicious file injection)
    if (body.proofImage && !validateBase64Image(body.proofImage)) {
      return NextResponse.json(
        { success: false, error: 'Format foto bukti tidak didukung (harus JPG/PNG/WEBP dan < 600KB).' },
        { status: 400 }
      );
    }

    const type = isExpense ? 'OUT' : 'IN';

    const newTx = await createTransaction({
      date: dateStr,
      category: finalCategory,
      type,
      studentId,
      studentName,
      description,
      amount: amountCheck.amount,
      qty: body.qty ? Math.max(1, Math.min(1000, Number(body.qty))) : null,
      unitPrice: body.unitPrice ? Math.max(0, Math.min(50000000, Number(body.unitPrice))) : null,
      paymentMethod,
      pic,
      note,
      proofImage: body.proofImage || null,
    });

    return NextResponse.json({ success: true, data: newTx });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Gagal memproses transaksi. Silakan coba lagi.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const ip = getClientIp(request);

    // Rate limit DELETE attempts
    if (isRateLimited(ip, 'tx-delete', 20, 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak permintaan penghapusan. Mohon tunggu.' },
        { status: 429 }
      );
    }

    // Strict Admin Authorization Check
    const pinHeader = request.headers.get('x-admin-pin');
    if (!verifyAdminPin(pinHeader)) {
      return NextResponse.json(
        { success: false, error: 'Akses ditolak: Anda tidak memiliki izin untuk menghapus transaksi.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id || typeof id !== 'string' || id.length > 80) {
      return NextResponse.json(
        { success: false, error: 'ID transaksi tidak valid.' },
        { status: 400 }
      );
    }

    // Sanitize ID
    const cleanId = id.replace(/[^a-zA-Z0-9_-]/g, '');
    const deleted = await deleteTransaction(cleanId);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Gagal menghapus transaksi.' },
      { status: 500 }
    );
  }
}
