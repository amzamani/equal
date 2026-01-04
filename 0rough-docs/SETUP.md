# X-Ray Setup Guide

Quick guide to get the X-Ray API server running.

## Prerequisites

- **Node.js** >= 18
- **PostgreSQL** >= 14  
- **pnpm** >= 8

## Step 1: Install Dependencies

```bash
# From the project root
pnpm install
```

## Step 2: Set Up PostgreSQL Database

```bash
# Create the database
createdb xray

# Or using psql
psql -U postgres -c "CREATE DATABASE xray;"
```

## Step 3: Configure Environment

```bash
cd packages/api

# Copy the example env file
cp .env.example .env

# Edit .env and update DATABASE_URL if needed
# Default: DATABASE_URL=postgres://localhost:5432/xray
```

## Step 4: Generate Database Schema

```bash
# Generate migration files
pnpm db:generate

# This will create migration files in packages/api/drizzle/
```

## Step 5: Run Migrations

```bash
# Apply migrations to create tables
pnpm db:migrate
```

## Step 6: Start the Server

```bash
# Development mode (with hot reload)
pnpm dev

# Or from the root directory
cd ../..
pnpm dev:api
```

The server will start at `http://localhost:3000`

## Verify Installation

Test the health endpoint:

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-03T..."
}
```

## Next Steps

1. **Build the SDK** to instrument your code
2. **Send test traces** to the API
3. **Query traces** using the API endpoints

See the [README](../README.md) for more information.

## Troubleshooting

### Database Connection Issues

If you get connection errors:

1. Check PostgreSQL is running: `pg_isready`
2. Verify DATABASE_URL in `.env`
3. Ensure the database exists: `psql -l | grep xray`

### Port Already in Use

If port 3000 is taken, change it in `.env`:
```
PORT=3001
```

### TypeScript Errors

Rebuild the project:
```bash
pnpm build
```
