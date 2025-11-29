// Database types for Director of Rackets Mode AI

// ============================================
// USER ROLES
// ============================================
export type UserRole = 'director' | 'club_coach' | 'independent_coach';

// ============================================
// CLUBS
// ============================================
export interface Club {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  owner_user_id: string;
  created_at: string;
  updated_at: string;
}

// ============================================
// COACHES (Users)
// ============================================
export interface Coach {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  timezone: string;
  role: UserRole;
  club_id: string | null;
  bio: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoachWithClub extends Coach {
  club?: Club | null;
}

// ============================================
// CLIENTS
// ============================================
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// RELATIONSHIPS
// ============================================
export interface ClientCoach {
  client_id: string;
  coach_id: string;
  created_at: string;
}

export interface ClientClub {
  client_id: string;
  club_id: string;
  created_at: string;
}

// ============================================
// SLOTS
// ============================================
export interface Slot {
  id: string;
  coach_id: string;
  club_id: string | null;
  start_time: string;
  end_time: string;
  status: 'open' | 'claimed' | 'cancelled';
  claimed_by_client_id: string | null;
  claimed_at: string | null;
  note: string | null;
  location: string | null;
  claim_token: string;
  notifications_sent: boolean;
  notified_at: string | null;
  notified_via: 'coach_blast' | 'club_blast' | null;
  created_at: string;
  updated_at: string;
}

export interface SlotWithRelations extends Slot {
  coach?: Coach;
  client?: Client | null;
  club?: Club | null;
}

// ============================================
// EMAIL BLASTS
// ============================================
export interface EmailBlast {
  id: string;
  sent_by_coach_id: string | null;
  club_id: string | null;
  blast_type: 'coach_blast' | 'club_blast';
  slots_included: number;
  emails_sent: number;
  emails_failed: number;
  created_at: string;
}

// ============================================
// CLUB INVITATIONS
// ============================================
export interface ClubInvitation {
  id: string;
  club_id: string;
  email: string;
  invite_code: string;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}

// ============================================
// AUTH TYPES
// ============================================
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  timezone: string;
  role: UserRole;
  club_id: string | null;
  club?: Club | null;
}

export interface Session {
  user: AuthUser;
  expires: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================
// FORM INPUT TYPES
// ============================================
export interface RegisterInput {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  timezone?: string;
  clubName?: string; // For directors creating a new club
  inviteCode?: string; // For coaches joining a club
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateSlotInput {
  start_time: string;
  end_time: string;
  note?: string;
  location?: string;
}

export interface CreateClientInput {
  name: string;
  email: string;
  phone?: string;
  notes?: string;
}

export interface CreateClubInput {
  name: string;
  description?: string;
}

export interface InviteCoachInput {
  email: string;
}

// ============================================
// BLAST TYPES
// ============================================
export interface BlastResult {
  blast_id: string;
  slots_notified: number;
  emails_sent: number;
  emails_failed: number;
  errors: string[];
}

export interface SlotForBlast {
  id: string;
  coach_id: string;
  coach_name: string;
  start_time: string;
  end_time: string;
  note: string | null;
  claim_token: string;
}

// ============================================
// DASHBOARD STATS
// ============================================
export interface CoachStats {
  total_clients: number;
  open_slots: number;
  claimed_slots: number;
  pending_notifications: number;
}

export interface ClubStats {
  total_coaches: number;
  total_clients: number;
  open_slots: number;
  claimed_slots: number;
  pending_notifications: number;
}
