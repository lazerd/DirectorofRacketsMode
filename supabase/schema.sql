-- Director of Rackets Mode AI - Enhanced Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CLUBS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clubs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  owner_user_id UUID NOT NULL, -- The director who created this club
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- USERS/COACHES TABLE (replaces old coaches table)
-- ============================================
CREATE TABLE IF NOT EXISTS coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  timezone VARCHAR(100) DEFAULT 'America/New_York',
  
  -- Role: 'director', 'club_coach', 'independent_coach'
  role VARCHAR(50) NOT NULL DEFAULT 'independent_coach' 
    CHECK (role IN ('director', 'club_coach', 'independent_coach')),
  
  -- Club association (NULL for independent coaches)
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  
  -- Profile
  bio TEXT,
  phone VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from clubs.owner_user_id to coaches after coaches table exists
ALTER TABLE clubs 
  ADD CONSTRAINT fk_clubs_owner 
  FOREIGN KEY (owner_user_id) 
  REFERENCES coaches(id) ON DELETE CASCADE;

-- ============================================
-- CLIENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CLIENT-COACH RELATIONSHIP (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS client_coaches (
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (client_id, coach_id)
);

-- ============================================
-- CLIENT-CLUB RELATIONSHIP (many-to-many)
-- ============================================
CREATE TABLE IF NOT EXISTS client_clubs (
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (client_id, club_id)
);

-- ============================================
-- SLOTS TABLE (enhanced)
-- ============================================
CREATE TABLE IF NOT EXISTS slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL, -- NULL for independent coaches
  
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'claimed', 'cancelled')),
  claimed_by_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  claimed_at TIMESTAMPTZ,
  
  note TEXT,
  location VARCHAR(255),
  
  -- Claim token for secure claiming
  claim_token UUID DEFAULT uuid_generate_v4() UNIQUE,
  
  -- NEW: Email notification tracking
  notifications_sent BOOLEAN DEFAULT FALSE,
  notified_at TIMESTAMPTZ,
  notified_via VARCHAR(20) CHECK (notified_via IN ('coach_blast', 'club_blast')),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- EMAIL BLAST LOG (track sent blasts)
-- ============================================
CREATE TABLE IF NOT EXISTS email_blasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Who sent the blast
  sent_by_coach_id UUID REFERENCES coaches(id) ON DELETE SET NULL,
  club_id UUID REFERENCES clubs(id) ON DELETE SET NULL,
  
  blast_type VARCHAR(20) NOT NULL CHECK (blast_type IN ('coach_blast', 'club_blast')),
  
  -- Stats
  slots_included INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  emails_failed INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CLUB INVITATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS club_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  invite_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_coaches_club_id ON coaches(club_id);
CREATE INDEX IF NOT EXISTS idx_coaches_role ON coaches(role);
CREATE INDEX IF NOT EXISTS idx_coaches_email ON coaches(email);

CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);

CREATE INDEX IF NOT EXISTS idx_client_coaches_coach ON client_coaches(coach_id);
CREATE INDEX IF NOT EXISTS idx_client_coaches_client ON client_coaches(client_id);

CREATE INDEX IF NOT EXISTS idx_client_clubs_club ON client_clubs(club_id);
CREATE INDEX IF NOT EXISTS idx_client_clubs_client ON client_clubs(client_id);

CREATE INDEX IF NOT EXISTS idx_slots_coach_id ON slots(coach_id);
CREATE INDEX IF NOT EXISTS idx_slots_club_id ON slots(club_id);
CREATE INDEX IF NOT EXISTS idx_slots_start_time ON slots(start_time);
CREATE INDEX IF NOT EXISTS idx_slots_status ON slots(status);
CREATE INDEX IF NOT EXISTS idx_slots_claim_token ON slots(claim_token);
CREATE INDEX IF NOT EXISTS idx_slots_notifications ON slots(notifications_sent, status);

CREATE INDEX IF NOT EXISTS idx_club_invitations_code ON club_invitations(invite_code);
CREATE INDEX IF NOT EXISTS idx_club_invitations_email ON club_invitations(email);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_clubs_updated_at ON clubs;
CREATE TRIGGER update_clubs_updated_at
  BEFORE UPDATE ON clubs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_coaches_updated_at ON coaches;
CREATE TRIGGER update_coaches_updated_at
  BEFORE UPDATE ON coaches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_slots_updated_at ON slots;
CREATE TRIGGER update_slots_updated_at
  BEFORE UPDATE ON slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_blasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE club_invitations ENABLE ROW LEVEL SECURITY;

-- Policies (permissive for now - tighten in production)
CREATE POLICY "Allow all" ON clubs FOR ALL USING (true);
CREATE POLICY "Allow all" ON coaches FOR ALL USING (true);
CREATE POLICY "Allow all" ON clients FOR ALL USING (true);
CREATE POLICY "Allow all" ON client_coaches FOR ALL USING (true);
CREATE POLICY "Allow all" ON client_clubs FOR ALL USING (true);
CREATE POLICY "Allow all" ON slots FOR ALL USING (true);
CREATE POLICY "Allow all" ON email_blasts FOR ALL USING (true);
CREATE POLICY "Allow all" ON club_invitations FOR ALL USING (true);

