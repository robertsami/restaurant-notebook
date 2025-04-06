# Restaurant Notebook

A web application for tracking restaurant visits, organizing restaurant lists, and sharing recommendations with friends.

## Features

- Track restaurants you've visited or want to visit
- Organize restaurants into lists
- Record visits with notes and photos
- Share lists with friends
- Get AI-powered restaurant recommendations
- Connect with friends to see their recommendations

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Firebase Authentication
- **UI Components**: Shadcn UI (based on Radix UI)
- **Styling**: Tailwind CSS
- **State Management**: React Query for data fetching
- **AI Integration**: OpenAI for restaurant suggestions
- **Places API**: Google Places API for restaurant search

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or Neon serverless Postgres)
- Firebase project with Authentication enabled
- OpenAI API key (for AI suggestions)
- Google Places API key (for restaurant search)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local` and fill in your environment variables
4. Run database migrations:
   ```bash
   npm run db:push
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```

## Database Schema

The application uses the following database schema:

- **Users**: User accounts and profiles
- **Restaurants**: Restaurant information
- **Lists**: Collections of restaurants
- **Visits**: Records of restaurant visits
- **Notes**: Notes about restaurant visits
- **Photos**: Photos from restaurant visits
- **Friends**: Friend connections between users
- **Activities**: User activity feed

## API Routes

The application provides the following API routes:

- **Authentication**: `/api/auth/*`
- **Users**: `/api/user`
- **Restaurants**: `/api/restaurants/*`
- **Lists**: `/api/lists/*`
- **Visits**: `/api/visits/*`
- **Friends**: `/api/friends/*`
- **AI Suggestions**: `/api/ai/*`

## Deployment

The application can be deployed to any platform that supports Next.js, such as Vercel, Netlify, or a custom server.

## License

This project is licensed under the MIT License.
