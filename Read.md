🎓 UniDemic
Your university life, organized.

UniDemic is an open-source, cross-platform academic productivity and collaboration platform designed to help university students manage their academic life in one place.

Instead of separating schedules, assignments, notes, grades, study sessions, projects, and conversations across multiple applications, UniDemic brings them together into a single student-focused platform.

UniDemic is designed to work across universities and academic systems without depending on a specific institution.

✨ Vision
University life involves much more than attending classes.

Students need to manage:

Courses and schedules

Assignments and deadlines

Exams

Attendance

Grades and GPA

Learning materials

Notes

Study sessions

Group projects

Communication

Academic collaboration

UniDemic aims to become an open-source Student Operating System that connects all of these activities.

Plaintext
UniDemic
│
├── Academic
├── Productivity
├── Learning
├── Collaboration
├── Communication
├── Projects
├── Analytics
└── AI
🚀 Core Features
🏠 Smart Dashboard
The dashboard provides a quick overview of everything important for the student.

It can display:

Next class

Today's schedule

Upcoming assignments

Upcoming exams

Assignment progress

Attendance warnings

Current GPA

Study time

Recent messages

Project updates

Academic recommendations

Example:

Plaintext
Good Morning 👋

Next Class
Data Structures
09:30 - 11:00
Room B203

Upcoming
────────────────────────
Database Assignment   2d
Calculus Quiz         4d
Programming Project   7d

Attendance
Data Structures       87%
Database Systems      92%

Study This Week
8h 42m
📚 Academic Management
Semester Management
Students can organize academic information by semester.

Features:

Create semesters

Set semester start and end dates

Archive previous semesters

Set active semester

View semester statistics

Example:

Plaintext
2026/2027

Semester 1
├── Data Structures
├── Database Systems
├── Calculus
├── Computer Networks
└── Academic English
Course Management
Each course can contain:

Course name

Course code

Lecturer

Credits / SKS

Classroom

Schedule

Materials

Assignments

Exams

Attendance

Grades

Notes

Courses are configurable so UniDemic can support different university systems.

📅 Smart Schedule
Manage recurring university schedules.

Features:

Weekly class schedules

Multiple schedules per course

Room information

Lecturer information

Class replacement

Cancelled classes

Schedule changes

Academic holidays

Schedule conflict detection

Calendar view

Example:

Plaintext
MONDAY

08:00
Computer Networks
Room A302

10:30
Database Systems
Lab 2

13:00
Calculus
Room C104
UniDemic can also notify students before a class begins.

✅ Assignment Manager
Track assignments across courses.

Each assignment can contain:

Title

Course

Description

Deadline

Priority

Estimated workload

Progress

Attachments

Subtasks

Group members

Example:

Plaintext
Database Final Project

Deadline
12 September 2026

Progress
████████░░ 80%

Tasks
✓ Database schema
✓ Authentication
✓ REST API
□ Testing
□ Documentation
📝 Exam Manager
Keep track of upcoming exams.

Features:

Exam schedule

Exam type

Course

Location

Covered topics

Study checklist

Reminder

Exam notes

Exam types may include:

Quiz

Midterm

Final exam

Practical exam

Presentation

📊 Attendance Tracker
Track attendance for each course.

Plaintext
Data Structures

Present      12
Absent        1
Permission    1

Attendance
85.7%
UniDemic can calculate:

Attendance percentage

Minimum attendance requirements

Remaining safe absences

Attendance warnings

Example:

⚠️ Missing another two classes may put you below the required attendance threshold.

🎯 Grade & GPA Tracker
Track academic performance.

Features:

Assignment grades

Quiz grades

Midterm grades

Final exam grades

Custom grading components

Weighted grade calculation

Semester GPA

Cumulative GPA / IPK

Because grading systems differ between universities, grading rules are configurable.

GPA Simulator
Students can simulate possible grades.

Example:

Plaintext
Current GPA
3.54

If:

Database Systems → A
Calculus         → B+
Networking       → A-

Estimated GPA
3.67
This allows students to understand how future results could affect their GPA.

🧠 Productivity
Task Management
UniDemic includes a general task manager for academic and personal study tasks.

Features:

Tasks

Priorities

Deadlines

Labels

Subtasks

Recurring tasks

Progress tracking

🗓️ Smart Study Planner
UniDemic can help distribute study workload across available time.

Example:

