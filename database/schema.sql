-- Run this entire file in Supabase SQL Editor

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─────────────────────────────────────────
-- INSTITUTIONS
-- ─────────────────────────────────────────
CREATE TABLE institutions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT UNIQUE NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('school','ngo','university','corporate','government')),
  plan          TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','pro','institution','enterprise')),
  state         TEXT,
  district      TEXT,
  board         TEXT CHECK (board IN ('CBSE','ICSE','state','IB')),
  logo_url      TEXT,
  student_limit INT DEFAULT 50,
  teacher_limit INT DEFAULT 5,
  features      JSONB DEFAULT '{"live_class":true,"sign_lab":true,"offline":true,"bhashini":false,"deafblind_mode":true}',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- PROFILES (extends Supabase auth.users)
-- ─────────────────────────────────────────
CREATE TABLE profiles (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name           TEXT NOT NULL,
  avatar_url          TEXT,
  role                TEXT NOT NULL CHECK (role IN (
                        'student','teacher','institution_admin','ngo_admin','super_admin'
                      )),
  disability_type     TEXT CHECK (disability_type IN ('visual','hearing','both','deafblind','none')),
  grade               TEXT,
  board               TEXT,
  language_preference TEXT DEFAULT 'hi',
  institution_id      UUID REFERENCES institutions(id),
  plan                TEXT DEFAULT 'free',
  streak_days         INT DEFAULT 0,
  total_sign_hours    NUMERIC DEFAULT 0,
  total_lessons_done  INT DEFAULT 0,
  last_active         TIMESTAMPTZ DEFAULT NOW(),
  accessibility_prefs JSONB DEFAULT '{
    "captions_on": true,
    "isl_avatar_on": true,
    "tts_on": false,
    "high_contrast": false,
    "font_size": "medium",
    "tts_speed": 1.0,
    "caption_size": "medium",
    "haptic_on": false,
    "braille_paired": false,
    "switch_access": false,
    "deafblind_mode": false
  }',
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─────────────────────────────────────────
-- ISL SIGN DICTIONARY
-- ─────────────────────────────────────────
CREATE TABLE isl_signs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  word           TEXT NOT NULL,
  word_hindi     TEXT,
  language       TEXT DEFAULT 'en',
  video_url      TEXT,
  thumbnail_url  TEXT,
  landmark_data  JSONB,
  gloss_sequence JSONB,
  category       TEXT CHECK (category IN (
                   'alphabet','number','common','math','science',
                   'social','action','emotion','classroom'
                 )),
  difficulty     TEXT DEFAULT 'beginner' CHECK (difficulty IN ('beginner','intermediate','advanced')),
  ncert_grade    TEXT,
  subject        TEXT,
  usage_count    INT DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- LESSONS
-- ─────────────────────────────────────────
CREATE TABLE lessons (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                 TEXT NOT NULL,
  description           TEXT,
  subject               TEXT,
  grade                 TEXT,
  chapter               TEXT,
  board                 TEXT,
  language              TEXT DEFAULT 'hi',
  duration_seconds      INT,
  thumbnail_url         TEXT,
  video_url             TEXT,
  pdf_url               TEXT,
  signed_video_url      TEXT,
  caption_vtt_url       TEXT,
  transcript_text       TEXT,
  audio_desc_url        TEXT,
  braille_pdf_url       TEXT,
  accessible_summary    TEXT,
  key_vocabulary        JSONB,
  avatar_poses_url      TEXT,
  processing_status     TEXT DEFAULT 'pending' CHECK (processing_status IN (
                          'pending','processing','completed','failed'
                        )),
  processing_jobs       JSONB DEFAULT '{}',
  created_by            UUID REFERENCES profiles(id),
  institution_id        UUID REFERENCES institutions(id),
  is_public             BOOLEAN DEFAULT false,
  is_ncert_aligned      BOOLEAN DEFAULT false,
  tags                  TEXT[],
  view_count            INT DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lessons_grade_board ON lessons(grade, board);
CREATE INDEX idx_lessons_subject ON lessons(subject);
CREATE INDEX idx_lessons_institution ON lessons(institution_id);

-- ─────────────────────────────────────────
-- STUDENT PROGRESS
-- ─────────────────────────────────────────
CREATE TABLE student_progress (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id          UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id           UUID REFERENCES lessons(id) ON DELETE CASCADE,
  completion_percent  INT DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
  last_position_sec   INT DEFAULT 0,
  signs_practiced     INT DEFAULT 0,
  quiz_score          NUMERIC(5,2),
  quiz_attempts       INT DEFAULT 0,
  time_spent_seconds  INT DEFAULT 0,
  accessibility_used  JSONB DEFAULT '{}',
  completed_at        TIMESTAMPTZ,
  last_accessed       TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, lesson_id)
);

