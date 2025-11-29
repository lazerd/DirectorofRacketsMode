import { NextResponse } from 'next/server';
import { logoutCoach } from '@/lib/auth';

export async function POST() {
  try {
    await logoutCoach();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during logout' },
      { status: 500 }
    );
  }
}
