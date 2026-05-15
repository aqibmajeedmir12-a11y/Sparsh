-- Run this in your Supabase SQL Editor
-- Add institution_name and grade to profiles (if not already present)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS institution_name TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS board TEXT DEFAULT 'CBSE';

-- Create live_sessions table for real-time class notifications
CREATE TABLE IF NOT EXISTS live_sessions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_name  TEXT NOT NULL,
  title         TEXT NOT NULL,
  subject       TEXT,
  grade         TEXT,
  institution   TEXT,
  teacher_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  teacher_name  TEXT,
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  ended_at      TIMESTAMPTZ,
  is_active     BOOLEAN DEFAULT TRUE
);

-- Enable real-time on live_sessions
ALTER TABLE live_sessions REPLICA IDENTITY FULL;

-- Allow authenticated users to read live_sessions
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view active sessions from their institution"
  ON live_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teachers can insert their sessions"
  ON live_sessions FOR INSERT
  TO authenticated
  WITH CHECK (teacher_id = auth.uid());

CREATE POLICY "Teachers can update their own sessions"
  ON live_sessions FOR UPDATE
  TO authenticated
  USING (teacher_id = auth.uid());
