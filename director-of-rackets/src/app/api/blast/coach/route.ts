import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendCoachBlastEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';
import type { Client, Coach, SlotForBlast } from '@/types/database';

// POST - Send email blast for all unnotified open slots for this coach
export async function POST() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get coach info
    const { data: coach } = await supabase
      .from('coaches')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!coach) {
      return NextResponse.json(
        { success: false, error: 'Coach not found' },
        { status: 404 }
      );
    }

    // Get unnotified open slots for this coach
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select('id, start_time, end_time, note, claim_token')
      .eq('coach_id', user.id)
      .eq('status', 'open')
      .eq('notifications_sent', false)
      .gt('start_time', new Date().toISOString())
      .order('start_time', { ascending: true });

    if (slotsError) {
      return NextResponse.json(
        { success: false, error: slotsError.message },
        { status: 500 }
      );
    }

    if (!slots || slots.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No unnotified open slots to send' },
        { status: 400 }
      );
    }

    // Get clients for this coach
    const { data: clientCoaches } = await supabase
      .from('client_coaches')
      .select('client_id')
      .eq('coach_id', user.id);

    if (!clientCoaches || clientCoaches.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No clients to notify' },
        { status: 400 }
      );
    }

    const clientIds = clientCoaches.map(cc => cc.client_id);

    const { data: clients } = await supabase
      .from('clients')
      .select('*')
      .in('id', clientIds);

    if (!clients || clients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No clients found' },
        { status: 400 }
      );
    }

    // Prepare slots for blast
    const slotsForBlast: SlotForBlast[] = slots.map(slot => ({
      id: slot.id,
      coach_id: user.id,
      coach_name: coach.name,
      start_time: slot.start_time,
      end_time: slot.end_time,
      note: slot.note,
      claim_token: slot.claim_token,
    }));

    // Send one email per client with all slots
    let emailsSent = 0;
    let emailsFailed = 0;
    const errors: string[] = [];

    for (const client of clients) {
      const result = await sendCoachBlastEmail(
        client as Client,
        coach as Coach,
        slotsForBlast
      );

      if (result.success) {
        emailsSent++;
      } else {
        emailsFailed++;
        errors.push(`${client.email}: ${result.error}`);
      }
    }

    // Mark slots as notified
    const slotIds = slots.map(s => s.id);
    await supabase
      .from('slots')
      .update({
        notifications_sent: true,
        notified_at: new Date().toISOString(),
        notified_via: 'coach_blast',
      })
      .in('id', slotIds);

    // Log the blast
    const blastId = uuidv4();
    await supabase
      .from('email_blasts')
      .insert({
        id: blastId,
        sent_by_coach_id: user.id,
        club_id: user.club_id,
        blast_type: 'coach_blast',
        slots_included: slots.length,
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
      });

    return NextResponse.json({
      success: true,
      data: {
        blast_id: blastId,
        slots_notified: slots.length,
        emails_sent: emailsSent,
        emails_failed: emailsFailed,
        errors: errors.slice(0, 5), // Return first 5 errors only
      },
    });
  } catch (error) {
    console.error('Coach blast error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred sending the blast' },
      { status: 500 }
    );
  }
}
