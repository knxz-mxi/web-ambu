import { NextResponse } from 'next/server';
import { getTransactions, createTransaction, deleteTransaction } from '@/lib/db';

export async function GET() {
  try {
    const transactions = await getTransactions();
    return NextResponse.json({ success: true, data: transactions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.description || !body.amount || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Keterangan, nominal, dan kategori wajib diisi.' },
        { status: 400 }
      );
    }

    const type = body.category === 'KAS_MASUK' || body.category === 'THR_MASUK' ? 'IN' : 'OUT';

    const newTx = await createTransaction({
      date: body.date || new Date().toISOString().split('T')[0],
      category: body.category,
      type,
      studentId: body.studentId ? Number(body.studentId) : null,
      studentName: body.studentName || null,
      description: body.description,
      amount: Number(body.amount),
      qty: body.qty ? Number(body.qty) : null,
      unitPrice: body.unitPrice ? Number(body.unitPrice) : null,
      paymentMethod: body.paymentMethod || 'Transfer',
      pic: body.pic || 'Mama Bendahara',
      note: body.note || null,
    });

    return NextResponse.json({ success: true, data: newTx });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ success: false, error: 'ID transaksi dibutuhkan.' }, { status: 400 });
    }

    const deleted = await deleteTransaction(id);
    return NextResponse.json({ success: deleted });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