Plaintext
Database Project
Estimated Work: 6 hours
Deadline: Friday

Suggested Plan

Tuesday
19:00 - 20:30
Database Project

Wednesday
20:00 - 22:00
Database Project

Thursday
19:00 - 21:30
Database Project
If a new deadline appears, UniDemic can adjust the plan.

⏱️ Focus Sessions
Built-in study timer.

Features:

Focus timer

Pomodoro mode

Custom sessions

Course association

Break reminders

Session history

Example:

Plaintext
FOCUS SESSION

Data Structures

24:37

[ Pause ]

Today
1h 42m
Study sessions contribute to productivity analytics.

🎯 Goals
Students can define goals such as:

Plaintext
Weekly

□ Study 10 hours
□ Finish Database Project
□ Review Calculus Chapter 4
□ Complete 100 flashcards
UniDemic tracks progress automatically where possible.

📖 Learning
Course Materials
Store academic resources in one place.

Supported resources may include:

PDF

PowerPoint

Word documents

Images

Links

Videos

Code files

Materials can be organized using:

Courses

Topics

Tags

Folders

📝 Smart Notes
Create structured academic notes.

Features:

Markdown

Code blocks

Mathematical expressions

Images

Attachments

Tags

Course linking

Note linking

Full-text search

Example:

Plaintext
Database Normalization

# First Normal Form

A relation is in 1NF when...

Related:
→ Database Design
→ Functional Dependencies
→ Second Normal Form
Future versions may support backlinks and a knowledge graph.

🃏 Flashcards
Create flashcards from course materials and notes.

Features:

Decks

Course-based decks

Spaced repetition

Study sessions

Review scheduling

Progress tracking

Example:

Plaintext
Question

What is database normalization?

[ Show Answer ]
🧪 Quiz System
Students can create and complete quizzes.

Supported question types:

Multiple choice

True / False

Short answer

Essay

Coding questions

Quiz results can be used to identify weak topics.

🤖 AI Study Assistant
UniDemic can provide an optional AI-powered study assistant.

Students can ask questions based on their own academic materials.

Example:

Plaintext
Student:

Explain database normalization
based on the lecture PDF.

UniDemic AI:

Based on your Database Systems
material, normalization is...
The system can use Retrieval-Augmented Generation (RAG) to retrieve relevant information from uploaded materials before generating an answer.

AI Quiz Generation
Generate practice questions from:

Lecture notes

PDF materials

Topics

Course content

Example:

Plaintext
Generate Quiz

Source:
Database Week 4.pdf

Difficulty:
Medium

Questions:
10

[ Generate ]
Weak Topic Detection
UniDemic can analyze:

Quiz results

Flashcard performance

Study activity

Course progress

to identify topics that may require additional study.

Example:

Plaintext
Recommended Review

Database Normalization
Confidence: Low

Computer Networks - Subnetting
Confidence: Medium
🛡️ AI Rate Limiting & Cost Management
To protect server operational expenses, prevent compute exhaustion, and ensure equitable access across all users, the AI layer implements strict cost-control measures:

Tiered Rate Limiting: Daily and hourly prompt quotas per user (e.g., maximum 20 RAG queries/day for standard community tiers).

Token Budgeting & Context Windows: Strict truncation and chunking limits during document indexing and prompt assembly to prevent exorbitant inference costs.

Semantic Query Caching: Cached answers for repeated questions across identical course materials, avoiding redundant model inferences via Redis.

Document Upload & Parsing Quotas: Limits on concurrent PDF/document parsing and vector embedding generation per user per week.

Bring Your Own Key (BYOK) Support: Allows power users and self-hosters to supply their own API keys (e.g., OpenAI, Anthropic, Gemini) for unmetered interactions without burdening community servers.

💬 UniDemic Chat
UniDemic includes real-time communication so students do not need to move every academic discussion to another platform.

Direct Messages
Students can communicate privately.

Features:

One-to-one messaging

Real-time messages

Message replies

Reactions

Read status

Typing indicators

File attachments

Images

Academic material sharing

Group Chat
Study groups and project teams can have dedicated chat rooms.

Plaintext
Database Project

Alice
I've finished the schema.

Bob
I'll work on the API tonight.

Charlie
└─ Replying to Bob
I'll handle the API tests.

📎 database-schema.pdf
Course Discussions
Courses can optionally contain discussion channels.

Plaintext
Database Systems

