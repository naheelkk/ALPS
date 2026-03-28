<div align="center">

# 🎓 ALPS — Adaptive Learning Platform System

**An intelligent full-stack e-learning platform powered by Contextual Multi-Armed Bandits and LLM-assisted topic tagging.**

[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Flask](https://img.shields.io/badge/Flask-3.0-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com)
[![SQLite](https://img.shields.io/badge/SQLite-Dev-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)

</div>

---

## 📖 Overview

ALPS is a full-stack adaptive learning platform built for **students, tutors, and administrators**. It combines traditional LMS features (courses, lessons, quizzes) with an **AI-driven recommendation engine** that personalizes the learning experience for every student.

The adaptive layer is built on a **Contextual Multi-Armed Bandit (CMAB)** algorithm using the **LinUCB** approach. After every quiz, the engine:
1. Analyses the student's per-concept performance
2. Builds a dynamic **Context Vector** ($x_t$) from mastery scores
3. Selects the optimal learning resource by balancing **exploitation** (historically effective content) with **exploration** (uncertainty bonus $\alpha \sqrt{x_t^\top A_a^{-1} x_t}$)
4. **Updates its model online**, continuously improving future recommendations

An **LLM-powered topic tagging** layer (Google Gemini) further enriches lesson metadata for more precise concept mapping.

---

## ✨ Key Features

| Category | Features |
|---|---|
| 🔐 **Auth** | JWT authentication, role-based access (Student / Tutor / Admin) |
| 📚 **Courses** | Full course & lesson management, rich multi-block lesson content (text, video, code, images, files) |
| 📝 **Quizzes** | Auto-graded quizzes, timed sessions, per-question concept tagging, bulk JSON import |
| 🤖 **Adaptive AI** | LinUCB CMAB engine, weighted mastery tracking with recency decay, instructor rule overrides |
| 📊 **Analytics** | Student dashboard, concept mastery bars, learning velocity charts, daily streak tracking |
| 🏆 **Recommendations** | Priority-ranked resources, helpful/not-helpful feedback loop, status tracking |
| 🛠️ **Admin Panel** | Full CRUD for courses/lessons/quizzes, user management, assessment grading with concept breakdown |
| 🐳 **DevOps** | Docker Compose deployment, SQLite (dev) / PostgreSQL (prod) support |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser (React 18)                    │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │Dashboard │  │ Courses  │  │  Quizzes │  │  Admin   │  │
│   └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│        │              │              │              │         │
│        └──────────────┴──────────────┴──────────────┘        │
│                          Axios (JWT)                          │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP/REST
┌──────────────────────────────▼──────────────────────────────┐
│                     Flask API  (:5000)                       │
│   ┌──────────┐  ┌──────────┐  ┌───────────────────────┐    │
│   │  Routes  │  │  Models  │  │       Services         │    │
│   │ /auth    │  │ User     │  │  ┌─────────────────┐  │    │
│   │ /courses │  │ Course   │  │  │  CMAB Engine    │  │    │
│   │ /quizzes │  │ Quiz     │  │  │  (LinUCB)       │  │    │
│   │ /admin   │  │ Bandit   │  │  ├─────────────────┤  │    │
│   │ /progress│  │ LearLog  │  │  │ MasteryTracker  │  │    │
│   └──────────┘  └──────────┘  │  ├─────────────────┤  │    │
│                                │  │ LLM Topic Tagger│  │    │
│                                │  └─────────────────┘  │    │
│                                └───────────────────────┘    │
└──────────────────────────────┬──────────────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │  SQLite (dev)        │
                    │  PostgreSQL (prod)   │
                    └─────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend
| Package | Purpose |
|---|---|
| `Flask 3.0` | Web framework & routing |
| `Flask-SQLAlchemy` | ORM & database abstraction |
| `Flask-JWT-Extended` | JWT authentication |
| `Flask-Migrate` | Schema version control |
| `Flask-CORS` | Cross-origin request handling |
| `Flask-Marshmallow` | Serialization / deserialization |
| `NumPy` | Matrix operations for LinUCB |
| `Pandas` | Data analysis & learning velocity |
| `scikit-learn` | Linear regression (velocity) |
| `NetworkX` | Concept dependency graph |
| `Google Generative AI` | LLM-powered topic tagging |

### Frontend
| Package | Purpose |
|---|---|
| `React 18` | UI framework |
| `Vite 5` | Build tool & dev server |
| `React Router v6` | Client-side routing |
| `Zustand` | Lightweight global state |
| `TailwindCSS` | Utility-first styling |
| `Recharts` | Data visualization |
| `React Hook Form` | Form management |
| `Axios` | HTTP client with JWT interceptors |
| `Lucide React` | Icon library |
| `React Hot Toast` | Notifications |

---

## 📁 Project Structure

```
Project-1/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory — registers all extensions & blueprints
│   │   ├── models/              # SQLAlchemy ORM models
│   │   │   ├── user.py          # User (roles: student / tutor / admin)
│   │   │   ├── course.py        # Course, Lesson, LessonContent, Enrollment, LessonProgress
│   │   │   ├── quiz.py          # Quiz, Question, Submission, Answer
│   │   │   ├── recommendation.py# Recommendations with feedback
│   │   │   ├── adaptive.py      # Instructor-defined adaptive rules
│   │   │   ├── bandit.py        # BanditParam (LinUCB A matrix & b vector)
│   │   │   ├── learning_log.py  # Experience replay buffer
│   │   │   └── resource.py      # External resource catalog
│   │   ├── routes/              # Flask Blueprint API routes
│   │   │   ├── auth.py          # /api/auth/*
│   │   │   ├── courses.py       # /api/courses/*
│   │   │   ├── quizzes.py       # /api/quizzes/*
│   │   │   ├── recommendations.py # /api/recommendations/*
│   │   │   ├── progress.py      # /api/progress/*
│   │   │   ├── assessments.py   # /api/assessments/*
│   │   │   └── admin.py         # /api/admin/* (protected)
│   │   └── services/
│   │       ├── rl_agent.py      # CMAB engine (LinUCB algorithm)
│   │       └── mastery_tracker.py # Weighted decay mastery scores
│   ├── config.py                # Dev / Prod / Test config classes
│   ├── run.py                   # Entry point
│   ├── requirements.txt
│   └── migrations/
│
├── frontend/
│   └── src/
│       ├── App.jsx              # Root router with ProtectedRoute / AdminRoute guards
│       ├── pages/
│       │   ├── auth/            # Login, Register
│       │   ├── courses/         # CourseList, CourseDetail
│       │   ├── quiz/            # Quiz, QuizResult
│       │   ├── admin/           # AdminDashboard, CourseManager, UserManagement, etc.
│       │   ├── Dashboard.jsx    # Student home screen
│       │   ├── Progress.jsx     # Mastery bars + velocity chart
│       │   ├── Recommendations.jsx
│       │   ├── MyAssessments.jsx
│       │   └── Profile.jsx
│       ├── components/
│       │   ├── layout/          # MainLayout, AuthLayout, Navbar, Sidebar
│       │   └── ui/              # Badge, Card, Button, and other primitives
│       ├── services/            # Axios service wrappers per domain
│       ├── stores/              # Zustand stores (auth, course, quiz, progress, recommendation)
│       └── utils/
│
└── docker-compose.yml
```

---

## 🚀 Getting Started

### Prerequisites

- **Python 3.11+**
- **Node.js 18+** and **npm**
- **Docker** (optional, for containerised deployment)

---

### 1. Clone the Repository

```bash
git clone https://github.com/naheelkk/ALPS
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / macOS

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
# Create a .env file with the following:
```

**`backend/.env`**
```env
SECRET_KEY=your-super-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=                    # Leave empty to use SQLite (dev)
GOOGLE_API_KEY=                  # Optional: for LLM topic tagging
```

```bash
# Run database migrations
flask db upgrade

# Start the development server
python run.py
# ✅ API running at http://localhost:5000
```

---

### 3. Frontend Setup

```bash
cd frontend

npm install
npm run dev
# ✅ App running at http://localhost:5173
```

---

### 4. Docker (Full Stack)

```bash
# From the project root — starts both backend and frontend
docker compose up --build

# Stop all services
docker compose down
```

| Service | URL |
|---|---|
| React Frontend | http://localhost:80 |
| Flask API | http://localhost:5000 |

---

## 🗃️ Database Schema

```
users
 ├──< enrollments >─ courses
 │                    ├──< lessons
 │                    │    └──< lesson_content
 │                    │    └──< lesson_progress >─ users
 │                    ├──< quizzes
 │                    │    └──< questions
 │                    │         └──< answers >─ submissions >─ users
 │                    ├──< assessments
 │                    │    └──< assessment_submissions >─ users
 │                    └──< adaptive_rules
 ├──< recommendations
 ├──< learning_logs
 └──< bandit_params (polymorphic: lesson | resource)
```

---

## 🤖 How the Adaptive Engine Works

The CMAB engine follows the **LinUCB** (Linear Upper Confidence Bound) algorithm:

### Step 1 — Context Vector ($x_t$)
After a quiz submission, the `MasteryTracker` builds a vector of the student's current mastery across all known topics, using a **weighted decay model**:

- Baseline mastery: `0.5` per concept
- Correct answer: `+0.15 × recency_weight × difficulty_weight`
- Incorrect answer: `−0.20 × recency_weight × difficulty_weight`
- **Recency decay**: older answers decay at `0.9×` per week
- **Difficulty weights**: easy → `0.8×`, medium → `1.0×`, hard → `1.2×`
- **Prerequisite capping**: mastery capped at `1.2×` weakest prerequisite's mastery

### Step 2 — Action Selection (UCB Score)
For each candidate lesson/resource $a$:

$$\text{score}(a) = \hat{\theta}_a^\top x_t + \alpha \sqrt{x_t^\top A_a^{-1} x_t}$$

where $\hat{\theta}_a = A_a^{-1} b_a$ are the learned weights, and the second term is the **exploration bonus**.

### Step 3 — Reward & Model Update
When the student takes a follow-up quiz, the reward $r_t$ (score improvement) updates the bandit model:

$$A_a \leftarrow A_a + x_t x_t^\top \qquad b_a \leftarrow b_a + r_t x_t$$

### Instructor Overrides
Tutors can define `AdaptiveRule` entries per course. When a student's mastery for a defined concept falls below a threshold, the engine bypasses its selection and uses the manually-specified resource instead.

---

## 🔌 API Reference

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/register` | — | Create student account |
| `POST` | `/login` | — | Login → receive JWT |
| `GET` | `/me` | ✅ JWT | Get current user |
| `PUT` | `/profile` | ✅ JWT | Update name / bio / avatar |
| `POST` | `/change-password` | ✅ JWT | Change password |

### Courses — `/api/courses`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/` | — | List published courses |
| `GET` | `/:id` | — | Course detail (lessons, quizzes) |
| `POST` | `/:id/enroll` | ✅ JWT | Enroll in course |
| `POST` | `/:id/lessons/:lid/complete` | ✅ JWT | Mark lesson complete |
| `GET` | `/:id/progress` | ✅ JWT | Enrollment progress |

### Quizzes — `/api/quizzes`

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/courses/:id/quizzes` | ✅ JWT | List quizzes for course |
| `GET` | `/:id` | ✅ JWT | Get quiz (answers hidden) |
| `POST` | `/:id/submit` | ✅ JWT | Submit → get score + recommendations |
| `GET` | `/:id/result/:sid` | ✅ JWT | Full result with concept breakdown |

### Progress — `/api/progress`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/dashboard` | Aggregate stats, streak, mastery |
| `GET` | `/mastery` | Per-concept mastery scores |
| `GET` | `/quiz-history` | All past quiz submissions |
| `GET` | `/learning-velocity` | Score improvement rate (linear regression) |
| `GET` | `/streak` | Daily learning streak |

### Admin — `/api/admin` *(tutor / admin role)*

| Area | Actions |
|---|---|
| **Users** | List all, change role, delete |
| **Courses** | Full CRUD + publish/unpublish |
| **Lessons** | Create / edit / delete / reorder, video & file upload |
| **Quizzes** | Create, bulk JSON question import |
| **Assessments** | Create / grade with per-concept score breakdown |
| **Adaptive Rules** | Define per-concept resource override rules |
| **Analytics** | Platform-wide stats |

---

## 📦 Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `SECRET_KEY` | ✅ | — | Flask session secret |
| `JWT_SECRET_KEY` | ✅ | — | JWT signing key |
| `DATABASE_URL` | ❌ | SQLite | Database URI (use PostgreSQL for prod) |
| `GOOGLE_API_KEY` | ❌ | — | Gemini API key for LLM topic tagging |

---

## ✅ Feature Status

| Feature | Status |
|---|---|
| JWT Auth (register / login / refresh) | ✅ Complete |
| Role-based access (student / tutor / admin) | ✅ Complete |
| Course creation & management | ✅ Complete |
| Rich multi-block lesson content | ✅ Complete |
| Lesson progress tracking | ✅ Complete |
| Timed quiz engine with per-concept tagging | ✅ Complete |
| Bulk JSON question import | ✅ Complete |
| Weighted mastery tracking with recency decay | ✅ Complete |
| CMAB adaptive recommendations (LinUCB) | ✅ Complete |
| Instructor-defined adaptive rule overrides | ✅ Complete |
| File-upload assessments | ✅ Complete |
| Assessment grading with concept breakdown | ✅ Complete |
| Post-grading adaptive recommendations | ✅ Complete |
| Student dashboard (stats, streak, recent activity) | ✅ Complete |
| Progress page (mastery bars, velocity chart) | ✅ Complete |
| Recommendation feedback (helpful / not helpful) | ✅ Complete |
| Experience replay buffer (RL data logging) | ✅ Complete |
| LLM topic tagging (Google Gemini) | ✅ Complete |
| Docker Compose containerisation | ✅ Complete |
| Dark Mode UI | ✅ Complete |
| Full RL model training pipeline | 🔲 Planned |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

This project is developed as an academic submission. All rights reserved.

---

<div align="center">
  Built with ❤️ using Flask · React · LinUCB · Google Gemini
</div>
