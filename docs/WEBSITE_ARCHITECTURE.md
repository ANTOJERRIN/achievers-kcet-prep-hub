# Achievers Club — KCET Prep Hub Website Architecture

## 1. Current Architecture Overview

The current `achievers-kcet-prep-hub` application is a **frontend-first MVP/prototype** built with Vite, React, TypeScript, Tailwind CSS, and shadcn/ui components.

At a high level, the current application follows this flow:

```text
Student
   ↓
Landing Page
   ↓
Registration Form
   ↓
Local React State
   ↓
Dashboard
   ↓
Subject Cards
   ↓
Practice / Notes / Focus Areas
```

The application is currently centered around helping KCET students improve **time management, weak-topic performance, and accuracy**, with a particular emphasis on Physics topics such as Thermodynamics and Waves.

---

## 2. Current Application Structure

```text
Achievers Club — KCET Prep Hub
│
├── App.tsx
│   ├── QueryClientProvider
│   ├── TooltipProvider
│   ├── Toast / Sonner
│   └── React Router
│       ├── "/" → Index
│       └── "*" → NotFound
│
├── Landing / Registration
│   └── pages/Index.tsx
│       ├── Hero Section
│       │   ├── Achievers Club Logo
│       │   ├── KCET value proposition
│       │   ├── 11th & 12th NCERT coverage
│       │   ├── Time management
│       │   ├── Weak-topic identification
│       │   └── Physics / Chemistry / Mathematics focus
│       │
│       ├── RegistrationForm
│       │   ├── Full Name
│       │   ├── Email Address
│       │   └── Phone Number
│       │
│       └── Features Section
│           ├── Targeted Learning
│           ├── Time Optimization
│           └── Accuracy Boost
│
├── Dashboard
│   └── components/Dashboard.tsx
│       ├── Header
│       │   ├── Logo
│       │   ├── Share
│       │   ├── PDF
│       │   └── Student profile
│       │
│       ├── Quick Stats
│       │   ├── Practice Tests
│       │   ├── Concept Notes
│       │   ├── Time Saved
│       │   └── Improvement
│       │
│       ├── Subject Modules
│       │   ├── Physics
│       │   ├── Chemistry
│       │   └── Mathematics
│       │
│       └── Physics Priority Module
│           ├── Thermodynamics
│           └── Waves & Oscillations
│
├── Components
│   ├── RegistrationForm.tsx
│   ├── Dashboard.tsx
│   └── Logo.tsx
│
├── UI Layer
│   └── shadcn/ui components
│
├── Styling
│   ├── App.css
│   ├── index.css
│   └── Tailwind configuration
│
└── Assets
    └── hero-image.jpg
```

---

## 3. Current User Flow

### Landing Experience

The student first reaches a marketing-oriented landing page explaining the core problem:

- Weak topics consume valuable KCET preparation time.
- Students need targeted practice instead of repeatedly studying everything.
- Accuracy and speed are important alongside conceptual understanding.
- Physics receives special attention, especially Thermodynamics and Waves.

The landing page contains a registration card requesting:

1. Full name
2. Email address
3. Phone number

### Registration → Dashboard

After successful form submission, the application stores the submitted user data in **local React state** and switches directly to the dashboard.

```text
RegistrationForm
      ↓
handleRegistrationComplete()
      ↓
setUser(userData)
      ↓
Dashboard
```

There is currently no persistent user account or authentication layer.

---

## 4. Current Dashboard Architecture

The dashboard is divided into four major areas.

### A. Header

Contains:

- Achievers Club logo
- Share button
- PDF button
- Student name
- KCET aspirant label

### B. Quick Statistics

Current hardcoded statistics include:

- Total Practice Tests
- Concept Notes
- Time Saved
- Improvement percentage

These currently represent UI/demo values rather than database-backed student analytics.

### C. Subject Modules

The dashboard exposes three primary subjects:

```text
Physics
Chemistry
Mathematics
```

Each subject currently contains:

- Topic list
- Weak topics
- Practice-test count
- Concept-note count
- Practice button
- Notes button

### D. Physics Priority Area

The dashboard currently highlights:

- Thermodynamics Deep Dive
- Waves & Oscillations

This establishes Physics as a high-priority learning area within the current MVP.

---

## 5. Current Technical Architecture

### Frontend

```text
Vite
  ↓
React + TypeScript
  ↓
React Router
  ↓
Tailwind CSS
  ↓
shadcn/ui
  ↓
Lucide Icons
```

### State Management

The current application mainly uses local React state:

```text
useState()
   ↓
User registration state
Selected subject state
```

TanStack Query is configured at the application level, but the current KCET content and user data are not yet driven by a backend API.

### Validation

The registration form uses:

```text
React Hook Form
        +
Zod schema validation
```

### Routing

The current routing structure is minimal:

```text
/
└── Index

*
└── NotFound
```

---

## 6. Key Architectural Limitations in the Current MVP

The current implementation is suitable as a visual/product prototype, but several areas are intentionally simplified.

### No persistent student accounts

Registration data exists only in the current browser session/application state.

### No authentication

There is no login, signup, session management, passwordless flow, or protected student route.

### No persistent content database

Subjects, topics, practice-test counts, concept notes, and weak-topic examples are currently hardcoded inside the frontend.

### No real assessment engine

The Practice actions are UI placeholders. There is currently no question delivery, answer evaluation, scoring, timing engine, or result calculation.

### No real progress analytics

Dashboard improvement metrics and time-saving values are currently presentation data rather than calculated student analytics.

### No real PDF generation

The PDF action is currently simulated rather than generating a real study-plan document from application data.

### No dedicated learning routes

