import { NextResponse } from 'next/server';
import { getStudents } from '@/lib/db';
import { getClientIp, isRateLimited } from '@/lib/security';

export async function GET(request: Request) {
  try {
    const ip = getClientIp(request);
    if (isRateLimited(ip, 'students-get', 60, 60 * 1000)) {
      return NextResponse.json(
        { success: false, error: 'Terlalu banyak permintaan.' },
        { status: 429 }
      );
    }

    const students = await getStudents();
    return NextResponse.json({ success: true, data: students });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data murid.' },
      { status: 500 }
    );
  }
}