# general
# assignments
# exam-discussion
# resources
This provides a lightweight academic community without attempting to reproduce Discord in its entirety, a fate the database does not deserve.

Contextual Chat
A major goal is to connect conversations with academic objects.

A message can reference:

Plaintext
Assignment
Course
Note
Material
Project
Task
For example:

Plaintext
@Database Final Project

Has everyone finished their part?
Opening the reference can take members directly to the relevant project or assignment.

Chat Attachments
Students can share:

Images

PDFs

Documents

Course materials

Links

Files are stored using object storage rather than directly inside the application server.

👥 Study Groups
Students can create groups independently of their university.

Example:

Plaintext
Web Development Study Group

Members
12

Channels
# general
# frontend
# backend
# resources
Features:

Group membership

Roles

Shared tasks

Shared notes

Shared materials

Discussions

Group chat

Study sessions

This allows collaboration between students from different universities.

🧑‍💻 Project Workspace
Manage university group projects.

Each project can contain:

Plaintext
Project

├── Overview
├── Tasks
├── Kanban
├── Milestones
├── Members
├── Files
├── Notes
├── Chat
└── GitHub
Kanban Board
Example:

Plaintext
TODO            IN PROGRESS       DONE

Authentication  REST API          UI Design
Testing         Database          Research
Documentation
🐙 GitHub Integration
Software-related university projects can connect a GitHub repository.

UniDemic may display:

Commits

Pull requests

Issues

Contributors

Repository activity

Releases

Example:

Plaintext
CodeHelm

Recent Activity

rekis
feat: implement authentication

alice
fix: validation issue

Pull Requests
#42 Add project dashboard
Contribution should not be judged solely from commit count, since turning software engineering into a leaderboard of git commit frequency would produce exactly the behavior one would expect.

🤝 Cross-University Collaboration
UniDemic is not tied to a specific university.

Students from different institutions can:

Create study groups

Collaborate on projects

Share notes

Share learning materials

Discuss academic topics

Create shared study sessions

University-specific academic rules remain configurable per user.

📈 Academic Analytics
UniDemic provides insights into academic activity.

Examples:

Plaintext
Study Time

This Week
8h 42m

Most Studied
Database Systems
3h 21m
Other analytics may include:

Study time

Course performance

Assignment completion

GPA trends

Attendance

Quiz performance

Flashcard performance

Productivity trends

Weak topics

🔔 Smart Notifications
Notifications can be generated for:

Upcoming classes

Assignment deadlines

Exams

Attendance warnings

Study plans

Group activity

Project updates

New messages

Mentions

Replies

Example:

Plaintext
UniDemic

Database assignment
is due tomorrow at 23:59.
📱 Cross-Platform
UniDemic is designed primarily as a mobile application.

Supported targets:

Android

iOS

A web companion may be developed for activities better suited to larger screens, including:

Long-form notes

Analytics

Semester setup

Project management

File management

🌐 Offline Support
Important academic information should remain accessible without an internet connection.

Planned offline support includes:

Schedule

Courses

Assignments

Tasks

Notes

Recently accessed materials

Changes can be synchronized when connectivity returns.

Real-time features such as chat naturally require network connectivity for synchronization.

🏗️ Architecture
UniDemic follows a client-server architecture.

Plaintext
              UniDemic

       ┌─────────────────┐
       │ React Native    │
       │ Expo            │
       │ TypeScript      │
       └────────┬────────┘
                │
              HTTPS
                │
       ┌────────▼────────┐
       │ Laravel API     │
       └────────┬────────┘
                │
     ┌──────────┼───────────┐
     │          │           │
     ▼          ▼           ▼
PostgreSQL    Redis    Object Storage
     │
     │
     └────── AI / Vector Search (Quota & Rate-Limited)

Additional Services
────────────────────────
Push Notifications
Real-time Communication
Monitoring
Background Workers
AI Gateway & Quota Manager
🧰 Technology Stack
Mobile
React Native

Expo

TypeScript

Expo Router

TanStack Query

Zustand

React Hook Form

Zod

SQLite

Backend
Laravel

REST API

Laravel Sanctum

Queue Workers

Rate Limiting Middleware (Throttle & Quota Enforcer)

Database
PostgreSQL

Future AI features may use PostgreSQL with pgvector.

Cache & Queue
Redis (Job queues, rate limit counters, response caching)

Storage
S3-compatible or cloud object storage.

