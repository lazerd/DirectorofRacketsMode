import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

// GET - List all clients for the authenticated coach
export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get clients through the client_coaches junction table
    const { data: clientCoaches, error } = await supabase
      .from('client_coaches')
      .select(`
        client:clients(*)
      `)
      .eq('coach_id', user.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Flatten the response - handle both array and object cases from Supabase
    const clients = clientCoaches?.map(cc => {
      const clientData = cc.client;
      return Array.isArray(clientData) ? clientData[0] : clientData;
    }).filter(Boolean) || [];

    // Sort by name
    clients.sort((a, b) => ((a as { name?: string })?.name || '').localeCompare((b as { name?: string })?.name || ''));

    return NextResponse.json({ success: true, data: clients });
  } catch (error) {
    console.error('Get clients error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// POST - Create a new client and link to this coach
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
    const { name, email, phone, notes } = body;

    // Validation
    if (!name || !email) {
      return NextResponse.json(
        { success: false, error: 'Name and email are required' },
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
    const normalizedEmail = email.toLowerCase().trim();

    // Check if this client already exists (by email)
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('email', normalizedEmail)
      .single();

    let clientId: string;

    if (existingClient) {
      // Client exists - check if already linked to this coach
      const { data: existingLink } = await supabase
        .from('client_coaches')
        .select('client_id')
        .eq('client_id', existingClient.id)
        .eq('coach_id', user.id)
        .single();

      if (existingLink) {
        return NextResponse.json(
          { success: false, error: 'This client is already on your list' },
          { status: 400 }
        );
      }

      clientId = existingClient.id;
    } else {
      // Create new client
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          id: uuidv4(),
          name: name.trim(),
          email: normalizedEmail,
          phone: phone?.trim() || null,
          notes: notes?.trim() || null,
        })
        .select()
        .single();

      if (clientError) {
        return NextResponse.json(
          { success: false, error: clientError.message },
          { status: 500 }
        );
      }

      clientId = newClient.id;
    }

    // Link client to coach
    const { error: linkError } = await supabase
      .from('client_coaches')
      .insert({
        client_id: clientId,
        coach_id: user.id,
      });

    if (linkError) {
      return NextResponse.json(
        { success: false, error: linkError.message },
        { status: 500 }
      );
    }

    // Also link to club if coach belongs to one
    if (user.club_id) {
      // Check if already linked
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

    // Get the full client record
    const { data: client } = await supabase
      .from('clients')
      .select('*')
      .eq('id', clientId)
      .single();

    return NextResponse.json({ success: true, data: client }, { status: 201 });
  } catch (error) {
    console.error('Create client error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
