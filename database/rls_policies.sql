-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to get current user institution
CREATE OR REPLACE FUNCTION get_my_institution()
RETURNS UUID AS $$
  SELECT institution_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER;

-- PROFILES
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins read institution profiles" ON profiles
  FOR SELECT USING (
    get_my_role() IN ('institution_admin','ngo_admin','super_admin')
    AND (institution_id = get_my_institution() OR get_my_role() = 'super_admin')
  );

CREATE POLICY "Super admin full access profiles" ON profiles
  FOR ALL USING (get_my_role() = 'super_admin');

-- LESSONS
CREATE POLICY "Students read available lessons" ON lessons
  FOR SELECT USING (
    is_public = true
    OR institution_id = get_my_institution()
    OR created_by = auth.uid()
  );

CREATE POLICY "Teachers manage own lessons" ON lessons
  FOR ALL USING (
    created_by = auth.uid()
    OR get_my_role() IN ('institution_admin','super_admin')
  );

-- STUDENT PROGRESS
CREATE POLICY "Students manage own progress" ON student_progress
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers read institution progress" ON student_progress
  FOR SELECT USING (
    get_my_role() IN ('teacher','institution_admin','super_admin')
  );

-- DAILY ACTIVITY
CREATE POLICY "Students manage own activity" ON daily_activity
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers read institution activity" ON daily_activity
  FOR SELECT USING (
    get_my_role() IN ('teacher','institution_admin','ngo_admin','super_admin')
  );

-- ASSESSMENT SUBMISSIONS
CREATE POLICY "Students manage own submissions" ON assessment_submissions
  FOR ALL USING (student_id = auth.uid());

CREATE POLICY "Teachers read all submissions" ON assessment_submissions
  FOR SELECT USING (
    get_my_role() IN ('teacher','institution_admin','super_admin')
  );
