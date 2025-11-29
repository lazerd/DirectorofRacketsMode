import { NextRequest, NextResponse } from 'next/server';
import { 
  registerDirector, 
  registerClubCoach, 
  registerIndependentCoach,
  createSession 
} from '@/lib/auth';
import type { UserRole } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, timezone, clubName, inviteCode } = body;

    // Validation
    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: 'Email, password, name, and role are required' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const validRoles: UserRole[] = ['director', 'club_coach', 'independent_coach'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    let result;

    if (role === 'director') {
      if (!clubName) {
        return NextResponse.json(
          { success: false, error: 'Club name is required for directors' },
          { status: 400 }
        );
      }
      result = await registerDirector(email, password, name, clubName, timezone);
    } else if (role === 'club_coach') {
      if (!inviteCode) {
        return NextResponse.json(
          { success: false, error: 'Invite code is required to join a club' },
          { status: 400 }
        );
      }
      result = await registerClubCoach(email, password, name, inviteCode, timezone);
    } else {
      result = await registerIndependentCoach(email, password, name, timezone);
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    // Create session
    await createSession(result.coach!.id);

    return NextResponse.json({
      success: true,
      data: {
        id: result.coach!.id,
        email: result.coach!.email,
        name: result.coach!.name,
        role: result.coach!.role,
        club_id: result.coach!.club_id,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred during registration' },
      { status: 500 }
    );
  }
}
