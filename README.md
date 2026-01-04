# X-Ray System

A debugging and observability system for multi-step, non-deterministic algorithmic pipelines. X-Ray helps you understand **why** decisions were made in complex systems.

X-Ray provides **Decision Observability** - capturing not just what happened, but why it happened.

## Our Approach

X-Ray takes a "Reasoning-First" approach to observability for AI systems:

1.  **Stop the Black Box**: Instead of just logging "Success/Failure," we force the AI to write down its reasoning, confidence, and context as structured data.
2.  **Event-Driven, Not Spans**: Traditional tracing (spans) doesn't always fit AI pipelines (which have loops and retries). We use a flat "Event" model that is simpler to use and more flexible.
3.  **Flexible Storage**: By using JSONB in PostgreSQL, we allow developers to save any extra information they need (Metadata) without having to change the database schema.
4.  **Cross-Pipeline Analysis**: Since we standardize how "Decisions" and "AI Calls" are logged, you can ask questions like "Which service has the highest rejection rate?" across your entire company.

## Project Structure

```
xray/
├── packages/
│   ├── sdk/          # Client SDK for logging events
│   └── api/          # Express API server
├── apps/
│   └── viewer/       # React visualization dashboard
└── docs/             # Documentation

```

## Quick Start

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 17
- pnpm >= 8

### Installation

```bash
# Clone the repository
cd equal
```

Set up the API server with env

Edit .env with in packages/api with your database credentials

Set up the .env file according to the .env.example file

```
# X-Ray API Environment Variables

# Database connection string
DATABASE_URL=postgres://localhost:5432/xray

# Server port
PORT=3000

# API configuration
NODE_ENV=development

```

Edit .env in examples/competitor-search-ui with ZnapAI API key

Setup example UI with .env file ccording to the .env.example file

```
# Example UI Environment Variables

# API endpoint
VITE_OPENAI_API_KEY=your_znapai_api_key_here
VITE_XRAY_ENDPOINT=http://localhost:3000

```
OpenAI compatible api key can be taken from 
![https://znapai.com/app](https://znapai.com/app)
for viewing live working example
or another option is to replace the base URL in example app to default OpenAI and use actual OpenAI key.


After setting env variables, run the following commands

```bash
# Install dependencies
pnpm install

# Database Setup (Required)
# Navigate to the API package
cd packages/api

# Generate migration files
pnpm db:generate

# Run migrations to create the database schema
pnpm db:migrate

# Return to root
cd ../..

# Start all services
pnpm dev

```

The API server will be running at `http://localhost:3000`

The Data Viewer will be running at `http://localhost:3001`
The Example UI will be running at `http://localhost:3002`

## Current Status

- **Express API Server**: Full-featured REST API for trace ingestion and querying
- **Event-Based SDK**: Simple, reasoning-first logging for LLM calls and decisions
- **Visualization Dashboard**: React app for exploring traces and decision funnels
- **Example UI**: Example UI for testing the system

## Known Limitations

- SDK is currently TypeScript only.
- Search logic and categorization logic in example is simulated (mock data).

## Future Improvements

- Multi-language SDK support (Python).
- Distributed tracing support.
- Advanced analytics on reasoning patterns.
- Human-in-the-loop feedback loops.
