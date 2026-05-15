-- ─────────────────────────────────────────
-- SPARSH SEED DATA
-- Run AFTER schema.sql and rls_policies.sql
-- ─────────────────────────────────────────

-- Demo Institution
INSERT INTO institutions (id, name, slug, type, plan, state, district, board, student_limit, teacher_limit)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Delhi School for the Deaf',
  'delhi-school-deaf',
  'school',
  'pro',
  'Delhi',
  'New Delhi',
  'CBSE',
  300,
  20
);

-- Note: User profiles are auto-created by trigger on auth.users insert.
-- After creating users via Supabase Auth, run the SQL below to set roles.
-- Replace <UUID> with actual UUIDs from auth.users table.

-- Example SQL to promote a user to super_admin (run after creating account):
-- UPDATE profiles SET role = 'super_admin' WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@sparsh.edu.in');
-- UPDATE profiles SET role = 'teacher', institution_id = '00000000-0000-0000-0000-000000000001' WHERE id = (SELECT id FROM auth.users WHERE email = 'teacher@sparsh.edu.in');

-- Demo ISL Sign Dictionary
INSERT INTO isl_signs (word, word_hindi, language, category, difficulty, ncert_grade, subject) VALUES
('Hello', 'नमस्ते', 'en', 'common', 'beginner', NULL, NULL),
('Thank You', 'धन्यवाद', 'en', 'common', 'beginner', NULL, NULL),
('Please', 'कृपया', 'en', 'common', 'beginner', NULL, NULL),
('Yes', 'हाँ', 'en', 'common', 'beginner', NULL, NULL),
('No', 'नहीं', 'en', 'common', 'beginner', NULL, NULL),
('Help', 'मदद', 'en', 'common', 'beginner', NULL, NULL),
('Water', 'पानी', 'en', 'common', 'beginner', NULL, NULL),
('Food', 'खाना', 'en', 'common', 'beginner', NULL, NULL),
('School', 'विद्यालय', 'en', 'classroom', 'beginner', NULL, NULL),
('Teacher', 'शिक्षक', 'en', 'classroom', 'beginner', NULL, NULL),
('Student', 'विद्यार्थी', 'en', 'classroom', 'beginner', NULL, NULL),
('Book', 'किताब', 'en', 'classroom', 'beginner', NULL, NULL),
('Apple', 'सेब', 'en', 'common', 'beginner', NULL, NULL),
('Happy', 'खुश', 'en', 'emotion', 'beginner', NULL, NULL),
('Sad', 'दुखी', 'en', 'emotion', 'beginner', NULL, NULL),
('Angry', 'गुस्सा', 'en', 'emotion', 'beginner', NULL, NULL),
-- Numbers
('One', 'एक', 'en', 'number', 'beginner', NULL, NULL),
('Two', 'दो', 'en', 'number', 'beginner', NULL, NULL),
('Three', 'तीन', 'en', 'number', 'beginner', NULL, NULL),
('Ten', 'दस', 'en', 'number', 'beginner', NULL, NULL),
-- Science vocabulary
('Atom', 'परमाणु', 'en', 'science', 'intermediate', '8', 'Science'),
('Electron', 'इलेक्ट्रॉन', 'en', 'science', 'intermediate', '8', 'Science'),
('Proton', 'प्रोटॉन', 'en', 'science', 'intermediate', '8', 'Science'),
('Neutron', 'न्यूट्रॉन', 'en', 'science', 'intermediate', '8', 'Science'),
('Nucleus', 'नाभिक', 'en', 'science', 'intermediate', '8', 'Science'),
('Molecule', 'अणु', 'en', 'science', 'intermediate', '8', 'Science'),
('Cell', 'कोशिका', 'en', 'science', 'intermediate', '8', 'Biology'),
('DNA', 'डीएनए', 'en', 'science', 'advanced', '9', 'Biology'),
-- Math vocabulary
('Add', 'जोड़ना', 'en', 'math', 'beginner', '6', 'Mathematics'),
('Subtract', 'घटाना', 'en', 'math', 'beginner', '6', 'Mathematics'),
('Multiply', 'गुणा', 'en', 'math', 'beginner', '6', 'Mathematics'),
('Divide', 'भाग', 'en', 'math', 'beginner', '6', 'Mathematics'),
('Equal', 'बराबर', 'en', 'math', 'beginner', '6', 'Mathematics'),
('Fraction', 'भिन्न', 'en', 'math', 'intermediate', '7', 'Mathematics');

-- Demo Lessons (no video_url since this is seed data)
INSERT INTO lessons (id, title, description, subject, grade, chapter, board, language, duration_seconds, processing_status, is_public, is_ncert_aligned, institution_id, tags)
VALUES
(
  '10000000-0000-0000-0000-000000000001',
  'Structure of Atom',
  'Learn about the fundamental building blocks of matter — atoms, subatomic particles, and atomic models.',
  'Science', '8', 'Chapter 4', 'CBSE', 'hi', 1500, 'completed', true, true,
  '00000000-0000-0000-0000-000000000001',
  ARRAY['ISL Ready', 'Captions', 'Offline']
),
(
  '10000000-0000-0000-0000-000000000002',
  'Linear Equations in Two Variables',
  'Understand how to solve linear equations with two variables graphically and algebraically.',
  'Mathematics', '8', 'Chapter 2', 'CBSE', 'hi', 1800, 'completed', true, true,
  '00000000-0000-0000-0000-000000000001',
  ARRAY['ISL Ready', 'Offline']
),
(
  '10000000-0000-0000-0000-000000000003',
  'The French Revolution',
  'Explore the causes, events, and impact of the French Revolution on modern democracy.',
  'History', '9', 'Chapter 1', 'CBSE', 'hi', 2100, 'completed', true, true,
  '00000000-0000-0000-0000-000000000001',
  ARRAY['Captions', 'TTS']
),
(
  '10000000-0000-0000-0000-000000000004',
  'Cell Biology: The Unit of Life',
  'Discover the structure and function of plant and animal cells.',
  'Biology', '8', 'Chapter 5', 'CBSE', 'hi', 1320, 'completed', true, true,
  '00000000-0000-0000-0000-000000000001',
  ARRAY['ISL Ready', 'Captions', 'TTS']
),
(
  '10000000-0000-0000-0000-000000000005',
  'Motion and Laws of Motion',
  'Newton''s three laws of motion with real-world demonstrations.',
  'Physics', '9', 'Chapter 8', 'CBSE', 'hi', 1680, 'processing', false, true,
  '00000000-0000-0000-0000-000000000001',
  ARRAY['ISL Ready']
);

-- Demo Assessments
INSERT INTO assessments (id, lesson_id, title, questions, time_limit_minutes, passing_score)
VALUES
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Structure of Atom Quiz',
  '[
    {"id":1,"question":"What is the smallest particle that retains chemical properties?","options":["Molecule","Atom","Electron","Proton"],"correct":1},
    {"id":2,"question":"Where are protons located?","options":["Outer shell","Nucleus","Orbit","Electron cloud"],"correct":1},
    {"id":3,"question":"What is the charge of an electron?","options":["Positive","Negative","Neutral","Variable"],"correct":1}
  ]'::jsonb,
  15,
  60
),
(
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  'Linear Equations Test',
  '[
    {"id":1,"question":"What is the general form of a linear equation?","options":["ax²+bx+c=0","ax+b=0","ax+by=c","ax³=0"],"correct":1},
    {"id":2,"question":"How many solutions does ax+by+c=0 have?","options":["One","Two","Infinite","None"],"correct":2}
  ]'::jsonb,
  30,
  70
);
