import { NextResponse } from 'next/server';
import { getStudents } from '@/lib/db';

export async function GET() {
  try {
    const students = await getStudents();
    return NextResponse.json({ success: true, data: students });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
