# QuizNotes

A professional music theory learning platform featuring interactive quizzes, ear training exercises, real music notation, and gamification. Built for students, teachers, and musicians of all levels.

## Features

### Core Learning
- **Music Notation Rendering** - Professional sheet music display with VexFlow 5
- **Ear Training** - Audio-based exercises with Tone.js synthesis
- **Multiple Quiz Types** - Notes, intervals, chords, scales, key signatures
- **Instant Feedback** - Real-time scoring with detailed explanations

### Gamification
- **XP & Leveling** - Earn experience points and level up
- **Daily Streaks** - Maintain practice streaks with customizable goals
- **Achievements** - Unlock 15+ badges for milestones
- **Leaderboards** - Compete globally or within classes

### Teacher Tools (Premium)
- **Class Management** - Create classes with unique join codes
- **Custom Quizzes** - Build assignments with specific topics and difficulty
- **Student Progress** - Track performance and completion rates
- **Assignment System** - Set quizzes with attempt limits

### Additional Features
- **PDF Export** - Download quiz results with notation
- **Profile Customization** - Avatars, display names, theme colors
- **Multiple Instruments** - Piano, guitar, violin, trumpet, and more
- **Responsive Design** - Works on desktop and mobile

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payments | Stripe |
| Notation | VexFlow 5 |
| Audio | Tone.js |
| PDF | jsPDF + svg2pdf.js |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Stripe account (for payments)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd music-theory-quiz-v2

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase and Stripe credentials

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file with:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
STRIPE_WEBHOOK_SECRET=your_webhook_secret
STRIPE_STUDENT_PRICE_ID=price_xxx
STRIPE_MONTHLY_PRICE_ID=price_xxx
STRIPE_YEARLY_PRICE_ID=price_xxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Project Structure

```
app/
├── api/
│   ├── auth/           # Authentication endpoints
│   ├── quiz/           # Quiz operations & PDF generation
│   ├── gamification/   # XP, achievements, leaderboards
│   ├── teacher/        # Class & assignment management
│   ├── student/        # Enrollment & progress
│   ├── admin/          # Platform analytics
│   └── stripe/         # Payment processing
├── quiz/               # Quiz interface
├── profile/            # User dashboard
├── teacher/            # Teacher portal
├── admin/              # Admin dashboard
├── leaderboard/        # Rankings
└── achievements/       # Badge display

components/
├── MusicNotation.tsx   # VexFlow renderer
├── AudioPlayer.tsx     # Tone.js playback
├── gamification/       # XP bars, streaks, badges
└── quiz-builder/       # Quiz customization

lib/
├── supabase/           # Database clients
├── quizBuilder/        # Dynamic question generation
├── gamification/       # XP, streaks, achievements
├── audio/              # Tone.js utilities
└── pdf/                # PDF generation
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |

## Quiz Topics

| Topic | Description |
|-------|-------------|
| Note Identification | Identify notes on treble and bass clef |
| Key Signatures | Recognize major and minor key signatures |
| Intervals | Identify intervals between notes |
| Chords | Recognize chord types and inversions |
| Scales | Identify scale types |
| Ear Training | Audio-based note, interval, and chord recognition |
| Mixed | Random questions from all topics |

## User Roles

| Role | Access |
|------|--------|
| Student | Quizzes, progress tracking, leaderboards |
| Teacher | + Class management, custom quizzes, analytics |
| Admin | + Platform administration, user management |

## License

This project is open source and available for educational purposes.
