import { NextRequest, NextResponse } from 'next/server';
import { getSession, isDirector } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

// GET - Get pending invitations for the club
export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!isDirector(user) || !user.club_id) {
      return NextResponse.json(
        { success: false, error: 'Only directors can view invitations' },
        { status: 403 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: invitations, error } = await supabase
      .from('club_invitations')
      .select('*')
      .eq('club_id', user.club_id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: invitations });
  } catch (error) {
    console.error('Get invitations error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// POST - Create a new invitation
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!isDirector(user) || !user.club_id) {
      return NextResponse.json(
        { success: false, error: 'Only directors can invite coaches' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
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

    const supabase = await createServerSupabaseClient();

    // Check if email is already a coach in this club
    const { data: existingCoach } = await supabase
      .from('coaches')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('club_id', user.club_id)
      .single();

    if (existingCoach) {
      return NextResponse.json(
        { success: false, error: 'This email is already a coach in your club' },
        { status: 400 }
      );
    }

    // Check for pending invitation
    const { data: existingInvite } = await supabase
      .from('club_invitations')
      .select('id')
      .eq('email', email.toLowerCase())
      .eq('club_id', user.club_id)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { success: false, error: 'An invitation is already pending for this email' },
        { status: 400 }
      );
    }

    // Generate invite code (8 characters)
    const inviteCode = uuidv4().substring(0, 8).toUpperCase();

    // Create invitation (expires in 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data: invitation, error } = await supabase
      .from('club_invitations')
      .insert({
        id: uuidv4(),
        club_id: user.club_id,
        email: email.toLowerCase(),
        invite_code: inviteCode,
        status: 'pending',
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // TODO: Send invitation email to the coach

    return NextResponse.json({
      success: true,
      data: invitation,
    }, { status: 201 });
  } catch (error) {
    console.error('Create invitation error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// DELETE - Cancel/revoke an invitation
export async function DELETE(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!isDirector(user) || !user.club_id) {
      return NextResponse.json(
        { success: false, error: 'Only directors can revoke invitations' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const invitationId = searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json(
        { success: false, error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { error } = await supabase
      .from('club_invitations')
      .delete()
      .eq('id', invitationId)
      .eq('club_id', user.club_id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete invitation error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
