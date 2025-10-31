-- ============================================================================
-- PIN MANAGEMENT SYSTEM - Database Schema Migration
-- ============================================================================
-- Creates tables for AI-powered contractor PIN management system
-- Date: October 30, 2025
-- ============================================================================

-- ============================================================================
-- 1. BUILDINGS TABLE
-- ============================================================================
-- Stores building information, unit arrays, and access instructions

CREATE TABLE IF NOT EXISTS buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_name TEXT NOT NULL,
  building_code TEXT NOT NULL UNIQUE,
  north_end_units TEXT[] NOT NULL DEFAULT '{}',
  south_end_units TEXT[] NOT NULL DEFAULT '{}',
  access_instructions TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for buildings
DO $$ BEGIN
  CREATE POLICY "Anyone can read buildings"
    ON buildings FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can modify buildings"
    ON buildings FOR ALL
    USING (
      auth.jwt() ->> 'email' = 'rob@ursllc.com'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- 2. ACTIVE_PINS TABLE
-- ============================================================================
-- Stores current valid PINs for each building with date ranges

CREATE TABLE IF NOT EXISTS active_pins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  pin_code TEXT NOT NULL CHECK (pin_code ~ '^\d{4}$'),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT valid_date_range CHECK (valid_until > valid_from)
);

-- Enable RLS
ALTER TABLE active_pins ENABLE ROW LEVEL SECURITY;

-- RLS Policies for active_pins
DO $$ BEGIN
  CREATE POLICY "Anyone can read active pins"
    ON active_pins FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "Only admins can manage pins"
    ON active_pins FOR ALL
    USING (
      auth.jwt() ->> 'email' = 'rob@ursllc.com'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_active_pins_building_id ON active_pins(building_id);
CREATE INDEX IF NOT EXISTS idx_active_pins_valid_dates ON active_pins(valid_from, valid_until);

-- ============================================================================
-- 3. CONTRACTOR_CONVERSATIONS TABLE
-- ============================================================================
-- Tracks SMS conversation state and extracted information

CREATE TABLE IF NOT EXISTS contractor_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  company_name TEXT,
  building_id UUID REFERENCES buildings(id),
  unit_number TEXT,
  roof_end TEXT CHECK (roof_end IN ('north', 'south')),
  conversation_state TEXT NOT NULL DEFAULT 'initial' 
    CHECK (conversation_state IN ('initial', 'awaiting_info', 'confirming', 'pin_delivered', 'completed')),
  pin_delivered_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contractor_conversations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for contractor_conversations
DO $$ BEGIN
  CREATE POLICY "Anyone can read conversations"
    ON contractor_conversations FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "System can manage conversations"
    ON contractor_conversations FOR ALL
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_contractor_conversations_phone ON contractor_conversations(phone_number);
CREATE INDEX IF NOT EXISTS idx_contractor_conversations_state ON contractor_conversations(conversation_state);
CREATE INDEX IF NOT EXISTS idx_contractor_conversations_created ON contractor_conversations(created_at DESC);

-- ============================================================================
-- 4. CONVERSATION_MESSAGES TABLE
-- ============================================================================
-- Logs all incoming/outgoing messages for audit trail

CREATE TABLE IF NOT EXISTS conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES contractor_conversations(id) ON DELETE CASCADE,
  message_direction TEXT NOT NULL CHECK (message_direction IN ('incoming', 'outgoing')),
  message_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_messages
DO $$ BEGIN
  CREATE POLICY "Anyone can read messages"
    ON conversation_messages FOR SELECT
    USING (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "System can create messages"
    ON conversation_messages FOR INSERT
    WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Index for efficient conversation history queries
CREATE INDEX IF NOT EXISTS idx_conversation_messages_conv_id ON conversation_messages(conversation_id, created_at DESC);

-- ============================================================================
-- 5. PRE-POPULATE BUILDINGS DATA
-- ============================================================================
-- Insert 4 default buildings (A, B, C, D) with sample configuration

INSERT INTO buildings (building_name, building_code, north_end_units, south_end_units, access_instructions)
VALUES
  (
    'Building A',
    'A',
    ARRAY['A1A', 'A1B', 'A1C', 'A2A', 'A2B', 'A2C'],
    ARRAY['A3A', 'A3B', 'A3C', 'A4A', 'A4B', 'A4C'],
    'Access via north or south stairwell. Use keypad at roof door. Work cutoff time: 5:00 PM. Please close and secure all doors. Return key to lockbox when finished.'
  ),
  (
    'Building B',
    'B',
    ARRAY['B1D', 'B1E', 'B1F', 'B2D', 'B2E', 'B2F'],
    ARRAY['B3D', 'B3E', 'B3F', 'B4D', 'B4E', 'B4F'],
    'Access via north or south stairwell. Use keypad at roof door. Work cutoff time: 5:00 PM. Please close and secure all doors. Return key to lockbox when finished.'
  ),
  (
    'Building C',
    'C',
    ARRAY['C1G', 'C1H', 'C2G', 'C2H'],
    ARRAY['C3G', 'C3H', 'C4G', 'C4H'],
    'Access via north or south stairwell. Use keypad at roof door. Work cutoff time: 5:00 PM. Please close and secure all doors. Return key to lockbox when finished.'
  ),
  (
    'Building D',
    'D',
    ARRAY['D1J', 'D1K', 'D2J', 'D2K'],
    ARRAY['D3J', 'D3K', 'D4J', 'D4K'],
    'Access via north or south stairwell. Use keypad at roof door. Work cutoff time: 5:00 PM. Please close and secure all doors. Return key to lockbox when finished.'
  )
ON CONFLICT (building_code) DO NOTHING;

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function to get active PIN for a building
CREATE OR REPLACE FUNCTION get_active_pin_for_building(p_building_id UUID)
RETURNS TABLE (
  pin_code TEXT,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ap.pin_code,
    ap.valid_from,
    ap.valid_until
  FROM active_pins ap
  WHERE ap.building_id = p_building_id
    AND ap.valid_from <= NOW()
    AND ap.valid_until >= NOW()
  ORDER BY ap.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update conversation timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on contractor_conversations
DROP TRIGGER IF EXISTS update_contractor_conversations_timestamp ON contractor_conversations;
CREATE TRIGGER update_contractor_conversations_timestamp
  BEFORE UPDATE ON contractor_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Created tables:
--   1. buildings (with 4 pre-populated entries)
--   2. active_pins
--   3. contractor_conversations
--   4. conversation_messages
--
-- All tables have RLS enabled with appropriate policies
-- Helper functions created for PIN retrieval
-- Ready for production use with AI SMS conversation handler
-- ============================================================================
