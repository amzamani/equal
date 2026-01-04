# X-Ray API Server

Express.js API server for ingesting and querying event data from the X-Ray debugging system.

## Features

- **Event-based architecture**: Flexible JSONB storage for diverse event types
- **High-throughput ingestion**: POST endpoints for single and batch events
- **Rich querying**: Query events by trace_id, list all traces
- **PostgreSQL storage**: Using Drizzle ORM with JSONB for flexible schema

## Setup

### Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- pnpm >= 8

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgres://user:password@localhost:5432/xray
```

### Database Setup

```bash
# Generate migration files
pnpm db:generate

# Run migrations
pnpm db:migrate
```

### Running the Server

```bash
# Development mode (with hot reload)
pnpm dev

# Production build
pnpm build
pnpm start
```

## API Endpoints

### Health Check
```
GET /health
```

Returns server status and timestamp.

### Ingest Single Event
```
POST /v1/events
Content-Type: application/json

{
  "event_type": "llm_call",
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2024-01-03T10:30:00Z",
  "duration_ms": 567,
  "service": "competitor-search-ui",
  "reasoning": {
    "summary": "Selected top 3 products based on relevance",
    "confidence": 0.85
  },
  "model": { "provider": "openai", "name": "gpt-4", "temperature": 0.7 },
  "input": { "raw_prompt": "...", "input_tokens": 150 },
  "output": { "response_text": "...", "output_tokens": 200 }
}
```

### Ingest Batch Events
```
POST /v1/events/batch
Content-Type: application/json

{
  "events": [
    { "event_type": "llm_call", ... },
    { "event_type": "decision", ... }
  ]
}
```

### Query Events by Trace
```
GET /v1/events?trace_id=550e8400-e29b-41d4-a716-446655440000
```

Returns all events for a specific trace.

### Get Single Event
```
GET /v1/events/:span_id
```

Returns a single event by its span_id.

### List All Traces
```
GET /v1/traces
```

Returns a list of all traces (grouped by trace_id) with metadata.

## Database Schema

### Tables

- **events**: Single table storing all events with JSONB data

### Schema

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key (same as span_id) |
| `event_type` | VARCHAR(50) | Event discriminator (llm_call, decision, custom) |
| `trace_id` | UUID | Groups events into traces |
| `span_id` | UUID | Unique event identifier |
| `parent_span_id` | UUID | Optional parent span |
| `service` | VARCHAR(255) | Service name |
| `timestamp` | TIMESTAMP | When the event occurred |
| `duration_ms` | INTEGER | Event duration |
| `data` | JSONB | Full event payload |
| `created_at` | TIMESTAMP | Ingestion timestamp |

## Development

```bash
# Watch mode
pnpm dev

# Type checking
pnpm build
```
