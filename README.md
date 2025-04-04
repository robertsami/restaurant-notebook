# Restaurant Notebook

Restaurant Notebook is a full-stack web application that allows users to track restaurants they want to visit, log their experiences, write notes, collaborate on restaurant lists with friends, and explore trends over time. The app also includes AI-powered features for note summarization and restaurant suggestions.

## Features

- **Restaurant Lists**: Create and manage lists of restaurants to visit
- **Notes & Reviews**: Log personal notes, ratings, and photos for each restaurant
- **Collaboration**: Share lists with friends and collaborate in real-time
- **AI Features**: Summarize notes, auto-tag restaurants, and get personalized suggestions
- **Analytics**: View personal dining trends and statistics

## Tech Stack

- **Frontend**: Next.js (App Router), Tailwind CSS
- **State Management**: Zustand
- **Authentication**: NextAuth.js
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Prisma ORM
- **File Storage**: Firebase Storage
- **Real-time**: Pusher
- **AI Integration**: OpenAI GPT-4 API
- **Analytics**: Recharts
- **Observability**: Sentry + LogRocket
- **Testing**: Vitest + Playwright

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Docker (optional, for containerized development)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/restaurant-notebook.git
   cd restaurant-notebook
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with your configuration values.

4. Generate Prisma client and push schema to database:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. Seed the database with sample data:
   ```bash
   npm run seed
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

7. Open [http://localhost:59243](http://localhost:59243) in your browser.

### Using Docker

You can also use Docker for development:

```bash
# Build and start the Docker container
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs when running in detached mode
docker-compose logs -f

# Stop the container
docker-compose down
```

The application will be available at [http://localhost:59243](http://localhost:59243).

#### Docker Commands for Development

```bash
# Run database migrations
docker-compose exec app npx prisma migrate dev

# Generate Prisma client
docker-compose exec app npx prisma generate

# Seed the database
docker-compose exec app npm run seed

# Run tests
docker-compose exec app npm run test

# Run end-to-end tests
docker-compose exec app npm run test:e2e
```

#### Production Docker

For production deployment:

```bash
# Build the production image
docker build -t restaurant-notebook:prod .

# Run the production container
docker run -p 3000:3000 -e DATABASE_URL=your_production_db_url restaurant-notebook:prod
```

## Testing

### Unit Tests

```bash
npm run test
```

### End-to-End Tests

```bash
npm run test:e2e
```

## Deployment

### Build for Production

```bash
npm run build
```

## Project Structure

```
restaurant-notebook/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/             # API Routes
│   │   ├── (authenticated)/ # Protected routes
│   │   └── auth/            # Authentication pages
│   ├── components/          # React components
│   ├── lib/                 # Utility libraries
│   ├── providers/           # React context providers
│   ├── store/               # Zustand state management
│   └── types/               # TypeScript type definitions
├── prisma/                  # Prisma schema and migrations
├── public/                  # Static assets
├── e2e/                     # End-to-end tests
└── tests/                   # Unit and integration tests
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma](https://www.prisma.io/)
- [NextAuth.js](https://next-auth.js.org/)
- [OpenAI](https://openai.com/)