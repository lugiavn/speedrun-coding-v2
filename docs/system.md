# Speedrun Coding v2

**Project information:**  
Speedrun Coding v2 is a LeetCode–style web app where the primary emphasis is on coding speed, helping users improve not just correctness but also how quickly they can solve problems under timed conditions.

## Guiding Principles for MVP

Minimal moving parts: one monolithic backend service + one frontend app + one sandbox.

Re-use where it helps: leverage Django’s built-in Admin for problem CRUD.

Local first: everything runs under Docker Compose; no cloud dependencies required.

Focus on speed metrics: surface only “time to solve” at first—deep analytics can come later.


## Feature Guide

### Core MVP Features

1. **Problem Management**
   - Browsing (both admin and user): Simple list / filter by tag/difficulty.
   - Admin UI: CRUD on problems.
   - Problem metadata: title, description (rendered from markdown), difficulty tag + free-form tags, free-form time grading thresholds (if smaller than "x", then grade is "y"), example solution, test cases.
   - For MVP, we add 2 problems: quicksort and binarysearch.


2. **In-Browser Code Editor**
   - Code editor with syntax highlighting, autocomplete, linting  
   - Support **Python** & **C++** initially for MVP.
   - Layout: Two panes: problem statement + editor. Resizable panes, theme switch (light/dark)
   - Timer: countdown timer, display warning when time expires (the user can still work on the problem).


3. **Code Execution & Testing**
   - The user can submit their work for judging.
   - Integrate a code execution engine (or self-hosted sandbox) for secure execution.
   - Result UI: display per-test pass/fail, execution time, memory usage. And aslo: overall speed “grade” by comparing against predefined thresholds (if smaller than "x", then grade is "y").

4. **User Accounts & Progress**
   - Registration (username, email, password) and login.
   - Profile: “My Statistics” dashboard (solve count, charts for solve times)

###  Phase 2 / Nice-to-Have Features

1. Support more languages (Javascript, Java)

2. **Interaction Logging & Analytics**
   - Track editor interation events (clicks, keystroke, pauses, focus/blur); Store events in a time-series/analytics DB for later analysis of user coding speed (very important).
   - Realtime: Socket.io (or Pusher)
   - Analytics: Segment → ClickHouse/InfluxDB
   - Task queue: more sophticated


## High-Level Architecture

```
[User’s Browser]
   ├─ Next.js SPA (Monaco, SWR)
   │      ↕ JWT-auth REST
   └─ WebSocket (future)
         ↓
[Backend Service]
(Django + DRF + SimpleJWT)
   ├─ /api/problems
   ├─ /api/submissions → (code execution engine)
   ├─ /api/users
   └─ Django Admin UI
   ↓
[Database]         [Code execution engine Docker Container]
(problems, users)   (code sandbox API)
```

Docker Compose brings up four services:
- frontend (Next.js)
- backend (Django / Gunicorn)
- database
- Code execution engine (self-hosted sandbox)

## Technology Stack

Frontend: Next.js 14, React 18, TypeScript, SWR/React Query, Monaco Editor

Styling: Tailwind CSS

Backend: Python 3.11, Django 4.x, Django REST Framework

Auth: Django Auth + SimpleJWT

Database: PostgreSQL

Execution Engine: Piston or Judge0 (self-hosted via Docker)

Task queue: None

Code management: GitHub 

Containerization: Docker Compose (frontend, backend, database, code execution engine)

