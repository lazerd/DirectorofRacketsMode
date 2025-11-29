import { NextResponse } from 'next/server';
import { getSession, isDirector } from '@/lib/auth';
import { createServerSupabaseClient } from '@/lib/supabase/server';

// GET - Get all coaches in the club
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

    const { data: coaches, error } = await supabase
      .from('coaches')
      .select('id, name, email, role, created_at')
      .eq('club_id', user.club_id)
      .order('name', { ascending: true });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: coaches });
  } catch (error) {
    console.error('Get coaches error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred' },
      { status: 500 }
    );
  }
}
