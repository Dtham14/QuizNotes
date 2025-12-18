# QuizNotes

A professional music theory quiz web application built with Next.js, featuring real music notation rendered with VexFlow and user authentication with quiz tracking.

## Features

- **User Authentication**: Secure login and registration system with session management
- **Real Music Notation**: VexFlow integration for displaying professional sheet music
- **Multiple Quiz Topics**:
  - Intervals
  - Chords
  - Scales
- **Progress Tracking**: Dashboard to view quiz history and performance statistics
- **Responsive Design**: Professional UI with Tailwind CSS
- **Database**: SQLite with Drizzle ORM for easy setup and scalability

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Database**: SQLite with Drizzle ORM
- **Music Notation**: VexFlow 5
- **Authentication**: Custom auth with bcrypt and sessions

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Navigate to the project directory:
```bash
cd music-theory-quiz
```

2. Install dependencies (already done):
```bash
npm install
```

3. Push the database schema (already done):
```bash
npm run db:push
```

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
music-theory-quiz/
├── app/
│   ├── api/
│   │   ├── auth/          # Authentication endpoints
│   │   └── quiz/          # Quiz submission and retrieval
│   ├── dashboard/         # User dashboard page
│   ├── login/             # Login/Register page
│   ├── quiz/              # Quiz taking page
│   └── page.tsx           # Home landing page
├── components/
│   └── MusicNotation.tsx  # VexFlow music notation component
├── lib/
│   ├── db/
│   │   ├── schema.ts      # Database schema
│   │   └── index.ts       # Database client
│   ├── auth.ts            # Authentication utilities
│   └── quizData.ts        # Quiz questions and data
├── drizzle.config.ts      # Drizzle ORM configuration
└── sqlite.db              # SQLite database file
```

## Usage

### Creating an Account

1. Click "Get Started" or "Register" on the home page
2. Enter your email, password, and optional name
3. You'll be automatically logged in and redirected to the dashboard

### Taking a Quiz

1. From the dashboard or home page, click "Start a Quiz"
2. Choose a topic (Intervals, Chords, or Scales)
3. Answer questions by selecting the correct option
4. View your results and explanations at the end
5. Your quiz attempt is automatically saved

### Viewing Progress

1. Navigate to your Dashboard
2. View statistics including:
   - Total quizzes taken
   - Average score
   - Performance by topic
   - Complete quiz history with dates and scores

## Database Management

View and edit your database using Drizzle Studio:
```bash
npm run db:studio
```

This will open a web interface to browse and manage your database.

## Development Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push database schema changes
- `npm run db:studio` - Open Drizzle Studio

## Features Breakdown

### Authentication System
- Secure password hashing with bcrypt
- Session-based authentication
- Protected routes and API endpoints
- Automatic session expiration (7 days)

### Quiz System
- 15 questions across 3 topics
- Real-time scoring
- Answer tracking and review
- Detailed explanations for each question

### Music Notation
- VexFlow-powered notation rendering
- Support for multiple clefs (treble, bass)
- Accidentals and complex note patterns
- Responsive canvas sizing

## Future Enhancements

Potential features to add:
- More quiz topics (key signatures, rhythm, harmony)
- Difficulty levels
- Timed quizzes
- Leaderboards
- Study mode with hints
- Custom quiz creation
- Export quiz results as PDF

## License

This project is open source and available for educational purposes.

## Support

For issues or questions, please check the code comments or reach out to the development team.
