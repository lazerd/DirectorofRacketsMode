import { NextResponse } from 'next/server';
import { getSession, isDirector } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendClubBlastEmail } from '@/lib/email';
import { v4 as uuidv4 } from 'uuid';
import type { Client, Club } from '@/types/database';

// POST - Send email blast for all unnotified open slots for this club
export async function POST() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Only directors can send club blasts
    if (!isDirector(user)) {
      return NextResponse.json(
        { success: false, error: 'Only directors can send club blasts' },
        { status: 403 }
      );
    }

    if (!user.club_id) {
      return NextResponse.json(
        { success: false, error: 'No club associated with this account' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get club info
    const { data: club } = await supabase
      .from('clubs')
      .select('*')
      .eq('id', user.club_id)
      .single();

    if (!club) {
      return NextResponse.json(
        { success: false, error: 'Club not found' },
        { status: 404 }
      );
    }

    // Get unnotified open slots for all coaches in this club
    const { data: slots, error: slotsError } = await supabase
      .from('slots')
      .select(`
        id, 
        coach_id,
        start_time, 
        end_time, 
        note, 
        claim_token,
        coach:coaches(name)
      `)
      .eq('club_id', user.club_id)
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

    // Get clients for this club (via client_clubs)
    const { data: clientClubs } = await supabase
      .from('client_clubs')
      .select('client_id')
      .eq('club_id', user.club_id);

    // Also get clients of coaches in this club (via client_coaches)
    const { data: clubCoaches } = await supabase
      .from('coaches')
      .select('id')
      .eq('club_id', user.club_id);

    const coachIds = clubCoaches?.map(c => c.id) || [];

    const { data: clientCoaches } = await supabase
      .from('client_coaches')
      .select('client_id')
      .in('coach_id', coachIds);

    // Combine and dedupe client IDs
    const clientIdSet = new Set<string>();
    clientClubs?.forEach(cc => clientIdSet.add(cc.client_id));
    clientCoaches?.forEach(cc => clientIdSet.add(cc.client_id));
    const clientIds = Array.from(clientIdSet);

    if (clientIds.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No clients to notify' },
        { status: 400 }
      );
    }

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

    // Prepare slots for blast with coach names
    const slotsForBlast = slots.map(slot => {
      const coachData = slot.coach as { name: string } | { name: string }[] | null;
      const coachName = Array.isArray(coachData) 
        ? coachData[0]?.name 
        : coachData?.name;
      
      return {
        id: slot.id,
        coach_id: slot.coach_id,
        coach_name: coachName || 'Coach',
        start_time: slot.start_time,
        end_time: slot.end_time,
        note: slot.note,
        claim_token: slot.claim_token,
      };
    });

    // Send one email per client with all slots
    let emailsSent = 0;
    let emailsFailed = 0;
    const errors: string[] = [];

    for (const client of clients) {
      const result = await sendClubBlastEmail(
        client as Client,
        club as Club,
        slotsForBlast,
        user.timezone
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
        notified_via: 'club_blast',
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
        blast_type: 'club_blast',
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
        errors: errors.slice(0, 5),
      },
    });
  } catch (error) {
    console.error('Club blast error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred sending the blast' },
      { status: 500 }
    );
  }
}
