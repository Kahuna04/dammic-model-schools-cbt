# Dammic Model Schools CBT System

This is an extension of the Dammic Model Schools website that adds Computer-Based Testing (CBT) functionality with role-based access for Admin, Staff, and Students.

## Features

### User Roles
- **Admin**: Full system access, user management, exam creation and management
- **Staff**: Exam creation, student monitoring, grading
- **Student**: Take exams, view results

### Core Functionality
- ✅ User authentication and authorization (NextAuth.js)
- ✅ Role-based dashboards
- ✅ Exam creation with multiple question types
- ✅ Computer-based testing with timer
- ✅ Auto-save and auto-submit
- ✅ Automatic grading for objective questions
- ✅ Results and analytics
- ✅ Student progress tracking

## Tech Stack

- **Framework**: Next.js 15 + TypeScript
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **CMS**: Sanity (for public website content)

## Database Schema

### Models
1. **User** - Admin, Staff, and Student accounts
2. **Exam** - Exam metadata (title, duration, marks, etc.)
3. **Question** - Question bank with multiple types
4. **Submission** - Student exam submissions
5. **Answer** - Individual question answers

## Setup Instructions

### 1. Prerequisites
- Node.js (LTS version)
- PostgreSQL database

### 2. Database Setup

#### Option A: Local PostgreSQL
1. Install PostgreSQL on your machine
2. Create a database:
   ```bash
   createdb dammic_cbt
   ```
3. Update `DATABASE_URL` in `.env.local`:
   ```
   DATABASE_URL="postgresql://username:password@localhost:5432/dammic_cbt"
   ```

#### Option B: Cloud Database (Recommended)
Use a free PostgreSQL hosting service:
- **Supabase**: https://supabase.com (Free tier available)
- **Vercel Postgres**: https://vercel.com/storage/postgres
- **Railway**: https://railway.app

Get your connection string and update `.env.local`

### 3. Environment Variables

Update `.env.local` with your values:
```env
# Database
DATABASE_URL="your-postgresql-connection-string"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-a-random-secret-here"

# Existing Sanity variables...
```

To generate `NEXTAUTH_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 4. Install Dependencies & Run Migrations

```bash
# Install packages
npm install

# Generate Prisma Client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Start development server
npm run dev
```

### 5. Create Admin User

Since registration is open but defaults to STUDENT role, you need to manually create an admin user.

Use Prisma Studio:
```bash
npx prisma studio
```

Or use the API directly (see below).

#### Creating First Admin via API

Make a POST request to `/api/register`:
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@dammicschools.com",
    "password": "admin123",
    "name": "Admin User",
    "role": "ADMIN"
  }'
```

## Usage

### Admin Workflow
1. Login at `/login`
2. Dashboard shows statistics and recent activity
3. **Manage Users**: Create staff and student accounts
4. **Create Exams**: Build question banks and exams
5. **Publish Exams**: Make exams available to students
6. **Monitor Results**: View submissions and analytics

### Student Workflow
1. Login at `/login`
2. View available exams on dashboard
3. Click "Start Exam" to begin
4. Answer questions with countdown timer
5. Submit exam (or auto-submit when time expires)
6. View results in "My Results" section

### Staff Workflow
1. Login at `/login`
2. Create and manage exams
3. Monitor student progress
4. Grade essay-type questions manually

## Project Structure

```
dammic-model-schools-cbt/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth API routes
│   │   └── register/             # User registration
│   ├── dashboard/
│   │   ├── admin/                # Admin dashboard
│   │   ├── staff/                # Staff dashboard
│   │   └── student/              # Student dashboard
│   ├── login/                    # Login page
│   └── exam/[id]/                # Exam taking interface
├── lib/
│   ├── auth.ts                   # NextAuth configuration
│   └── prisma.ts                 # Prisma client
├── prisma/
│   └── schema.prisma             # Database schema
└── types/
    └── next-auth.d.ts            # TypeScript definitions
```

## Database Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Open Prisma Studio (GUI for database)
npx prisma studio

# Push schema changes without migration
npx prisma db push
```

## Development Notes

### Creating Test Data

You can use Prisma Studio or create a seed script:

```typescript
// prisma/seed.ts
import { prisma } from '../lib/prisma';
import { hash } from 'bcryptjs';

async function main() {
  // Create test users
  const hashedPassword = await hash('password123', 12);
  
  const admin = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  const student = await prisma.user.create({
    data: {
      email: 'student@test.com',
      password: hashedPassword,
      name: 'Test Student',
      role: 'STUDENT',
      studentId: 'STU001',
    },
  });

  console.log({ admin, student });
}

main();
```

Run seed: `npx tsx prisma/seed.ts`

## Deployment

### Database
1. Set up production PostgreSQL database
2. Update `DATABASE_URL` in production environment variables

### Hosting (Vercel)
1. Push code to GitHub
2. Import project to Vercel
3. Add environment variables:
   - `DATABASE_URL`
   - `NEXTAUTH_URL` (your production URL)
   - `NEXTAUTH_SECRET`
   - All Sanity variables
4. Deploy

## Security Notes

- ⚠️ Change `NEXTAUTH_SECRET` to a strong random value in production
- ⚠️ Use environment variables for sensitive data
- ⚠️ Keep `DATABASE_URL` secret
- ⚠️ Implement rate limiting for login attempts in production
- ⚠️ Use HTTPS in production

## Next Steps / TODOs

- [ ] Create exam-taking interface with timer
- [ ] Implement auto-save during exam
- [ ] Add question randomization
- [ ] Build exam creation UI for admin
- [ ] Add user management interface
- [ ] Implement staff dashboard
- [ ] Add analytics and reporting
- [ ] Email notifications for results
- [ ] Export results to PDF/Excel

## Support

For issues or questions, refer to:
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs
- NextAuth: https://next-auth.js.org
