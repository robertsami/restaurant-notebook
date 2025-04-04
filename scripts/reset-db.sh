#!/bin/bash

# This script resets the database by deleting the SQLite file and running migrations

# Navigate to the project root
cd "$(dirname "$0")/.."

# Check if the database file exists
if [ -f ./prisma/dev.db ]; then
  echo "Removing existing database file..."
  rm ./prisma/dev.db
fi

# Run migrations
echo "Running Prisma migrations..."
npx prisma migrate dev --name init

# Seed the database
echo "Seeding the database..."
npx prisma db seed

echo "Database reset complete!"