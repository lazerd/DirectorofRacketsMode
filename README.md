# Director of Rackets Mode AI

A comprehensive platform for tennis clubs and coaches to manage lesson scheduling and client notifications. This is a super-app that combines club management with the LastMinuteLesson slot-booking system.

## Key Features

### Three User Roles

1. **Club Director**
   - Create and manage a club
   - Invite unlimited coaches
   - View club-wide calendar with all coaches' slots
   - Send club-wide email blasts

2. **Club Coach**
   - Join an existing club with invite code
   - Manage personal calendar and clients
   - Part of club ecosystem
   - Send personal email blasts

3. **Independent Coach**
   - Operate without a club
   - Full control over own calendar
   - Manage own clients
   - Send personal email blasts

### No More Email Spam

Unlike other booking systems, we don't send emails on every slot creation:

- **Create slots** → No email sent
- **Build your list** → Add multiple slots
- **Send blast** → ONE email per client with ALL available slots

This prevents client email fatigue and gives you control.

### Race-Condition Safe Claiming

Database-level locking ensures no double bookings. When multiple clients click simultaneously, only one succeeds.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Email**: Resend
- **Authentication**: Custom session-based auth with bcrypt

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Copy your API keys

### 3. Set Up Resend

1. Create account at [resend.com](https://resend.com)
2. Create API key
3. Verify your domain

### 4. Configure Environment

```bash
cp .env.example .env.local
```

Fill in:
```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
RESEND_API_KEY=your_resend_key
EMAIL_FROM=notifications@yourdomain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Development Server

```bash
npm run dev
```

## Data Model

### Clubs
- Directors create clubs
- Clubs have unlimited coaches
- Club-wide email blasts available

### Coaches
- Can be director, club_coach, or independent_coach
- Linked to club (or null for independent)
- Each has own clients and slots

### Clients
- Many-to-many with coaches
- Many-to-many with clubs
- Can belong to multiple coaches/clubs

### Slots
- Belong to a coach
- Optionally linked to a club
- Track notification status (`notifications_sent`)
- Race-condition safe claiming

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register (with role selection)
- `POST /api/auth/login` - Sign in
- `POST /api/auth/logout` - Sign out
- `GET /api/auth/session` - Check session

### Email Blasts (NEW!)
- `POST /api/blast/coach` - Send coach email blast
- `POST /api/blast/club` - Send club-wide blast (directors only)

### Slots
- `GET /api/slots` - List slots
- `POST /api/slots` - Create slot (NO auto-email)
- `PUT /api/slots/[id]` - Update slot
- `DELETE /api/slots/[id]` - Delete slot

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Add client
- `POST /api/clients/import` - Bulk import

### Club (Directors)
- `GET /api/club` - Get club info
- `GET /api/club/coaches` - List club coaches
- `POST /api/club/invite` - Invite a coach

### Claim (Public)
- `POST /api/claim` - Claim a slot

## Email Blast Flow

1. Coach creates multiple open slots (no emails sent)
2. Coach clicks "Send Email Blast"
3. System aggregates all unnotified open slots
4. ONE email per client listing ALL available slots
5. Slots marked as `notifications_sent = true`

For club blasts, same flow but:
- Director triggers blast
- All open slots from all coaches in club
- All club clients receive one email

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import in Vercel
3. Add environment variables
4. Deploy

### Manual

```bash
npm run build
npm start
```

## Architecture Highlights

- **Role-based access control** in API routes
- **Junction tables** for many-to-many relationships
- **Notification tracking** on slots
- **Club-level aggregation** for director features
- **Invite code system** for coach onboarding

## Migration from LastMinuteLesson

This app is an evolution of LastMinuteLesson. Key changes:

1. Added clubs, directors, and role system
2. Changed to many-to-many client relationships
3. Removed auto-email on slot creation
4. Added email blast functionality
5. Added club-wide features for directors

---

Built for tennis directors and coaches who want control over their scheduling and client communication.
