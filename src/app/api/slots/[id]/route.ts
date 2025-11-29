import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface Params {
  params: Promise<{ id: string }>;
}

// GET - Get a single slot
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    const { data: slot, error } = await supabase
      .from('slots')
      .select(`
        *,
        coach:coaches(id, name, email),
        client:clients(id, name, email)
      `)
      .eq('id', id)
      .single();

    if (error || !slot) {
      return NextResponse.json(
        { success: false, error: 'Slot not found' },
        { status: 404 }
      );
    }

    // Check access - must be the coach or a director of the club
    if (slot.coach_id !== user.id) {
      if (!(user.role === 'director' && slot.club_id === user.club_id)) {
        return NextResponse.json(
          { success: false, error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ success: true, data: slot });
  } catch (error) {
    console.error('Get slot error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// PUT - Update a slot
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, note, location } = body;

    const supabase = await createServerSupabaseClient();

    // Build update object
    const updates: Record<string, unknown> = {};
    if (note !== undefined) updates.note = note;
    if (location !== undefined) updates.location = location;
    if (status === 'cancelled') updates.status = 'cancelled';

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    const { data: slot, error } = await supabase
      .from('slots')
      .update(updates)
      .eq('id', id)
      .eq('coach_id', user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    if (!slot) {
      return NextResponse.json(
        { success: false, error: 'Slot not found or access denied' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: slot });
  } catch (error) {
    console.error('Update slot error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// DELETE - Delete a slot
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const supabase = await createServerSupabaseClient();

    // Check slot exists and belongs to this coach
    const { data: slot } = await supabase
      .from('slots')
      .select('status')
      .eq('id', id)
      .eq('coach_id', user.id)
      .single();

    if (!slot) {
      return NextResponse.json(
        { success: false, error: 'Slot not found' },
        { status: 404 }
      );
    }

    if (slot.status === 'claimed') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete a claimed slot. Cancel it instead.' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('slots')
      .delete()
      .eq('id', id)
      .eq('coach_id', user.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete slot error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