The application currently has a single functional route. A production learning platform will need separate views for subjects, topics, questions, tests, results, progress, and profile/account management.

---

## 7. Proposed Future Production Architecture

The next architectural stage should separate the platform into distinct product domains rather than keeping learning data inside React components.

```text
                         ACHIEVERS CLUB
                              │
             ┌────────────────┴────────────────┐
             │                                 │
        Public Layer                      Student Layer
             │                                 │
        Landing Page                       Dashboard
        Registration                           │
        About / Features                       ├── Physics
                                               │    ├── Topics
                                               │    ├── Concept Notes
                                               │    ├── Practice
                                               │    └── Tests
                                               │
                                               ├── Chemistry
                                               │
                                               ├── Mathematics
                                               │
                                               ├── Weak Topics
                                               │
                                               ├── Performance
                                               │
                                               ├── Time Management
                                               │
                                               └── Mock Tests
                                                        │
                                                        ▼
                                                Backend / Database
                                                        │
                              ┌─────────────────────────┼─────────────────────────┐
                              │                         │                         │
                           Students                  Content                   Analytics
                              │                         │                         │
                           Profiles                  Subjects                  Attempts
                           Auth                      Topics                    Scores
                           Preferences               Notes                     Accuracy
                                                     Questions                 Time
                                                     Tests                     Progress
```

---

## 8. Recommended Future Domain Model

The backend should eventually separate the following core entities.

### Student

```text
Student
├── id
├── name
├── email
├── phone
├── class / academic year
├── target score / rank
├── preferences
└── created_at
```

### Subject

```text
Subject
├── id
├── name
├── description
└── display_order
```

### Topic

```text
Topic
├── id
├── subject_id
├── name
├── class_level
├── priority
└── description
```

### Concept Note

```text
ConceptNote
├── id
├── topic_id
├── title
├── content / document_url
├── difficulty
└── updated_at
```

### Question

```text
Question
├── id
├── subject_id
├── topic_id
├── question_text
├── options
├── correct_answer
├── explanation
├── difficulty
└── source / year
```

### Test

```text
Test
├── id
├── title
├── type
├── duration
├── subject / topic scope
└── question_ids
```

### Attempt

```text
Attempt
├── id
├── student_id
├── test_id
├── score
├── accuracy
├── time_taken
├── correct_count
├── incorrect_count
├── skipped_count
└── completed_at
```

### Student Topic Progress

```text
TopicProgress
├── student_id
├── topic_id
├── accuracy
├── attempts
├── average_time
├── mastery_score
└── status
```

This entity is what would eventually power a real **Weak Topic Identification** system.

---

## 9. Recommended Future Route Architecture

A production version could evolve from the current single route into something closer to:

```text
/
├── /register
├── /login
│
├── /dashboard
│
├── /subjects
│   ├── /physics
│   │   ├── /thermodynamics
│   │   ├── /waves
│   │   ├── /mechanics
│   │   └── /electricity-magnetism
│   │
│   ├── /chemistry
│   └── /mathematics
│
├── /practice
│   ├── /questions
│   └── /results
│
├── /tests
│   ├── /chapter
│   ├── /subject
│   └── /mock
│
├── /weak-topics
├── /progress
├── /study-plan
└── /profile
```

The final route structure can be simplified or expanded later depending on the actual product requirements.

---

## 10. Recommended Data Flow for the Future

A production assessment flow should eventually look like:

```text
Student
   ↓
Select Subject / Topic
   ↓
Select Practice / Test
   ↓
Question Engine
   ↓
Answer Submission
   ↓
Evaluation Engine
   ↓
Score + Accuracy + Time
   ↓
Attempt Record
   ↓
Progress Analytics
   ↓
Weak Topic Detection
   ↓
Personalized Recommendations
```

This creates the core feedback loop that the current MVP is designed to eventually support.

---

## 11. Core Product Loop

The long-term architecture should revolve around this loop:

```text
ASSESS
  ↓
IDENTIFY WEAKNESS
  ↓
PRACTICE
  ↓
MEASURE PERFORMANCE
  ↓
RECOMMEND NEXT ACTION
  ↓
REASSESS
```

That loop is more important than simply providing a large collection of notes and practice papers.

---

## 12. Current vs Future State

| Area | Current MVP | Future Direction |
|---|---|---|
| Registration | Local form | Persistent student accounts |
| Authentication | None | Auth + protected routes |
| Student Data | React state | Database |
| Subjects | Hardcoded | Database/content system |
| Topics | Hardcoded | Topic/content hierarchy |
| Practice | UI placeholder | Real question engine |
| Tests | UI placeholder | Timed assessment engine |
| Scoring | Not implemented | Automatic evaluation |
| Weak Topics | Hardcoded examples | Analytics-driven |
| Progress | Hardcoded values | Real student metrics |
| Study Plan | Static concept | Personalized plan |
| PDF | Simulated | Real generated document |
| Sharing | Browser share/copy | Shareable student/study links |
| Routing | Minimal | Full student platform routes |
| Backend | Not implemented | API + database |
| Analytics | Not implemented | Attempts, accuracy, time, mastery |

---

## 13. Architecture Status

**Current status:** Frontend MVP / Product Prototype

**Primary strength:** Clear student-facing value proposition and a straightforward dashboard experience.

**Primary limitation:** Learning content, student state, assessment logic, and analytics are not yet separated into persistent backend domains.

**Recommended next architectural milestone:** Introduce a persistent backend/data layer and turn the existing dashboard modules into real subject, topic, practice, assessment, and progress features.

> This document is an architectural review of the current project and a planning reference for future development. It does not represent a completed production architecture.