Real-Time
Real-time infrastructure can power:

Chat

Typing indicators

Presence

Project updates

Notifications

The exact provider or WebSocket implementation can remain replaceable to avoid tightly coupling UniDemic to a single vendor.

Infrastructure
Docker

GitHub Actions

GitHub Releases

Cloud deployment

Automated testing

🗂️ Repository Structure
Plaintext
unidemic/
│
├── apps/
│   │
│   ├── mobile/
│   │   └── React Native / Expo
│   │
│   ├── web/
│   │   └── Next.js
│   │
│   └── api/
│       └── Laravel
│
├── packages/
│   ├── types/
│   ├── validation/
│   ├── api-client/
│   └── config/
│
├── docs/
│   ├── architecture/
│   ├── api/
│   └── development/
│
├── infrastructure/
│
├── .github/
│   └── workflows/
│
├── CONTRIBUTING.md
├── LICENSE
└── README.md
🌍 Environments
UniDemic uses separate environments.

Plaintext
Local Development
        │
        ▼
Laravel + PostgreSQL
Docker / Local Environment

        │
        ▼

Staging
        │
        ▼
Shared API + Shared Database

        │
        ▼

Production
        │
        ▼
Production API + Production Database
Local databases use Laravel migrations, factories, and seeders so every contributor can reproduce the same development environment.

🛣️ Development Roadmap
Phase 1 — Foundation
Project architecture

Authentication

User profiles

Local development environment

CI/CD

Database migrations

API foundation

Phase 2 — Academic Core
Semester management

Courses

Schedule

Assignments

Exams

Dashboard

Phase 3 — Academic Tracking
Attendance

Grades

GPA calculation

GPA simulator

Academic statistics

Phase 4 — Productivity
Task manager

Study planner

Focus sessions

Goals

Calendar

Notifications

Phase 5 — Learning
Course materials

Notes

Flashcards

Quiz system

Search

Phase 6 — Communication
Direct messages

Group chat

Course discussions

Message replies

Reactions

Attachments

Mentions

Read receipts

Push notifications

Phase 7 — Collaboration
Study groups

Shared materials

Shared notes

Project workspace

Kanban

Team tasks

GitHub integration

Phase 8 — Intelligence
AI Study Assistant

RAG & Vector Search

AI Quiz Generation

Weak-Topic Detection

AI Rate Limiting & Quota Management

Cost Optimization & Response Caching

Study Recommendations

Deadline Risk Prediction

Phase 9 — Web Companion
Web dashboard

Advanced analytics

Project management

Long-form notes

File management

🧩 Design Principles
University Agnostic
UniDemic must not depend on one university's academic system.

Things such as:

Credit systems

Grade scales

Attendance requirements

Semester structures

should be configurable.

Mobile First
Most everyday interactions should be convenient from a phone.

Offline Friendly
Core academic information should remain useful when connectivity is unavailable.

Privacy First
Academic materials, grades, conversations, and personal data should be private by default.

Resource & Cost Sustainable
Infrastructure demands—especially computationally expensive AI operations—are protected by sensible rate limits, query caching, and token budgets to prevent operational budget hemorrhage.

Modular
Major features should remain logically separated so UniDemic can evolve without becoming an unmaintainable monolith.

Open Source
UniDemic should remain accessible for students and contributors who want to learn, improve, and build useful academic technology together.

🔐 Security
UniDemic should follow secure development practices including:

Secure authentication

Password hashing

Token management

API authorization

Role and permission checks

Input validation

Rate limiting (API endpoints and AI inference pipelines)

Secure file uploads

Private object storage

Signed file URLs

Encrypted HTTPS communication

Environment-based secret management

Sensitive credentials must never be embedded inside the mobile application or committed to Git.

🤝 Contributing
UniDemic welcomes contributions from students and developers.

Possible contribution areas include:

Mobile development

Backend development

Web development

UI/UX

DevOps

Testing

AI & Cost Optimization

Documentation

Security

Accessibility

A detailed contribution guide will be available in CONTRIBUTING.md.

📌 Project Status
🚧 Early Development

UniDemic is currently being designed and developed.

APIs, database structures, architecture, and features may change significantly before the first stable release.

📄 License
UniDemic is an open-source project.

The final open-source license will be defined before the first public release.

🎓 UniDemic
One platform for your academic life.

Plan your semester.
Manage your work.
Study smarter.
Collaborate with others.
Stay connected.