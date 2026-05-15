<div align="center">

# 🌟 Sparsh
### *AI-Powered Inclusive Education Platform for Students with Disabilities*

<img src="https://img.shields.io/badge/Accessibility-WCAG%202.2%20AA-success?style=for-the-badge" />
<img src="https://img.shields.io/badge/Security-OWASP%20Top%2010-blue?style=for-the-badge" />
<img src="https://img.shields.io/badge/Compliance-RPwD%20Act%202016-orange?style=for-the-badge" />
<img src="https://img.shields.io/badge/India-NEP%202020-green?style=for-the-badge" />
<img src="https://img.shields.io/badge/License-MIT-purple?style=for-the-badge" />

### Empowering India's 2.68 Crore Persons with Disabilities Through Accessible AI Education

> **Sparsh** bridges educational barriers for **visually impaired**, **hearing impaired**, and **DeafBlind** learners with cutting-edge AI, secure cloud infrastructure, and universal design principles.

</div>

---

## ✨ Vision

Education should be accessible to everyone.

Sparsh transforms traditional learning into a fully inclusive digital experience by integrating:

- 🤟 AI-generated Indian Sign Language (ISL) interpretation
- 🔊 Multi-language text-to-speech
- 💬 Real-time captions
- ⠿ Braille display support
- 🌐 Offline-first learning
- 📊 Personalized analytics
- 🔐 Enterprise-grade cybersecurity

---

# 🚀 Key Features

## 👨‍🎓 Student Experience
- Adaptive learning dashboard
- AI-powered lesson narration
- ISL avatar overlay
- Live classes with captions
- Sign language practice lab
- Accessible assessments
- Progress analytics
- Downloadable PDF reports

## 👩‍🏫 Teacher Experience
- Lesson studio with AI auto-processing
- Caption editor
- Student performance insights
- Quiz creation tools
- Live classroom management

## 🏫 Institution Admin
- Bulk onboarding
- Compliance tracking
- Analytics dashboards
- Audit logs

## 🌐 Super Admin
- Multi-tenant platform management
- Feature flags
- AI model monitoring
- Security and health dashboards

---

# ♿ Accessibility Features

| Feature | Description |
|------|------|
| 🤟 ISL Avatar | AI-generated Indian Sign Language interpretation |
| 💬 Live Captions | Real-time speech-to-text |
| 🔊 Text-to-Speech | Supports Hindi, English, Urdu, Tamil, and more |
| ⠿ Braille Support | HID Braille device integration |
| 🎮 Switch Access | Navigation for motor impairments |
| 🎨 High Contrast | WCAG 2.2 AA compliant themes |
| 🌐 Offline Mode | PWA with cached lessons |

---

# 🔐 Security Architecture

Sparsh is designed with a **security-first approach** aligned with modern best practices.

## Security Controls

- 🔐 Supabase Row-Level Security (RLS)
- 🔑 JWT authentication
- 🔒 HTTPS/TLS encryption
- 🛡️ OWASP Top 10 mitigations
- 🚫 Rate limiting
- 🧹 Input validation with Zod/Pydantic
- 📋 Audit logging
- 🔍 Dependency vulnerability scanning
- 🧠 Secrets managed via environment variables
- 🗂️ Role-Based Access Control (RBAC)

## Compliance Standards

- OWASP ASVS
- GDPR-ready architecture
- India DPDP Act 2023
- RPwD Act 2016
- NEP 2020
- WCAG 2.2 AA

---

# 🛠 Tech Stack

## Frontend
- Next.js 14 (App Router)
- TypeScript (Strict Mode)
- Tailwind CSS
- React Hook Form
- Zod
- @react-pdf/renderer

## Backend
- FastAPI
- Python
- Pydantic
- Celery (optional)

## Database
- Supabase PostgreSQL
- Row-Level Security
- Realtime APIs

## AI Services
- Whisper for captions
- TTS engines
- ISL gesture recognition

---

# 🏗 System Architecture

```text
Users
 ├── Students
 ├── Teachers
 ├── Admins
 └── Super Admin

Frontend (Next.js)
        ↓
API Gateway / FastAPI
        ↓
Supabase Auth (JWT)
        ↓
PostgreSQL + RLS
        ↓
AI Services
 ├── Whisper
 ├── TTS
 ├── ISL Avatar
 └── Analytics Engine
