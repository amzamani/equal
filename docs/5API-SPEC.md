# X-Ray API Specification

Complete API reference for the X-Ray observability system.

**Base URL**: `http://localhost:3000`  
**API Version**: `v1`

POSTMAN collection URL : https://backend-team-toffeemoney.postman.co/workspace/93628501-c31d-4f91-bc71-064d7d6af68d/collection/13971265-63e3fc5b-c58b-4616-a784-4128734ca5f5?action=share&source=copy-link&creator=13971265

---

## Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check |
| **Event Ingestion** |
| `POST` | `/v1/events` | Ingest single event |
| `POST` | `/v1/events/batch` | Ingest multiple events |
| **Event Queries** |
| `GET` | `/v1/events?trace_id={id}` | Get all events for a trace |
| `GET` | `/v1/events/{span_id}` | Get a single event |
| **Trace Management** |
| `GET` | `/v1/traces` | List all traces |
| **Analytics** |
| `GET` | `/v1/analytics/high-drop-traces` | Find high drop rate traces |
| `GET` | `/v1/analytics/drop-reasons` | Aggregate drop reasons |
| `GET` | `/v1/analytics/funnel-stats?trace_id={id}` | Get funnel statistics |
| `GET` | `/v1/analytics/metadata-values?field={name}` | Discover metadata values |

---

## Table of Contents

