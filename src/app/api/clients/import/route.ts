import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

// POST - Bulk import clients
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
    const { clients } = body;

    if (!Array.isArray(clients) || clients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Clients array is required' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const supabase = await createServerSupabaseClient();

    // Get existing client emails linked to this coach
    const { data: existingLinks } = await supabase
      .from('client_coaches')
      .select('client:clients(email)')
      .eq('coach_id', user.id);

    const existingEmails = new Set(
      existingLinks?.map(l => {
        const clientData = l.client as { email: string } | { email: string }[] | null;
        const email = Array.isArray(clientData) ? clientData[0]?.email : clientData?.email;
        return email?.toLowerCase();
      }).filter(Boolean) || []
    );

    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[],
    };

    for (const client of clients) {
      const { name, email, phone } = client;

      if (!name || !email) {
        results.errors.push(`Missing name or email: ${JSON.stringify(client)}`);
        results.skipped++;
        continue;
      }

      const normalizedEmail = email.toLowerCase().trim();

      if (!emailRegex.test(normalizedEmail)) {
        results.errors.push(`Invalid email: ${email}`);
        results.skipped++;
        continue;
      }

      if (existingEmails.has(normalizedEmail)) {
        results.skipped++;
        continue;
      }

      // Check if client exists
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', normalizedEmail)
        .single();

      let clientId: string;

      if (existingClient) {
        clientId = existingClient.id;
      } else {
        // Create new client
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert({
            id: uuidv4(),
            name: name.trim(),
            email: normalizedEmail,
            phone: phone?.trim() || null,
          })
          .select()
          .single();

        if (error) {
          results.errors.push(`Failed to create ${email}: ${error.message}`);
          results.skipped++;
          continue;
        }

        clientId = newClient.id;
      }

      // Link to coach
      const { error: linkError } = await supabase
        .from('client_coaches')
        .insert({
          client_id: clientId,
          coach_id: user.id,
        });

      if (linkError) {
        results.errors.push(`Failed to link ${email}: ${linkError.message}`);
        results.skipped++;
        continue;
      }

      // Also link to club if applicable
      if (user.club_id) {
        const { data: existingClubLink } = await supabase
          .from('client_clubs')
          .select('client_id')
          .eq('client_id', clientId)
          .eq('club_id', user.club_id)
          .single();

        if (!existingClubLink) {
          await supabase
            .from('client_clubs')
            .insert({
              client_id: clientId,
              club_id: user.club_id,
            });
        }
      }

      existingEmails.add(normalizedEmail);
      results.imported++;
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
