import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

interface Params {
  params: Promise<{ id: string }>;
}

// GET - Get a single client
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

    // Check if client is linked to this coach
    const { data: link } = await supabase
      .from('client_coaches')
      .select('client_id')
      .eq('client_id', id)
      .eq('coach_id', user.id)
      .single();

    if (!link) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    const { data: client, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    console.error('Get client error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// PUT - Update a client
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
    const { name, email, phone, notes } = body;

    if (!name && !email && phone === undefined && notes === undefined) {
      return NextResponse.json(
        { success: false, error: 'No valid updates provided' },
        { status: 400 }
      );
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Invalid email format' },
          { status: 400 }
        );
      }
    }

    const supabase = await createServerSupabaseClient();

    // Check if client is linked to this coach
    const { data: link } = await supabase
      .from('client_coaches')
      .select('client_id')
      .eq('client_id', id)
      .eq('coach_id', user.id)
      .single();

    if (!link) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updates: Record<string, string | null> = {};
    if (name) updates.name = name.trim();
    if (email) updates.email = email.toLowerCase().trim();
    if (phone !== undefined) updates.phone = phone?.trim() || null;
    if (notes !== undefined) updates.notes = notes?.trim() || null;

    const { data: client, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: client });
  } catch (error) {
    console.error('Update client error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}

// DELETE - Remove client from this coach's list (doesn't delete the client)
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

    // Remove the link between coach and client
    const { error } = await supabase
      .from('client_coaches')
      .delete()
      .eq('client_id', id)
      .eq('coach_id', user.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
