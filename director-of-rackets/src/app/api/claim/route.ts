import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { 
  sendClientConfirmationEmail, 
  sendCoachNotificationEmail 
} from '@/lib/email';
import type { Coach, Client, Slot } from '@/types/database';

// POST - Claim a slot (public endpoint, no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { slot_id, token, email } = body;

    // Validation
    if (!slot_id || !token || !email) {
      return NextResponse.json(
        { success: false, error: 'Slot ID, token, and email are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Use the database function for race-condition safe claiming
    const { data: result, error } = await supabase.rpc('claim_slot', {
      p_slot_id: slot_id,
      p_claim_token: token,
      p_client_email: email.toLowerCase(),
    });

    if (error) {
      console.error('Claim slot RPC error:', error);
      return NextResponse.json(
        { success: false, error: 'An error occurred while claiming the slot' },
        { status: 500 }
      );
    }

    const claimResult = result[0];

    if (!claimResult.success) {
      return NextResponse.json({
        success: false,
        error: claimResult.message,
        status: claimResult.slot_status,
        coachName: claimResult.coach_name,
      }, { status: claimResult.slot_status === 'claimed' ? 409 : 400 });
    }

    // Send confirmation emails
    try {
      // Get full objects for email
      const { data: slot } = await supabase
        .from('slots')
        .select('*')
        .eq('id', slot_id)
        .single();

      const { data: client } = await supabase
        .from('clients')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('coach_id', slot?.coach_id)
        .single();

      const { data: coach } = await supabase
        .from('coaches')
        .select('*')
        .eq('id', slot?.coach_id)
        .single();

      if (slot && client && coach) {
        // Send emails asynchronously (don't wait)
        Promise.all([
          sendClientConfirmationEmail(client as Client, slot as Slot, coach as Coach),
          sendCoachNotificationEmail(coach as Coach, client as Client, slot as Slot),
        ]).catch(err => console.error('Email send error:', err));
      }
    } catch (emailError) {
      console.error('Email preparation error:', emailError);
      // Don't fail the claim if emails fail
    }

    return NextResponse.json({
      success: true,
      data: {
        clientName: claimResult.client_name,
        coachName: claimResult.coach_name,
        startTime: claimResult.slot_start_time,
        endTime: claimResult.slot_end_time,
        note: claimResult.slot_note,
      },
    });
  } catch (error) {
    console.error('Claim slot error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while claiming the slot' },
      { status: 500 }
    );
  }
}

// GET - Check slot status (public endpoint)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get('slot_id');
    const token = searchParams.get('token');

    if (!slotId || !token) {
      return NextResponse.json(
        { success: false, error: 'Slot ID and token are required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    const { data: slot, error } = await supabase
      .from('slots')
      .select(`
        id,
        status,
        start_time,
        end_time,
        note,
        coach:coaches(name, email, timezone)
      `)
      .eq('id', slotId)
      .eq('claim_token', token)
      .single();

    if (error || !slot) {
      return NextResponse.json(
        { success: false, error: 'Invalid slot or token' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        status: slot.status,
        startTime: slot.start_time,
        endTime: slot.end_time,
        note: slot.note,
        coach: slot.coach,
      },
    });
  } catch (error) {
    console.error('Check slot status error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