1. [Health Check](#health-check)
2. [Event Ingestion](#event-ingestion)
3. [Event Queries](#event-queries)
4. [Trace Management](#trace-management)
5. [Analytics](#analytics)
6. [Error Responses](#error-responses)

---

## Health Check

### `GET /health`

Check if the API server is running.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2024-01-03T10:30:00.000Z"
}
```

**Status Codes**:
- `200 OK`: Server is healthy

---

## Event Ingestion

### `POST /v1/events`

Ingest a single event into the X-Ray system.

**Request Body**:
```json
{
  "event_type": "llm_call",
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "span_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "timestamp": "2024-01-03T10:30:00Z",
  "duration_ms": 567,
  "service": "competitor-search",
  "reasoning": {
    "summary": "Selected top 3 products based on relevance",
    "effort": "medium",
    "confidence": 0.85
  },
  "model": {
    "provider": "openai",
    "name": "gpt-4"
  },
  "input": {
    "input_tokens": 150,
    "raw_prompt": "..."
  },
  "output": {
    "output_tokens": 200,
    "response_text": "..."
  },
  "metadata": {
    "user_id": "user-123",
    "domain": "ecommerce"
  }
}
```

**Required Fields**:
- `event_type` (string): Type of event (`llm_call`, `decision`, `http_request`, custom)
- `trace_id` (string): UUID for grouping related events
- `timestamp` (string): ISO 8601 timestamp

**Optional Fields**:
- `span_id` (string): UUID for this specific event (auto-generated if not provided)
- `parent_span_id` (string): UUID of parent event
- `service` (string): Service name
- `duration_ms` (number): Event duration in milliseconds
- `metadata` (object): Custom key-value pairs
- Event-specific fields (varies by `event_type`)

**Response**:
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "message": "Event ingested successfully"
}
```

**Status Codes**:
- `201 Created`: Event ingested successfully
- `400 Bad Request`: Missing required fields
- `500 Internal Server Error`: Server error

---

### `POST /v1/events/batch`

Ingest multiple events in a single request.

**Request Body**:
```json
{
  "events": [
    {
      "event_type": "llm_call",
      "trace_id": "550e8400-...",
      "timestamp": "2024-01-03T10:30:00Z",
      ...
    },
    {
      "event_type": "decision",
      "trace_id": "550e8400-...",
      "timestamp": "2024-01-03T10:30:05Z",
      ...
    }
  ]
}
```

**Response**:
```json
{
  "message": "5 events ingested successfully",
  "count": 5
}
```

**Status Codes**:
- `201 Created`: All events ingested successfully
- `400 Bad Request`: Invalid request format
- `500 Internal Server Error`: Server error

---

## Event Queries

### `GET /v1/events?trace_id={trace_id}`

Retrieve all events for a specific trace.

**Query Parameters**:
- `trace_id` (required): UUID of the trace

**Response**:
```json
{
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "count": 5,
  "events": [
    {
      "event_type": "llm_call",
      "trace_id": "550e8400-...",
      "timestamp": "2024-01-03T10:30:00Z",
      "reasoning": {
        "summary": "...",
        "confidence": 0.85
      },
      ...
    },
    {
      "event_type": "decision",
      "trace_id": "550e8400-...",
      "timestamp": "2024-01-03T10:30:05Z",
      "decision": {
        "input_count": 50,
        "output_count": 3,
        "kept": [{ "count": 3, "reason": "high_relevance" }],
        "dropped": [
          { "count": 40, "reason": "price_too_high" },
          { "count": 7, "reason": "out_of_stock" }
        ]
      },
      "metadata": {
        "selected_items": [...],
        "rejected_items": {...}
      },
      ...
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Events retrieved successfully
- `400 Bad Request`: Missing `trace_id` parameter
- `500 Internal Server Error`: Server error

---

### `GET /v1/events/{span_id}`

Retrieve a single event by its specific Span ID.

**Path Parameters**:
- `span_id` (required): UUID of the event

**Response**:
```json
{
  "event_type": "llm_call",
  "trace_id": "550e8400-...",
  "span_id": "a1b2c3d4-...",
  "timestamp": "2024-01-03T10:30:00Z",
  "service": "competitor-search",
  ...
}
```

**Status Codes**:
- `200 OK`: Event retrieved successfully
- `404 Not Found`: Event not found
- `500 Internal Server Error`: Server error

---

## Trace Management

### `GET /v1/traces`

List all traces with summary information.

**Query Parameters**: None

**Response**:
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "service": "competitor-search",
    "name": "Event-based trace",
    "status": "completed",
    "startTime": 1704276600000,
    "endTime": 1704276610000,
    "eventCount": 5
  },
  {
    "id": "660f9511-f3ac-52e5-b827-557766551111",
    "service": "product-filter",
    "name": "Event-based trace",
    "status": "completed",
    "startTime": 1704276500000,
    "endTime": 1704276505000,
    "eventCount": 3
  }
]
```

**Notes**:
- Returns up to 50 most recent traces
- Ordered by start time (newest first)
- Timestamps are Unix milliseconds

**Status Codes**:
- `200 OK`: Traces retrieved successfully
- `500 Internal Server Error`: Server error

---

## Analytics

### `GET /v1/analytics/high-drop-traces`

Find traces with decision events that have high drop rates.

**Query Parameters**:
- `threshold` (optional, default: `0.9`): Drop rate threshold (0-1)
- `service` (optional): Filter by service name
- `limit` (optional, default: `50`): Maximum number of results
- `metadata.*` (optional): Dynamic metadata filters (e.g., `metadata.domain=fraud`)

**Examples**:
```bash
# Get traces with >90% drop rate
GET /v1/analytics/high-drop-traces?threshold=0.9

# Filter by service
GET /v1/analytics/high-drop-traces?threshold=0.8&service=product-filter

# Filter by metadata
GET /v1/analytics/high-drop-traces?threshold=0.9&metadata.domain=ecommerce&metadata.user_id=user-123
```

**Response**:
```json
{
  "threshold": 0.9,
  "count": 15,
  "traces": [
    {
      "trace_id": "550e8400-...",
      "service": "product-filter",
      "timestamp": "2024-01-03T10:30:00Z",
      "input_count": 100,
      "output_count": 5,
      "drop_rate_percent": 95.0,
      "metadata": {
        "domain": "ecommerce",
        "user_id": "user-123"
      }
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Query successful
- `500 Internal Server Error`: Server error

---

### `GET /v1/analytics/drop-reasons`

Aggregate drop reasons across all decision events.

**Query Parameters**:
- `service` (optional): Filter by service name
- `trace_id` (optional): Filter by specific trace
- `limit` (optional, default: `20`): Maximum number of reasons
- `metadata.*` (optional): Dynamic metadata filters

**Examples**:
```bash
# Get top drop reasons across all services
GET /v1/analytics/drop-reasons?limit=10

# Filter by service
GET /v1/analytics/drop-reasons?service=competitor-search

# Filter by trace
GET /v1/analytics/drop-reasons?trace_id=550e8400-...
```

**Response**:
```json
{
  "count": 5,
  "reasons": [
    {
      "reason": "price_too_high",
      "total_count": 4500,
      "affected_traces": 120,
      "avg_percentage": 45.2
    },
    {
      "reason": "out_of_stock",
      "total_count": 1200,
      "affected_traces": 80,
      "avg_percentage": 12.5
    },
    {
      "reason": "no_keyword_match",
      "total_count": 800,
      "affected_traces": 60,
      "avg_percentage": 8.3
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Query successful
- `500 Internal Server Error`: Server error

---

### `GET /v1/analytics/funnel-stats?trace_id={trace_id}`

Get funnel statistics for a specific trace across all decision events.

**Query Parameters**:
- `trace_id` (required): UUID of the trace

**Response**:
```json
{
  "trace_id": "550e8400-e29b-41d4-a716-446655440000",
  "decision_count": 3,
  "cumulative_drop_rate": 96.0,
  "initial_input": 1000,
  "final_output": 40,
  "funnel": [
    {
      "span_id": "a1b2c3d4-...",
      "timestamp": "2024-01-03T10:30:00Z",
      "input_count": 1000,
      "output_count": 150,
      "drop_rate_percent": 85.0,
      "dropped": [
        { "count": 850, "reason": "no_keyword_match" }
      ],
      "kept": [
        { "count": 150, "reason": "keyword_match" }
      ]
    },
    {
      "span_id": "b2c3d4e5-...",
      "timestamp": "2024-01-03T10:30:02Z",
      "input_count": 150,
      "output_count": 45,
      "drop_rate_percent": 70.0,
      "dropped": [
        { "count": 105, "reason": "price_too_high" }
      ],
      "kept": [
        { "count": 45, "reason": "within_budget" }
      ]
    },
    {
      "span_id": "c3d4e5f6-...",
      "timestamp": "2024-01-03T10:30:04Z",
      "input_count": 45,
      "output_count": 40,
      "drop_rate_percent": 11.1,
      "dropped": [
        { "count": 5, "reason": "out_of_stock" }
      ],
      "kept": [
        { "count": 40, "reason": "in_stock" }
      ]
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Funnel stats retrieved successfully
- `400 Bad Request`: Missing `trace_id` parameter
- `404 Not Found`: No decision events found for trace
- `500 Internal Server Error`: Server error

---

### `GET /v1/analytics/metadata-values?field={field}`

Discover unique values for a metadata field (useful for populating UI filters).

**Query Parameters**:
- `field` (required): Metadata field name (e.g., `domain`, `user_id`, `region`)
- `event_type` (optional): Filter by event type

**Examples**:
```bash
# Get all unique domain values
GET /v1/analytics/metadata-values?field=domain

# Get unique regions for decision events
GET /v1/analytics/metadata-values?field=region&event_type=decision
```

**Response**:
```json
{
  "field": "domain",
  "values": [
    {
      "value": "fraud_detection",
      "count": 150
    },
    {
      "value": "ecommerce",
      "count": 200
    },
    {
      "value": "healthcare",
      "count": 75
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Values retrieved successfully
- `400 Bad Request`: Missing `field` parameter
- `500 Internal Server Error`: Server error

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message",
  "details": "Detailed error information"
}
```

### Common Status Codes

- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters or body
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

### Example Error Response

```json
{
  "error": "Failed to query high drop traces",
  "details": "Invalid threshold value: must be between 0 and 1"
}
```

---

## Event Types

### LLM Call Event

```json
{
  "event_type": "llm_call",
  "trace_id": "550e8400-...",
  "timestamp": "2024-01-03T10:30:00Z",
  "duration_ms": 567,
  "service": "my-service",
  "reasoning": {
    "summary": "Natural language explanation",
    "effort": "low|medium|high",
    "confidence": 0.85,
    "strategy": "keyword_expansion",
    "decision_factors": ["product_name", "domain_knowledge"],
    "alternatives_considered": ["exact_match"]
  },
  "model": {
    "provider": "openai",
    "name": "gpt-4"
  },
  "params": {
    "temperature": 0.7,
    "max_tokens": 500
  },
  "input": {
    "input_tokens": 150,
    "raw_prompt": "...",
    "user_prompt_hash": "hash_abc123"
  },
  "output": {
    "output_tokens": 200,
    "response_text": "...",
    "response_hash": "hash_def456",
    "finish_reason": "stop"
  },
  "metrics": {
    "latency_ms": 567,
    "cost_usd": 0.0005
  },
  "metadata": {
    "user_id": "user-123",
    "experiment_id": "exp-456"
  }
}
```

### Decision Event

```json
{
  "event_type": "decision",
  "trace_id": "550e8400-...",
  "timestamp": "2024-01-03T10:30:05Z",
  "duration_ms": 5,
  "service": "my-service",
  "decision": {
    "input_count": 100,
    "output_count": 5,
    "kept": [
      { "count": 5, "reason": "meets_criteria" }
    ],
    "dropped": [
      { "count": 60, "reason": "price_too_high" },
      { "count": 35, "reason": "out_of_stock" }
    ]
  },
  "criteria": {
    "max_price": 300,
    "min_score": 0.7
  },
  "metadata": {
    "selected_items": [
      { "id": "p1", "name": "Product A", "price": 299, "score": 0.95 }
    ],
    "rejected_items": {
      "price_too_high": [
        { "id": "p2", "name": "Product B", "price": 599,
          "rejection_details": "Price $599 exceeds max $300" }
      ],
      "out_of_stock": [
        { "id": "p3", "name": "Product C", "price": 249,
          "rejection_details": "Product not available" }
      ]
    },
    "domain": "ecommerce",
    "user_id": "user-123"
  }
}
```

### HTTP Request Event

```json
{
  "event_type": "http_request",
  "trace_id": "550e8400-...",
  "timestamp": "2024-01-03T10:30:03Z",
  "duration_ms": 120,
  "service": "my-service",
  "http": {
    "method": "GET",
    "url": "https://api.example.com/products",
    "status_code": 200,
    "request_size_bytes": 256,
    "response_size_bytes": 4096
  },
  "metadata": {
    "cache_hit": false,
    "retry_count": 0
  }
}
```

### Custom Event

```json
{
  "event_type": "custom_event_name",
  "trace_id": "550e8400-...",
  "timestamp": "2024-01-03T10:30:06Z",
  "duration_ms": 10,
  "service": "my-service",
  "data": {
    // Any custom data
  },
  "metadata": {
    // Any custom metadata
  }
}
```

---

## Rate Limits

Currently, there are no rate limits enforced. For production use, consider implementing:
- Rate limiting per IP/API key
- Request size limits (currently 10MB)
- Batch size limits

---

## CORS

CORS is enabled for all origins (`*`). For production, configure specific allowed origins in the server configuration.

---

## Versioning

The API uses URL-based versioning (`/v1/`).

---

## Support


- Documentation: See `ARCHITECTURE.md` and `docs/METADATA_GUIDE.md`
