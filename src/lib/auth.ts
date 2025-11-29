import { cookies } from 'next/headers';
import { createServerSupabaseClient } from './supabase/server';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import type { AuthUser, Coach, Club, UserRole } from '@/types/database';

const SESSION_COOKIE = 'dor_session';
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

interface SessionData {
  userId: string;
  expires: number;
}

function encodeSession(data: SessionData): string {
  return Buffer.from(JSON.stringify(data)).toString('base64');
}

function decodeSession(encoded: string): SessionData | null {
  try {
    return JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<void> {
  const cookieStore = await cookies();
  const sessionData: SessionData = {
    userId,
    expires: Date.now() + SESSION_DURATION,
  };
  
  cookieStore.set(SESSION_COOKIE, encodeSession(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION / 1000,
    path: '/',
  });
}

export async function getSession(): Promise<AuthUser | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  
  if (!sessionCookie?.value) {
    return null;
  }
  
  const sessionData = decodeSession(sessionCookie.value);
  
  if (!sessionData || sessionData.expires < Date.now()) {
    return null;
  }
  
  const supabase = await createServerSupabaseClient();
  
  // Get coach with club info
  const { data: coach } = await supabase
    .from('coaches')
    .select(`
      id, email, name, timezone, role, club_id,
      club:clubs(id, name, slug, description)
    `)
    .eq('id', sessionData.userId)
    .single();
  
  if (!coach) {
    return null;
  }
  
  // Handle club data which might be an array from Supabase
  const clubData = coach.club;
  const club = Array.isArray(clubData) ? clubData[0] : clubData;
  
  return {
    id: coach.id,
    email: coach.email,
    name: coach.name,
    timezone: coach.timezone,
    role: coach.role as UserRole,
    club_id: coach.club_id,
    club: club as Club | null,
  };
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

// Generate unique slug for club
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Math.random().toString(36).substring(2, 6);
}

// Register as Director (creates club + coach)
export async function registerDirector(
  email: string,
  password: string,
  name: string,
  clubName: string,
  timezone: string = 'America/New_York'
): Promise<{ success: boolean; error?: string; coach?: Coach; club?: Club }> {
  const supabase = await createServerSupabaseClient();
  
  // Check if email already exists
  const { data: existing } = await supabase
    .from('coaches')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();
  
  if (existing) {
    return { success: false, error: 'Email already registered' };
  }
  
  const passwordHash = await hashPassword(password);
  const coachId = uuidv4();
  const clubId = uuidv4();
  const slug = generateSlug(clubName);
  
  // Create club first (with owner pointing to coach we'll create)
  const { error: clubError } = await supabase
    .from('clubs')
    .insert({
      id: clubId,
      name: clubName,
      slug,
      owner_user_id: coachId,
    });
  
  if (clubError) {
    return { success: false, error: clubError.message };
  }
  
  // Create coach as director
  const { data: coach, error: coachError } = await supabase
    .from('coaches')
    .insert({
      id: coachId,
      email: email.toLowerCase(),
      name,
      password_hash: passwordHash,
      timezone,
      role: 'director',
      club_id: clubId,
    })
    .select()
    .single();
  
  if (coachError) {
    // Rollback club creation
    await supabase.from('clubs').delete().eq('id', clubId);
    return { success: false, error: coachError.message };
  }
  
  // Get the created club
  const { data: club } = await supabase
    .from('clubs')
    .select()
    .eq('id', clubId)
    .single();
  
  return { success: true, coach, club };
}

// Register as Club Coach (joins existing club via invite)
export async function registerClubCoach(
  email: string,
  password: string,
  name: string,
  inviteCode: string,
  timezone: string = 'America/New_York'
): Promise<{ success: boolean; error?: string; coach?: Coach }> {
  const supabase = await createServerSupabaseClient();
  
  // Check if email already exists
  const { data: existing } = await supabase
    .from('coaches')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();
  
  if (existing) {
    return { success: false, error: 'Email already registered' };
  }
  
  // Validate invite code
  const { data: invitation } = await supabase
    .from('club_invitations')
    .select('*')
    .eq('invite_code', inviteCode)
    .eq('status', 'pending')
    .single();
  
  if (!invitation) {
    return { success: false, error: 'Invalid or expired invite code' };
  }
  
  if (new Date(invitation.expires_at) < new Date()) {
    // Mark as expired
    await supabase
      .from('club_invitations')
      .update({ status: 'expired' })
      .eq('id', invitation.id);
    return { success: false, error: 'Invite code has expired' };
  }
  
  const passwordHash = await hashPassword(password);
  
  // Create coach as club_coach
  const { data: coach, error } = await supabase
    .from('coaches')
    .insert({
      id: uuidv4(),
      email: email.toLowerCase(),
      name,
      password_hash: passwordHash,
      timezone,
      role: 'club_coach',
      club_id: invitation.club_id,
    })
    .select()
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  // Mark invitation as accepted
  await supabase
    .from('club_invitations')
    .update({ status: 'accepted' })
    .eq('id', invitation.id);
  
  return { success: true, coach };
}

// Register as Independent Coach
export async function registerIndependentCoach(
  email: string,
  password: string,
  name: string,
  timezone: string = 'America/New_York'
): Promise<{ success: boolean; error?: string; coach?: Coach }> {
  const supabase = await createServerSupabaseClient();
  
  // Check if email already exists
  const { data: existing } = await supabase
    .from('coaches')
    .select('id')
    .eq('email', email.toLowerCase())
    .single();
  
  if (existing) {
    return { success: false, error: 'Email already registered' };
  }
  
  const passwordHash = await hashPassword(password);
  
  const { data: coach, error } = await supabase
    .from('coaches')
    .insert({
      id: uuidv4(),
      email: email.toLowerCase(),
      name,
      password_hash: passwordHash,
      timezone,
      role: 'independent_coach',
      club_id: null,
    })
    .select()
    .single();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, coach };
}

// Login
export async function loginCoach(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string; coach?: Coach }> {
  const supabase = await createServerSupabaseClient();
  
  const { data: coach, error } = await supabase
    .from('coaches')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();
  
  if (error || !coach) {
    return { success: false, error: 'Invalid email or password' };
  }
  
  const validPassword = await verifyPassword(password, coach.password_hash);
  
  if (!validPassword) {
    return { success: false, error: 'Invalid email or password' };
  }
  
  await createSession(coach.id);
  
  return { success: true, coach };
}

export async function logoutCoach(): Promise<void> {
  await destroySession();
}

// Check if user is a director
export function isDirector(user: AuthUser | null): boolean {
  return user?.role === 'director';
}

// Check if user belongs to a club
export function belongsToClub(user: AuthUser | null): boolean {
  return user?.club_id !== null;
}

// Get user's club ID (for directors and club coaches)
export function getClubId(user: AuthUser | null): string | null {
  return user?.club_id || null;
}
