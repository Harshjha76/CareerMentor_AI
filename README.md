# CareerPilot AI 🚀
### 24/7 Intelligent Career Guidance Agent for College Students & Job Seekers

CareerPilot AI is a production-ready, full-stack AI career mentor web application built for college students and job seekers. It strictly supports **4 dedicated languages**: **English**, **Hindi (हिंदी)**, **Marathi (मराठी)**, and **Sanskrit (संस्कृतम्)** across all UI elements, AI resume analysis, personalized learning roadmaps, study planner schedules, chatbot counseling, and email reminders.

---

## 🌟 Core Highlights

1. **Instant Google Sign-In & 1-Click Demo Login**
   - Single "Sign in with Google" button utilizing Google Identity Services (OAuth 2.0).
   - Instant "Explore Demo Account" button for immediate evaluation without external Google credentials.
   - Onboarding wizard capturing Target Role, Dream Companies, Technical Skills, Daily Study Hours, and Preferred Language (`en`, `hi`, `mr`, `sa`).

2. **Strict 4-Language Ecosystem**
   - Strictly supports **ONLY 4 languages**:
     - 🇬🇧 English (`en`)
     - 🇮🇳 Hindi (`hi` - हिंदी)
     - 🚩 Marathi (`mr` - मराठी)
     - 🕉️ Sanskrit (`sa` - संस्कृतम्)
   - Zero hardcoded English strings in UI.
   - AI outputs (Gemini API with fallback) strictly drafted in the user's selected language.

3. **AI Resume Analyzer & ATS Scorer**
   - Upload `.pdf`, `.docx`, or `.txt` resumes.
   - Circular ATS score gauge (0-100) with color grading.
   - Comprehensive tabbed breakdown:
     - Overview & ATS Compatibility
     - Structure & Formatting Checks
     - Missing Sections & Impact Metrics
     - Industry Keyword Optimization (Present vs. Missing)
     - Grammar, Clarity & Impact Action Verbs
     - Top Actionable Suggestions
   - Export analysis report directly as a branded PDF.

4. **Smart Roadmap Generator**
   - Personalized time-bound learning roadmaps based on skill, target role, duration (weeks), and daily study commitment.
   - Week-by-week accordion breakdown with daily tasks and milestones.
   - Curated resource links categorized into:
     - 📖 Articles (GeeksforGeeks, MDN, Real Python)
     - 🎥 YouTube Tutorials (freeCodeCamp, regional educators)
     - 🌐 Practice Platforms (LeetCode, HackerRank)
   - Interactive checklist with real-time completion progress calculation.
   - Export curriculum as PDF.

5. **AI-Powered Study Planner**
   - Synchronized daily and weekly views.
   - AI automatically generates a realistic weekly schedule matching roadmap tasks and daily hours.
   - Visual badges: Green (Completed), Yellow (Pending), Red (Overdue).
   - "Send Test Reminder Email" to test localized notifications instantly.

6. **24/7 Context-Aware Career Chatbot**
   - WhatsApp/Telegram-style conversational UI.
   - Context-aware memory: injects target role, dream companies, daily study hours, and last 10 messages.
   - Responds strictly in English, Hindi, Marathi, or Sanskrit.
   - In-chat language switcher for switching languages on the fly.
   - Pre-populated quick prompts and clear history feature.

7. **Goal Tracker & Milestone Celebration**
   - Break large aspirations into actionable milestone subtasks with AI.
   - Interactive progress percentage sliders and subtask checklists.
   - Celebratory confetti animation (`canvas-confetti`) when completing goals.

8. **Daily Reminder System**
   - Multi-channel notification engine (Resend API, Nodemailer SMTP, and dev mode simulation).
   - Generates notifications tailored strictly to the user's chosen language:
     - *English*: "You have 2 tasks pending today 📚"
     - *Hindi*: "आज आपके 2 अध्ययन कार्य बाकी हैं 📚"
     - *Marathi*: "आज तुमची 2 अभ्यास कार्ये बाकी आहेत 📚"
     - *Sanskrit*: "अद्य तव २ कार्याणि शेषाणि सन्ति 📚"

9. **Admin Platform Analytics**
   - Live KPI cards: Total registered users, Average ATS score, Total roadmaps, Active goals.
   - Visual Language Distribution bar chart (English, Hindi, Marathi, Sanskrit).
   - Top target roles distribution.
   - Most in-demand skills breakdown.

---

## 🏗️ Architecture & Tech Stack

```
CareerPilot AI
├── backend/
│   ├── src/
│   │   ├── config/db.js          # Dual PostgreSQL & SQLite auto-fallback
│   │   ├── controllers/         # Auth, Resume, Roadmap, Planner, Chat, Goals, Reminders, Admin
│   │   ├── middleware/          # JWT auth & Multer file uploads
│   │   ├── services/            # Gemini AI, Email (Resend/SMTP), Resume Parser (PDF/DOCX)
│   │   ├── routes/api.js        # Express API endpoints
│   │   └── server.js            # Express server
├── frontend/
│   ├── src/
│   │   ├── context/             # AuthContext, LanguageContext (Strict 4-Lang i18n)
│   │   ├── i18n/                # en.json, hi.json, mr.json, sa.json
│   │   ├── components/          # Navbar, LanguageSelector, GoogleSignInButton
│   │   ├── pages/               # Landing, Onboarding, Dashboard, Resume, Roadmap, Planner, Chat, Goals, Settings, Admin
│   │   └── services/api.js      # API client
```

- **Frontend**: React 19, Vite, Tailwind CSS, Lucide React, Canvas Confetti, jsPDF, React Router DOM.
- **Backend**: Node.js, Express, PostgreSQL (`pg`), SQLite (`sqlite3` fallback), Google Auth Library, `@google/generative-ai`, Multer, `pdf-parse`, `mammoth`, `nodemailer`.

---

## 🚀 Running Locally

### 1. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Variables
Create `.env` inside `backend/`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_jwt_secret_key

# Optional: PostgreSQL Database URL (falls back to local SQLite if not configured)
# DATABASE_URL=postgres://user:password@localhost:5432/careerpilot

# Optional: Google OAuth 2.0 Client ID (1-Click Demo login works out-of-the-box without this)
# GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com

# Optional: Gemini API Key (multilingual fallback engine works out-of-the-box without this)
# GEMINI_API_KEY=your_gemini_api_key

# Optional: Resend API Key for live email sending (simulated preview works out-of-the-box)
# RESEND_API_KEY=re_123456789
EMAIL_FROM="CareerPilot AI <notifications@careerpilot.ai>"
```

### 3. Start Application
```bash
# Start Backend (runs on http://localhost:5000)
cd backend
npm run dev

# Start Frontend in another terminal (runs on http://localhost:5173)
cd frontend
npm run dev
```

---

## 🌐 Deploying to Production (Render / Railway / Vercel)

### Deploying to Render
1. Create a new **Web Service** pointing to this repository.
2. Root Directory: `backend`
3. Build Command: `npm install && npm --prefix ../frontend install && npm --prefix ../frontend run build`
4. Start Command: `npm start`
5. Set Environment variables (`NODE_ENV=production`, `DATABASE_URL=postgres://...`).

---

## 📜 License
MIT License. Built for students and job seekers worldwide.
