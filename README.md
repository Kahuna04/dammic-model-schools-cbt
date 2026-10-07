# Dammic Model Schools - CBT & School Portal

An integrated Computer-Based Testing (CBT) platform and modern web portal for Dammic Model Schools built with Next.js 15, TypeScript, PostgreSQL (Prisma ORM), Tailwind CSS, NextAuth.js, and pnpm.

---

## 🌟 Key Features

### 🔐 Role-Based Access & Dashboards
- **Admin (`/dashboard/admin`)**: User management, exam creation, pre-publish preview, question uploads (Word/Excel import), results export, system statistics.
- **Staff (`/dashboard/staff`)**: Permission-based interface (`can_create_exam`, `can_grade`, `can_manage_students`), exam creation, manual essay grading queue (`/dashboard/staff/grade/[submissionId]`).
- **Student (`/dashboard/student`)**: Available exams, timed testing interface, submission history, results feedback.

### 🛡️ Exam Integrity & Anti-Cheating Controls
- **Full-Screen Enforcement**: Automatic full-screen trigger on exam start. Tracks exits with a 3-warning threshold before auto-submitting.
- **Randomization Engine**: Question order and multiple-choice options are shuffled independently per student.
- **Shortcuts & Security**: Disables dangerous keyboard combinations (`Ctrl+C`, `Ctrl+V`, `Ctrl+P`, `Ctrl+S`) during active test sessions.
- **Smooth UX**: Keyboard arrow navigation (`←` / `→`) and submission confirmation dialogs.

### 🎨 Modular UI Architecture
The dashboard UI relies on reusable component primitives in [`components/dashboard`](./components/dashboard):
- `DashboardHeader`: Unified page topbar with actions and user greeting.
- `StatCard`: Standardized metric cards for user and exam counts.
- `StatusBadge`: Badges for roles (`ADMIN`, `STAFF`, `STUDENT`), exam states, and grading statuses.
- `QuickActionCard`: Dashboard action links with hover animations.
- `SearchFilterBar`: Real-time text search, role filtering, class filtering (`JSS1`–`SSS3`), and status reset controls.
- `DataTable<T>`: Reusable responsive data tables with custom accessors and empty state handling.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router, React 18, TypeScript 5)
- **Package Manager**: `pnpm`
- **Database & ORM**: PostgreSQL + Prisma ORM 6
- **Authentication**: NextAuth.js (Email or Student Admission ID credentials)
- **CMS**: Sanity CMS (`next-sanity`, GROQ, `@portabletext/react`)
- **Document Processing**: `mammoth` (Word/DOCX question extraction) & `xlsx` (Excel export/import)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **pnpm**: Installed globally (`npm install -g pnpm`)
- **PostgreSQL Database**: Local or Cloud instance (Supabase, Railway, Neon)

### 2. Environment Setup
Create a `.env.local` file from `.env.local.example`:

```env
# Database Connection
DATABASE_URL="postgresql://user:password@localhost:5432/dammic_cbt"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-key"

# Sanity CMS (Public Web Portal)
SANITY_PROJECT_ID="your-sanity-project-id"
SANITY_DATASET="production"
SANITY_API_VERSION="2025-01-01"
```

Generate `NEXTAUTH_SECRET` in terminal:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Install & Generate
```bash
# Install dependencies using pnpm
pnpm install

# Generate Prisma Client
pnpm exec prisma generate

# Apply Database Schema
pnpm exec prisma db push

# Start Development Server
pnpm dev
```

---

## 📁 Repository Structure

```
dammic-model-schools-cbt/
├── app/
│   ├── api/                    # NextAuth, Users, Exams, Grading, Export APIs
│   ├── dashboard/
│   │   ├── admin/              # Admin control panel & User Management
│   │   ├── staff/              # Staff portal & Grading suite
│   │   └── student/            # Student portal
│   ├── exam/[examId]/          # Secure exam session interface
│   ├── studio/                 # Sanity CMS Studio
│   └── (public pages)/         # About, Admissions, Academics, Gallery, News
├── components/
│   ├── dashboard/              # Reusable Dashboard UI primitives
│   ├── ConfirmDialog.tsx       # Modal dialog for confirmation
│   ├── ThemeProvider.tsx      # Dark/Light mode context
│   └── NavBar.tsx / Footer.tsx # Public portal navigation
├── lib/
│   ├── auth.ts                 # NextAuth credentials & JWT callbacks
│   └── prisma.ts               # Prisma ORM singleton
├── prisma/
│   └── schema.prisma           # Database schema definition
└── types/                      # TypeScript declarations
```

---

## ⚡ Useful pnpm Scripts

```bash
# Start development server
pnpm dev

# Type check codebase
pnpm typecheck

# Build for production
pnpm build

# Start production server
pnpm start

# Open Prisma Studio GUI
pnpm exec prisma studio
```

---

## 📜 Documentation & References

- **Google Form Setup Guide**: See [`GOOGLE_FORM_SETUP.md`](./GOOGLE_FORM_SETUP.md) for importing Google Form responses into the CBT system.
- **Sanity Studio**: Access at `http://localhost:3000/studio` when running locally.