CREATE INDEX idx_progress_student ON student_progress(student_id);
CREATE INDEX idx_progress_lesson ON student_progress(lesson_id);

-- ─────────────────────────────────────────
-- DAILY ACTIVITY LOG (for reports)
-- ─────────────────────────────────────────
CREATE TABLE daily_activity (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_date    DATE NOT NULL,
  lessons_started  INT DEFAULT 0,
  lessons_completed INT DEFAULT 0,
  signs_practiced  INT DEFAULT 0,
  quizzes_taken    INT DEFAULT 0,
  quiz_avg_score   NUMERIC(5,2),
  time_spent_min   INT DEFAULT 0,
  isl_used         BOOLEAN DEFAULT false,
  captions_used    BOOLEAN DEFAULT false,
  tts_used         BOOLEAN DEFAULT false,
  streak_day       INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, activity_date)
);

CREATE INDEX idx_daily_student ON daily_activity(student_id, activity_date DESC);

-- ─────────────────────────────────────────
-- ASSESSMENTS
-- ─────────────────────────────────────────
CREATE TABLE assessments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id    UUID REFERENCES lessons(id),
  title        TEXT,
  questions    JSONB NOT NULL,
  time_limit_minutes INT DEFAULT 30,
  passing_score INT DEFAULT 60,
  created_by   UUID REFERENCES profiles(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE assessment_submissions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id  UUID REFERENCES assessments(id),
  student_id     UUID REFERENCES profiles(id),
  answers        JSONB,
  score          NUMERIC(5,2),
  passed         BOOLEAN,
  time_taken_sec INT,
  submitted_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────
-- LIVE SESSIONS
-- ─────────────────────────────────────────
CREATE TABLE live_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id      UUID REFERENCES profiles(id),
  institution_id  UUID REFERENCES institutions(id),
  title           TEXT,
  grade           TEXT,
  subject         TEXT,
  status          TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','paused','ended')),
  rtc_channel_id  TEXT,
  caption_enabled BOOLEAN DEFAULT true,
  isl_enabled     BOOLEAN DEFAULT true,
  participant_count INT DEFAULT 0,
  recording_url   TEXT,
  scheduled_at    TIMESTAMPTZ,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE session_participants (
  session_id   UUID REFERENCES live_sessions(id),
  student_id   UUID REFERENCES profiles(id),
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  left_at      TIMESTAMPTZ,
  PRIMARY KEY(session_id, student_id)
);

-- ─────────────────────────────────────────
-- AI PROCESSING JOBS
-- ─────────────────────────────────────────
CREATE TABLE ai_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id    UUID REFERENCES lessons(id),
  job_type     TEXT CHECK (job_type IN (
                 'whisper_transcription','isl_generation','tts_generation',
                 'vision_alttext','claude_summary','braille_export'
               )),
  status       TEXT DEFAULT 'queued' CHECK (status IN (
                 'queued','processing','completed','failed','retrying'
               )),
  input_data   JSONB,
  output_data  JSONB,
  error_message TEXT,
  attempts     INT DEFAULT 0,
  duration_ms  INT,
  queued_at    TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ─────────────────────────────────────────
-- ANALYTICS EVENTS
-- ─────────────────────────────────────────
CREATE TABLE analytics_events (
  id             BIGSERIAL PRIMARY KEY,
  user_id        UUID REFERENCES profiles(id),
  institution_id UUID REFERENCES institutions(id),
  event_type     TEXT NOT NULL,
  payload        JSONB,
  platform       TEXT CHECK (platform IN ('mobile','web','tablet')),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_analytics_user ON analytics_events(user_id, created_at DESC);
CREATE INDEX idx_analytics_institution ON analytics_events(institution_id, created_at DESC);
