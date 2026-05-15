# Sparsh — Accessible Education Platform

> An AI-powered, inclusive education platform serving visually impaired, hearing impaired, and DeafBlind students across India.

## Quick Start

### 1. Database Setup (Supabase)
1. Create a project at [supabase.com](https://supabase.com)
2. Run `database/schema.sql` in the SQL Editor
3. Run `database/rls_policies.sql` in the SQL Editor
4. Run `database/seed.sql` for demo data (optional)

### 2. Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 3. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
# → http://localhost:8000
# → http://localhost:8000/docs  (Swagger UI)
```

### 4. Environment Variables
Create `frontend/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

---

## Role-Based Access

| Role | Dashboard URL | Default Access |
|---|---|---|
| Student | `/student` | Lessons, Sign Lab, Live Class, Assessments, Progress, Reports |
| Teacher | `/teacher` | Studio, Live Class, Students, Assessments, Reports |
| Institution Admin | `/admin` | Students, Teachers, Analytics, Compliance, Reports |
| NGO Admin | `/admin` | Same as Institution Admin |
| Super Admin | `/super-admin` | Institutions, All Users, AI Monitor, Platform Reports |

### Creating Your First Super Admin
1. Register at `/register` with any email/password
2. Go to Supabase SQL Editor and run:
```sql
UPDATE profiles 
SET role = 'super_admin' 
WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
```
3. Log in at `/login` — you'll be redirected to `/super-admin`

---

## Pages Built

### Student Dashboard
- `/student` — Home with stats, today's lesson, live class alert
- `/student/lessons` — NCERT-aligned lesson browser with filters
- `/student/lessons/[id]` — Full lesson player with ISL avatar + captions + TTS
- `/student/sign-lab` — Camera + ISL gesture practice with dictionary
- `/student/live-class` — Join live sessions with ISL + captions
- `/student/assessments` — Quiz list with status tracking
- `/student/assessments/[id]` — Interactive MCQ quiz with review
- `/student/progress` — Progress charts, quiz history, ISL milestones
- `/student/reports` — Period report selector + PDF download
- `/student/profile` — Profile editing + accessibility preferences

### Teacher Dashboard
- `/teacher` — KPIs, AI processing queue, engagement heatmap
- `/teacher/studio` — Lesson upload with AI auto-processing
- `/teacher/studio/[id]` — Caption editor, metadata, AI status
- `/teacher/live` — Start/manage live sessions with participants
- `/teacher/students` — Student roster with disability profiles
- `/teacher/assessments` — Create and manage quizzes
- `/teacher/reports` — Class performance + at-risk students

### Admin Dashboard
- `/admin` — Institution analytics with charts
- `/admin/students` — Bulk student management
- `/admin/teachers` — Teacher management
- `/admin/analytics` — Deep analytics with heatmap + DAU charts
- `/admin/compliance` — RPwD Act 2016 + NEP 2020 compliance checker
- `/admin/reports` — All report formats download center

### Super Admin Panel
- `/super-admin` — Service health, AI metrics, feature flags, error log
- `/super-admin/institutions` — All institutions management
- `/super-admin/users` — All users across institutions
- `/super-admin/ai-monitor` — Real-time AI model performance
- `/super-admin/reports` — Platform-wide analytics + scheduled reports

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | TailwindCSS + CSS variables (glassmorphism) |
| Auth | Supabase Auth (JWT) |
| Database | Supabase (PostgreSQL + RLS) |
| PDF Reports | @react-pdf/renderer |
| Forms | React Hook Form + Zod |
| Backend AI | Python FastAPI |

---

## Accessibility Features

- 🤟 **ISL Avatar** — AI-generated Indian Sign Language interpretation overlay
- 💬 **Live Captions** — Whisper-powered auto-captions on all content
- 🔊 **Text-to-Speech** — Multi-language TTS for visually impaired students
- ⠿ **Braille Display** — HID Braille device support for DeafBlind users
- 🌐 **Offline Mode** — PWA with cached lessons for low-connectivity areas
- 🎮 **Switch Access** — Motor-impaired navigation via switch controls
- 🎨 **High Contrast** — WCAG-compliant high contrast theme

---

*Built for India's 2.68 crore persons with disabilities. Powered by AI.*