-- ============================================
-- RACE-CONDITION SAFE SLOT CLAIMING
-- ============================================
CREATE OR REPLACE FUNCTION claim_slot(
  p_slot_id UUID,
  p_claim_token UUID,
  p_client_email VARCHAR(255)
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  slot_status VARCHAR(20),
  client_name VARCHAR(255),
  coach_name VARCHAR(255),
  coach_email VARCHAR(255),
  slot_start_time TIMESTAMPTZ,
  slot_end_time TIMESTAMPTZ,
  slot_note TEXT
) AS $$
DECLARE
  v_slot RECORD;
  v_client RECORD;
  v_coach RECORD;
BEGIN
  -- Lock the slot row for update (prevents race conditions)
  SELECT * INTO v_slot
  FROM slots
  WHERE id = p_slot_id AND claim_token = p_claim_token
  FOR UPDATE;

  -- Check if slot exists
  IF v_slot IS NULL THEN
    RETURN QUERY SELECT 
      FALSE, 
      'Invalid slot or token'::TEXT, 
      NULL::VARCHAR(20),
      NULL::VARCHAR(255),
      NULL::VARCHAR(255),
      NULL::VARCHAR(255),
      NULL::TIMESTAMPTZ,
      NULL::TIMESTAMPTZ,
      NULL::TEXT;
    RETURN;
  END IF;

  -- Check if already claimed
  IF v_slot.status = 'claimed' THEN
    SELECT * INTO v_coach FROM coaches WHERE id = v_slot.coach_id;
    
    RETURN QUERY SELECT 
      FALSE, 
      'This slot has already been claimed'::TEXT, 
      'claimed'::VARCHAR(20),
      NULL::VARCHAR(255),
      v_coach.name::VARCHAR(255),
      v_coach.email::VARCHAR(255),
      v_slot.start_time,
      v_slot.end_time,
      v_slot.note::TEXT;
    RETURN;
  END IF;

  -- Check if cancelled
  IF v_slot.status = 'cancelled' THEN
    RETURN QUERY SELECT 
      FALSE, 
      'This slot is no longer available'::TEXT, 
      'cancelled'::VARCHAR(20),
      NULL::VARCHAR(255),
      NULL::VARCHAR(255),
      NULL::VARCHAR(255),
      NULL::TIMESTAMPTZ,
      NULL::TIMESTAMPTZ,
      NULL::TEXT;
    RETURN;
  END IF;

  -- Find the client by email (check client_coaches relationship)
  SELECT c.* INTO v_client
  FROM clients c
  JOIN client_coaches cc ON c.id = cc.client_id
  WHERE c.email = p_client_email AND cc.coach_id = v_slot.coach_id;

  IF v_client IS NULL THEN
    SELECT * INTO v_coach FROM coaches WHERE id = v_slot.coach_id;
    
    RETURN QUERY SELECT 
      FALSE, 
      'Client email not found in coach''s client list'::TEXT, 
      v_slot.status::VARCHAR(20),
      NULL::VARCHAR(255),
      v_coach.name::VARCHAR(255),
      v_coach.email::VARCHAR(255),
      v_slot.start_time,
      v_slot.end_time,
      v_slot.note::TEXT;
    RETURN;
  END IF;

  -- Claim the slot
  UPDATE slots
  SET 
    status = 'claimed',
    claimed_by_client_id = v_client.id,
    claimed_at = NOW()
  WHERE id = p_slot_id;

  -- Get coach info
  SELECT * INTO v_coach FROM coaches WHERE id = v_slot.coach_id;

  -- Return success
  RETURN QUERY SELECT 
    TRUE, 
    'Slot successfully claimed!'::TEXT, 
    'claimed'::VARCHAR(20),
    v_client.name::VARCHAR(255),
    v_coach.name::VARCHAR(255),
    v_coach.email::VARCHAR(255),
    v_slot.start_time,
    v_slot.end_time,
    v_slot.note::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTION: Get club slots for blast
-- ============================================
CREATE OR REPLACE FUNCTION get_club_unnotified_slots(p_club_id UUID)
RETURNS TABLE (
  slot_id UUID,
  coach_id UUID,
  coach_name VARCHAR(255),
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  note TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.coach_id,
    c.name,
    s.start_time,
    s.end_time,
    s.note
  FROM slots s
  JOIN coaches c ON s.coach_id = c.id
  WHERE s.club_id = p_club_id
    AND s.status = 'open'
    AND s.notifications_sent = FALSE
    AND s.start_time > NOW()
  ORDER BY s.start_time;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTION: Get coach slots for blast
-- ============================================
CREATE OR REPLACE FUNCTION get_coach_unnotified_slots(p_coach_id UUID)
RETURNS TABLE (
  slot_id UUID,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  note TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.start_time,
    s.end_time,
    s.note
  FROM slots s
  WHERE s.coach_id = p_coach_id
    AND s.status = 'open'
    AND s.notifications_sent = FALSE
    AND s.start_time > NOW()
  ORDER BY s.start_time;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTION: Generate unique slug
-- ============================================
CREATE OR REPLACE FUNCTION generate_club_slug(club_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  new_slug TEXT;
  counter INTEGER := 0;
BEGIN
  base_slug := lower(regexp_replace(club_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  new_slug := base_slug;
  
  WHILE EXISTS (SELECT 1 FROM clubs WHERE slug = new_slug) LOOP
    counter := counter + 1;
    new_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN new_slug;
END;
$$ LANGUAGE plpgsql;
