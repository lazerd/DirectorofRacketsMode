import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

// GET - List slots for the authenticated coach
export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start');
    const endDate = searchParams.get('end');
    const clubView = searchParams.get('club') === 'true';

    const supabase = await createServerSupabaseClient();

    let query = supabase
      .from('slots')
      .select(`
        *,
        coach:coaches(id, name, email),
        client:clients(id, name, email)
      `)
      .order('start_time', { ascending: true });

    // If club view and user is director, show all club slots
    if (clubView && user.role === 'director' && user.club_id) {
      query = query.eq('club_id', user.club_id);
    } else {
      // Otherwise show only this coach's slots
      query = query.eq('coach_id', user.id);
    }

    if (startDate) {
      query = query.gte('start_time', startDate);
    }
    if (endDate) {
      query = query.lte('start_time', endDate);
    }

    const { data: slots, error } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: slots });
  } catch (error) {
    console.error('Get slots error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// POST - Create a new open slot (NO AUTO-EMAIL!)
export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { start_time, end_time, note, location } = body;

    // Validation
    if (!start_time || !end_time) {
      return NextResponse.json(
        { success: false, error: 'Start time and end time are required' },
        { status: 400 }
      );
    }

    const startDate = new Date(start_time);
    const endDate = new Date(end_time);

    if (endDate <= startDate) {
      return NextResponse.json(
        { success: false, error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    if (startDate < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Cannot create slots in the past' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Create the slot - NO EMAIL SENDING HERE
    const slotId = uuidv4();
    const claimToken = uuidv4();

    const { data: slot, error } = await supabase
      .from('slots')
      .insert({
        id: slotId,
        coach_id: user.id,
        club_id: user.club_id, // Will be null for independent coaches
        start_time: startDate.toISOString(),
        end_time: endDate.toISOString(),
        status: 'open',
        note: note || null,
        location: location || null,
        claim_token: claimToken,
        notifications_sent: false, // Start as not notified
        notified_at: null,
        notified_via: null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: slot,
      message: 'Slot created. Use the "Send Email Blast" button to notify clients.',
    }, { status: 201 });
  } catch (error) {
    console.error('Create slot error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
