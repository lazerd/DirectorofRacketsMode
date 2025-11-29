import { NextRequest, NextResponse } from 'next/server';
import { getSession, isDirector } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET - Get current user's club info
export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!user.club_id) {
      return NextResponse.json(
        { success: false, error: 'No club associated with this account' },
        { status: 404 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get club with coaches
    const { data: club, error } = await supabase
      .from('clubs')
      .select(`
        *,
        coaches(id, name, email, role)
      `)
      .eq('id', user.club_id)
      .single();

    if (error || !club) {
      return NextResponse.json(
        { success: false, error: 'Club not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: club });
  } catch (error) {
    console.error('Get club error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// PUT - Update club (directors only)
export async function PUT(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    if (!isDirector(user)) {
      return NextResponse.json(
        { success: false, error: 'Only directors can update club settings' },
        { status: 403 }
      );
    }

    if (!user.club_id) {
      return NextResponse.json(
        { success: false, error: 'No club associated with this account' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, description, logo_url } = body;

    const supabase = await createServerSupabaseClient();

    const updates: Record<string, string | null> = {};
    if (name) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (logo_url !== undefined) updates.logo_url = logo_url?.trim() || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const { data: club, error } = await supabase
      .from('clubs')
      .update(updates)
      .eq('id', user.club_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: club });
  } catch (error) {
    console.error('Update club error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
