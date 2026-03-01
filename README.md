# ALPS — Adaptive Learning Platform System

An intelligent, full-stack e-learning platform with adaptive recommendations, quiz-based assessments, course management, and a real-time admin monitoring panel.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Backend — Flask API](#backend--flask-api)
   - [App Factory & Configuration](#app-factory--configuration)
   - [Models](#models)
   - [Routes (API Endpoints)](#routes-api-endpoints)
   - [Services (Business Logic)](#services-business-logic)
6. [Frontend — React App](#frontend--react-app)
   - [Routing & Auth Guards](#routing--auth-guards)
   - [Pages](#pages)
   - [Components](#components)
   - [Services (API Layer)](#services-api-layer)
   - [Stores (State Management)](#stores-state-management)
7. [Docker Setup](#docker-setup)
8. [Database Schema Summary](#database-schema-summary)
9. [Key Features Implemented](#key-features-implemented)

---

## Project Overview

ALPS is a full-stack adaptive learning platform built for students, tutors, and admins. Students can browse and enroll in courses, watch lessons, take quizzes, and receive AI-driven recommendations powered by a **Contextual Multi-Armed Bandit (CMAB)** engine.

The adaptive layer works by analyzing quiz performance at a **concept level** (e.g., "Functions", "Loops", "Variables") and building a dynamic Context Vector ($x_t$). The CMAB engine tracks mastery over time with a weighted decay system, and generates personalized learning recommendations based on the student's historical success rates across similar topics.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3, Flask 3.0, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-Migrate, Flask-CORS, Flask-Marshmallow |
| Database | SQLite (dev) / PostgreSQL (prod via `psycopg2`) |
| ML / Analytics | NumPy, Pandas, Scikit-learn, NetworkX |
| Frontend | React 18, Vite, React Router v6, Zustand, Axios, TailwindCSS |
| UI Libraries | Recharts (charts), Lucide React (icons), React Hot Toast (notifications), React Hook Form |
| Containerization | Docker + Docker Compose |

---

## Project Structure

```
Project-1/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory
│   │   ├── models/              # SQLAlchemy ORM models
│   │   ├── routes/              # Flask Blueprint API routes
│   │   ├── services/            # Business logic (adaptive engine, mastery tracking)
│   │   └── utils/               # Helper utilities
│   ├── config.py                # Environment configuration classes
│   ├── run.py                   # Entry point
│   ├── requirements.txt         # Python dependencies
│   ├── migrations/              # Flask-Migrate database migrations
│   └── uploads/                 # Uploaded files (videos, docs, images)
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx              # Root router with route guards
│   │   ├── main.jsx             # React entry point
│   │   ├── index.css            # Global styles (Tailwind + custom tokens)
│   │   ├── pages/               # Full-page components (routes)
│   │   │   ├── auth/            # Login, Register
│   │   │   ├── courses/         # CourseList, CourseDetail
│   │   │   ├── quiz/            # Quiz, QuizResult
│   │   │   ├── admin/           # AdminDashboard, CourseManager, CreateCourse, EditCourse, UserManagement, AssessmentManager
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Progress.jsx
│   │   │   ├── Recommendations.jsx
│   │   │   ├── MyAssessments.jsx
│   │   │   └── Profile.jsx
│   │   ├── components/
│   │   │   ├── layout/          # MainLayout, AuthLayout, Navbar, Sidebar
│   │   │   └── ui/              # Reusable UI components (Badge, Card, etc.)
│   │   ├── services/            # Axios wrappers for each API domain
│   │   ├── stores/              # Zustand global state stores
│   │   ├── contexts/            # React Context providers
│   │   └── utils/               # Helper functions
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
└── docker-compose.yml
```

---

## Getting Started

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Set up environment variables (copy .env.example to .env and fill in values)
# Minimum required: SECRET_KEY, JWT_SECRET_KEY

# Run migrations
flask db upgrade

# Start the development server
python run.py
# Server runs on http://localhost:5000
```

### Frontend

```bash
cd frontend

npm install
npm run dev
# App runs on http://localhost:5173
```

### Environment Variables (backend `.env`)

| Variable | Description |
|---|---|
| `SECRET_KEY` | Flask session secret key |
| `JWT_SECRET_KEY` | JWT signing key |
| `DATABASE_URL` | Database URI (defaults to local SQLite) |

---

## Backend — Flask API

### App Factory & Configuration

**`app/__init__.py`** — The Flask application factory (`create_app()`). Initializes all extensions:
- `SQLAlchemy` — ORM for database interaction
- `Flask-Migrate` — handles database schema migrations
- `JWTManager` — issues and validates JSON Web Tokens for auth
- `Marshmallow` — object serialization/deserialization
- `Flask-CORS` — allows requests from the React frontend (`*` origins in dev)

JWT error handlers are registered here for clean error responses (expired / invalid / missing token).

Also serves uploaded files at `/api/uploads/<folder>/<filename>`.

**`config.py`** — Three config classes:
- `DevelopmentConfig` — SQLite, debug mode on
- `ProductionConfig` — PostgreSQL via `DATABASE_URL`, debug off
- `TestingConfig` — In-memory SQLite

File upload limits: 500 MB max. Allowed types: videos (mp4, webm, mov, avi), documents (pdf, doc, docx, ppt, pptx, zip, txt), images (png, jpg, jpeg, gif, webp).

---

### Models

All models live in `app/models/` and are SQLAlchemy ORM classes. Each has a `to_dict()` method for JSON serialization.

---

#### `User` (`app/models/user.py`)

The core user account. Has three roles: `student`, `tutor`, `admin`.

| Field | Description |
|---|---|
| `id` | Primary key |
| `name`, `email` | Basic identity |
| `password_hash` | Bcrypt-hashed password via Werkzeug |
| `bio`, `avatar_url` | Profile info |
| `role` | `student` / `tutor` / `admin` |

Helper methods: `set_password()`, `check_password()`, `is_admin()`, `is_tutor()`.

**Relationships:** enrollments, quiz submissions, recommendations, learning_logs.

---

#### `Course`, `Lesson`, `Enrollment`, `LessonProgress` (`app/models/course.py`)

The backbone of the learning content.

**`Course`** — A full course with title, description, category, level (Beginner/Intermediate/Advanced), duration, pricing, rating, and a thumbnail/preview video URL. Has a published/unpublished flag.

**`Lesson`** — Individual lessons within a course, ordered by `order`. Types: `video`, `text`, or `file`. Stores `video_url`, `file_url`, and `file_name` for uploaded resources. `is_free` flag allows preview without enrollment. Also contains a `topics` JSON array used to define its feature vector for the CMAB engine.

**`Enrollment`** — Junction table between users and courses. Tracks `progress` (0–100%), `status` (active/completed/dropped), and access timestamps.

**`LessonProgress`** — Tracks whether a specific user has completed a specific lesson. Also records `watch_time` in seconds.

---

#### `Quiz`, `Question`, `Submission`, `Answer` (`app/models/quiz.py`)

The quiz system for auto-graded assessments.

**`Quiz`** — Belongs to a course. Has a `time_limit` (minutes) and `passing_score` threshold (0.0–1.0, default 60%).

**`Question`** — Multiple-choice questions with:
- `options` stored as a JSON array
- `correct_answer` string
- `concept` and `subconcept` tags (used for adaptive recommendations)
- `difficulty` level (easy/medium/hard)
- `explanation` revealed after submission

**`Submission`** — A student's quiz attempt. Stores `score`, `total_questions`, `correct_answers`, and `time_taken`. Linked to individual `Answer` records.

**`Answer`** — The student's response to each question. Records `selected_answer`, `is_correct`, and `time_spent` per question. Used by the adaptive engine to analyze concept-level performance and update the student's Context Vector.

*(Note: File-upload Assessments have been intentionally disabled by faculty requirement to focus exclusively on the CMAB quiz implementation).*

---

#### `Recommendation` (`app/models/recommendation.py`)

Stores learning resource suggestions generated for a student after a quiz or assessment.

| Field | Description |
|---|---|
| `concept` | The topic that needs attention |
| `reason` | Human-readable explanation |
| `priority` | `high` / `medium` / `low` |
| `resource_type` | `video` / `article` / `practice` |
| `resource_title`, `resource_url` | The recommended content |
| `estimated_time` | How long to complete (e.g., "15 mins") |
| `status` | `active` / `completed` / `dismissed` |
| `user_rating` | `1` (helpful) or `-1` (not helpful) — feedback for future RL |

---

#### `AdaptiveRule` (`app/models/adaptive.py`)

Instructor-defined rules that override the engine's default resource selection. When a student scores below a `threshold` on a `concept`, this rule specifies exactly which resource to recommend — giving tutors fine-grained control over the adaptive system.

---

#### `LearningLog` (`app/models/learning_log.py`)

The **experience replay buffer** for the future Reinforcement Learning module. Every time the adaptive engine makes a recommendation, it logs:
- `state` — Snapshot of the student's mastery levels (JSON)
- `action_type` and `action_id` — What recommendation was given
- `immediate_outcome`, `delayed_outcome`, `engagement_score` — Reward signals (to be filled in over time)
- `next_state` — Updated mastery after the student acts on the recommendation

This table accumulates rich interaction data that can be used to train a Deep Q-Network (DQN) or similar RL model in the future.

---

#### `Resource` (`app/models/resource.py`)

A catalog of learning resources (videos, articles) that the adaptive engine can pull from when generating recommendations. Tagged with `concepts` (JSON list) and `difficulty`.

---

### Routes (API Endpoints)

All routes are registered with `/api/` prefixes.

---

#### Auth — `/api/auth` (`routes/auth.py`)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create a new student account |
| POST | `/api/auth/login` | Log in, receive JWT access token |
| GET | `/api/auth/me` | Get current user profile (JWT required) |
| PUT | `/api/auth/profile` | Update name/bio/avatar |
| POST | `/api/auth/change-password` | Change password (verifies old password) |

---

#### Courses — `/api/courses` (`routes/courses.py`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/courses` | List all published courses |
| GET | `/api/courses/:id` | Course detail with lessons/quizzes |
| POST | `/api/courses/:id/enroll` | Enroll in a course |
| POST | `/api/courses/:id/lessons/:lessonId/complete` | Mark lesson complete |
| GET | `/api/courses/:id/progress` | Get enrollment progress for user |

---

#### Quizzes — `/api` (`routes/quizzes.py`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/courses/:id/quizzes` | List quizzes for a course |
| GET | `/api/quizzes/:id` | Get quiz with questions (answers hidden) |
| POST | `/api/quizzes/:id/submit` | Submit quiz answers, get score + recommendations |
| GET | `/api/quizzes/:id/result/:submissionId` | Get full submission result with answer breakdown |

The submit endpoint automatically calls the `AdaptiveEngine` to generate concept-level recommendations based on which questions were answered correctly/incorrectly.

---

#### Assessments — `/api` (`routes/assessments.py`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/courses/:id/assessments` | List assessments for a course |
| POST | `/api/assessments/:id/submit` | Submit assessment (file upload) |
| GET | `/api/my-assessments` | Student's submitted assessments |

---

#### Progress — `/api/progress` (`routes/progress.py`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/progress/dashboard` | Aggregated stats: courses, quizzes, streak, mastery |
| GET | `/api/progress/mastery` | Per-concept mastery scores |
| GET | `/api/progress/quiz-history` | All past quiz submissions |
| GET | `/api/progress/learning-velocity` | Improvement rate over recent days |
| GET | `/api/progress/streak` | Daily learning streak (quiz + lesson + assessment activity) |

---

#### Recommendations — `/api/recommendations` (`routes/recommendations.py`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/recommendations` | Get active recommendations for current user |
| PUT | `/api/recommendations/:id/status` | Update status (complete/dismiss) |
| POST | `/api/recommendations/:id/feedback` | Submit helpful/not-helpful rating |

---

#### Admin — `/api/admin` (`routes/admin.py`)

Protected by `tutor` or `admin` role. Covers:

| Area | Available Actions |
|---|---|
| **Users** | List all users, change roles, delete users |
| **Courses** | Full CRUD (create, read, update, delete) |
| **Lessons** | Create/edit/delete/reorder lessons, upload video/file |
| **Quizzes** | Create quizzes, bulk-create questions (JSON import) |
| **Assessments** | Create/edit assessments, view all submissions, **grade** with score + feedback + concept breakdown |
| **Adaptive Rules** | Create/read/delete per-course adaptive rules for concept-based resource overrides |
| **Analytics** | Platform stats (user counts, enrollment counts, average scores) |

---

### Services (Business Logic)

#### `Contextual Bandit Engine` (`app/services/rl_agent.py`)

The core brain of the recommendation system utilizing a Contextual Multi-Armed Bandit (CMAB) architecture (LinUCB algorithm).

**How it works:**

1. **Context Vector Generation ($x_t$)** — Analyzes the student's current mastery levels across all topics (e.g., Pandas, DNS, Variables).
2. **Action Selection (Upper Confidence Bound)** — Evaluates candidate resources (lessons/quizzes) by predicting their expected reward $E[r_{t,a} \| x_{t}]$, factoring in both the historical success of the resource for similar students and an exploration bonus $\alpha \sqrt{x_t^T A_a^{-1} x_t}$.
3. **Reward Signal Collection** — When a student interacts with a recommended resource and subsequently takes a related quiz, the engine calculates a reward $r_t$ based on score improvement.
4. **Model Update** — The matrix $A_a$ and vector $b_a$ for the chosen action are updated online, continuously improving the bandit's future predictions.

Also supports `AdaptiveRule` instructor overrides that function as a bypass to the RL engine for specific struggling concepts.

Also supports `generate_recommendations_from_assessment()` which works the same way but reads `concept_scores` from the assessment grading form instead of quiz answers.

**Concept dependency graph (built-in):**
```
Variables → Functions, Loops, Arrays, Objects
Functions → Arrays (via Loops), Objects, Async, Closures
Objects   → Async, Closures
```

---

#### `MasteryTracker` (`app/services/mastery_tracker.py`)

Calculates a student's per-concept mastery score from their full answer history using a **weighted decay model**:

- Starts each concept at a baseline mastery of `0.5`
- Each correct answer adds `+0.15 × recency_weight × difficulty_weight`
- Each incorrect answer adds `-0.20 × recency_weight × difficulty_weight`
- **Recency decay** — older answers contribute less (0.9× per week elapsed)
- **Difficulty weight** — hard questions worth 1.2×, easy worth 0.8×
- **Prerequisite capping** — a concept's mastery is capped at 1.2× its weakest prerequisite's mastery

Also provides:
- `get_learning_velocity()` — linear regression over recent submission scores to measure improvement rate
- `identify_weak_concepts()` — returns all concepts below a configurable threshold (default 60%)

---

## Frontend — React App

Built with **React 18** + **Vite**, styled with **TailwindCSS**, state managed with **Zustand**.

---

### Routing & Auth Guards

**`App.jsx`** defines all routes and wraps them in three route guard components:

- **`ProtectedRoute`** — redirects unauthenticated users to `/login`
- **`AdminRoute`** — additionally checks `role === 'admin' || 'tutor'`; redirects other users to `/dashboard`
- **`PublicRoute`** — redirects already-authenticated users to `/dashboard` (prevents revisiting login)

All guards wait for Zustand's `hasHydrated` flag (indicating local storage has been rehydrated) before rendering, avoiding flash-of-redirect bugs.

---

### Pages

#### Auth Pages (`pages/auth/`)

**`Login.jsx`** — Email/password login form using React Hook Form. On success, stores JWT + user in Zustand and redirects based on role (`/admin` for tutors/admins, `/dashboard` for students).

**`Register.jsx`** — Registration form with name, email, password, and confirm-password fields. Auto-logs in after successful registration.

---

#### Student Pages

**`Dashboard.jsx`** (`pages/Dashboard.jsx`) — The student home screen. Shows:
- Welcome banner with user name and streak
- Stats cards: courses enrolled, quizzes completed, average score, current streak
- Active recommendations panel (top 3 by priority)
- Recently accessed courses with progress bars
- Recent quiz activity feed

**`CourseList.jsx`** (`pages/courses/CourseList.jsx`) — Browsable course catalog with search, category filter, and level filter. Shows course cards with enrollment status.

**`CourseDetail.jsx`** (`pages/courses/CourseDetail.jsx`) — Full course page with:
- Course info, instructor, and stats
- Lesson list (locked for non-enrolled users except free preview lessons)
- Quiz list with pass/fail status if previously attempted
- Assessments list with submission status
- Enroll button for non-enrolled students

**`Quiz.jsx`** (`pages/quiz/Quiz.jsx`) — Interactive quiz player with:
- One question at a time display
- Per-question timer tracking
- Answer selection and navigation
- Auto-submit on time limit expiry
- Submission to backend via `quizService`

**`QuizResult.jsx`** (`pages/quiz/QuizResult.jsx`) — Post-quiz results page showing:
- Score, pass/fail status, time taken
- Question-by-question breakdown (your answer vs correct answer, explanation)
- Concept performance breakdown bars
- Recommended resources for weak concepts

**`Progress.jsx`** (`pages/Progress.jsx`) — Analytics dashboard showing:
- Concept mastery scores (progress bars)
- Learning velocity trend chart (Recharts line graph)
- Quiz history table
- Streak history

**`Recommendations.jsx`** (`pages/Recommendations.jsx`) — Dedicated recommendations page. Students can:
- Filter by priority / status
- Mark recommendations as completed or dismissed
- Rate recommendations as helpful or not helpful

**`MyAssessments.jsx`** (`pages/MyAssessments.jsx`) — Lists all courses the student is enrolled in and their assessment submission statuses (pending, submitted, graded). Shows grades and feedback when available.

**`Profile.jsx`** (`pages/Profile.jsx`) — User profile page for editing name, bio, avatar URL, and changing password. Also shows account stats and streak.

---

#### Admin Pages (`pages/admin/`)

**`AdminDashboard.jsx`** — Platform overview with aggregate stats: total users, active courses, total enrollments, assessments pending grading. Provides quick-access links to management sections.

**`CourseManager.jsx`** — List of all courses (including unpublished). Create, edit, or delete. Shows enrollment counts per course.

**`CreateCourse.jsx`** — Multi-step form to create a course with title, description, category, level, thumbnail URL, and preview video URL.

**`EditCourse.jsx`** — The most feature-rich admin page. Full course editor with tabbed sections:
- **Course Info** — Edit metadata
- **Lessons** — Add/edit/delete/reorder lessons. Upload video files or enter URLs. Upload supplemental file attachments. Set lesson type (video/text/file).
- **Quizzes** — Create quizzes. Add questions one by one or paste a JSON array for bulk import. Tag each question with concept/subconcept/difficulty.
- **Assessments** — Create/edit open-ended assignments with due dates, instructions, file type restrictions.
- **Adaptive Rules** — Define per-concept resource recommendations that override the engine's defaults.

**`UserManagement.jsx`** — List all registered users. Change a user's role (student ↔ tutor ↔ admin). Delete users.

**`AssessmentManager.jsx`** — Grade a specific assessment submission. Download the submitted file, enter a numeric score, per-concept score breakdown (used for adaptive recommendations), and written feedback. Submit grade to update student's record and trigger recommendations.

---

### Components

#### Layout (`components/layout/`)

- **`MainLayout.jsx`** — The shell for authenticated pages: sidebar + top navbar + main content area
- **`AuthLayout.jsx`** — Centered card layout used for Login and Register pages
- **`Navbar.jsx`** — Top bar with user avatar, notifications, and logout
- **`Sidebar.jsx`** — Navigation sidebar with links that change based on user role (admin links shown only to tutors/admins)

#### UI Components (`components/ui/`)

Reusable primitive components: `Badge`, `Card`, `Button`, progress bars, stat cards, etc. — all built with Tailwind utility classes.

---

### Services (API Layer)

All API calls are made via Axios. The base `api.js` configures the Axios instance with:
- `baseURL` pointing to the backend (default: `http://localhost:5000/api`)
- A request interceptor that automatically attaches the JWT from Zustand's auth store to every request
- A response interceptor that catches 401 errors and triggers logout

| Service File | Covers |
|---|---|
| `authService.js` | login, register, getMe, updateProfile, changePassword |
| `courseService.js` | getCourses, getCourse, enroll, completeLesson |
| `quizService.js` | getQuiz, submitQuiz, getResult |
| `progressService.js` | getDashboard, getMastery, getQuizHistory, getStreak |
| `recommendationService.js` | getRecommendations, updateStatus, submitFeedback |
| `adminService.js` | All admin CRUD operations (users, courses, lessons, quizzes, assessments, grading, adaptive rules) |

---

### Stores (State Management)

Global state is managed with **Zustand** (a lightweight alternative to Redux). Each store persists relevant data to `localStorage` for session persistence.

| Store | Manages |
|---|---|
| `authStore.js` | `user` object, `token`, `isAuthenticated`, `hasHydrated`. Provides `login()`, `logout()`, `updateUser()` actions. |
| `courseStore.js` | Fetched course list and selected course detail. Avoids re-fetching on navigation. |
| `quizStore.js` | Active quiz state: current question index, selected answers, timer, submission result. Resets on new quiz start. |
| `progressStore.js` | Dashboard stats, mastery scores, streak data fetched from the progress API. |
| `recommendationStore.js` | Active recommendations list, filtering state, optimistic status updates. |

---

## Docker Setup

`docker-compose.yml` defines two services:

- **`backend`** — Flask API, built from `backend/Dockerfile`, exposed on port `5000`
- **`frontend`** — React app, built from `frontend/Dockerfile`, exposed on port `80`

```bash
# Start everything
docker compose up --build

# Stop
docker compose down
```

---

## Database Schema Summary

```
users
  └─< enrollments >─ courses
  └─< submissions >─ quizzes ─< questions
                                └─< answers
  └─< assessment_submissions >─ assessments ─ courses
  └─< recommendations
  └─< learning_logs

courses
  └─< lessons
     └─< lesson_progress >─ users
  └─< quizzes
  └─< assessments
  └─< adaptive_rules
```

---

## Key Features Implemented

| Feature | Status |
|---|---|
| JWT Authentication (register/login/refresh) | ✅ Done |
| Role-based access (student / tutor / admin) | ✅ Done |
| Course creation & management (admin) | ✅ Done |
| Lesson upload (video + file attachments) | ✅ Done |
| Lesson progress tracking | ✅ Done |
| Quiz authoring with bulk JSON import | ✅ Done |
| Auto-graded quiz engine | ✅ Done |
| Concept-level performance tagging | ✅ Done |
| Weighted mastery tracking with recency decay | ✅ Done |
| Adaptive recommendations (rule-based engine) | ✅ Done |
| Instructor-defined adaptive rules | ✅ Done |
| File-upload assessments | ✅ Done |
| Assessment grading with concept breakdown | ✅ Done |
| Post-grading adaptive recommendations | ✅ Done |
| Student dashboard with stats & streak | ✅ Done |
| Progress page with mastery bars & charts | ✅ Done |
| Recommendation feedback (helpful / not helpful) | ✅ Done |
| RL data logging (experience replay buffer) | ✅ Done |
| Docker containerization | ✅ Done |
| Reinforcement Learning model training | 🔲 Planned |
