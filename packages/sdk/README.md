# X-Ray SDK

TypeScript SDK for instrumenting multi-step, non-deterministic algorithmic pipelines with **Decision Observability**.

X-Ray moves away from traditional "black box" logging by forcing your AI systems to write down their thoughts. It captures not just *what* happened, but *why* it happened.

## Installation

```bash
npm install @xray/sdk
# or
pnpm add @xray/sdk
```

## Quick Start

### 1. Initialize the Logger

```typescript
import { XRayLogger } from '@xray/sdk';

const xray = new XRayLogger({
  service: 'competitor-search',
  endpoint: 'http://localhost:3000', // X-Ray API URL
});
```

### 2. Track an End-to-End Operation (Trace)

A `trace_id` groups related events (like an LLM call followed by a filtering step). Create it once per operation.

```typescript
const traceId = xray.createTrace();
```

### 3. Log an LLM Call

Capture the **reasoning** behind an AI generation.

```typescript
await xray.logLLM({
  trace_id: traceId,
  timestamp: new Date().toISOString(),
  duration_ms: 1250,
  
  // 🎯 REASONING - The core of X-Ray
  reasoning: {
    summary: "Selected 'wireless' and 'noise-canceling' because the user mentioned traveling context.",
    confidence: 0.92,
    effort: 'medium',
    strategy: 'chain_of_thought'
  },
  
  model: { provider: 'openai', name: 'gpt-4' },
  params: { temperature: 0.7 },
  
  input: {
    input_tokens: 250,
    raw_prompt: "..." // Optional: for debugging
  },
  
  output: {
    output_tokens: 180,
    response_text: "..." // Optional
  }
});
```

### 4. Log a Decision (Funnel Analysis)

Capture how you filtered or selected items. This is crucial for "funnel" visualization.

```typescript
await xray.logDecision({
  trace_id: traceId,
  timestamp: new Date().toISOString(),
  duration_ms: 45,
  
  decision: {
    input_count: 50,  // Candidates before filtering
    output_count: 3,  // Candidates remaining
    
    // Breakdown for the viewer chart
    kept: [
      { count: 3, reason: "high_relevance" }
    ],
    dropped: [
      { count: 40, reason: "price_too_high" },
      { count: 7, reason: "out_of_stock" }
    ]
  },
  
  criteria: { max_price: 300 }
});
```

## Advanced: Metadata & Rejected Items

The `metadata` field is a flexible JSON object available on all events. It powers the richest features in the X-Ray Viewer.

### Tracking Rejected/Selected Items

The Viewer automatically renders green/red cards for items found in `metadata.selected_items` and `metadata.rejected_items`.

```typescript
await xray.logDecision({
  trace_id: traceId,
  decision: { ... },
  
  // ✅ Store item details in metadata for debugging
  metadata: {
    selected_items: [
      { id: 'p1', name: 'Sony XM5', price: 299, score: 0.95 }
    ],
    rejected_items: {
      price_too_high: [
        { id: 'p2', name: 'Bose QC', price: 599, rejection_details: 'Price $599 > Max $300' }
      ],
      out_of_stock: [
        { id: 'p3', name: 'AirPods Max', price: 499, rejection_details: 'Currently unavailable' }
      ]
    },
    domain: 'ecommerce', // For cross-domain analytics
    user_id: 'user-123'
  }
});
```

## Core Concepts

### Event Types
- **LLM Call (`logLLM`)**: For any AI/ML generation. Focuses on reasoning and token usage.
- **Decision (`logDecision`)**: For filtering, ranking, or selection logic. Powers funnel charts.
- **HTTP Request (`logHTTP`)**: For external API calls.
- **Custom (`logCustom`)**: For any other domain-specific events.

### Trace IDs
A `trace_id` should be generated **once** per request/job and passed to every event logging method. This allows the Viewer to reconstruct the timeline of the entire process.

## API Reference

### `XRayLogger`

| Method | Description |
| --- | --- |
| `constructor(config)` | Initialize with `service`, `endpoint`, and optional `apiKey`. |
| `createTrace()` | Generate a unique UUID for a new trace. |
| `logLLM(event)` | Log an LLM call with reasoning. |
| `logDecision(event)`| Log a filtering or selection step. |
| `logHTTP(event)` | Log an external HTTP request. |
| `logCustom(type, data)` | Log a custom event type. |
| `time(trace_id, fn, builder)` | Helper to time a function and log the result. |

## Best Practices

1. **Always log reasoning**: For LLM calls, the "Why" is more important than the "What."
2. **Use snake_case for reasons**: Standardize on `price_too_high` instead of `"Price Too High"` to enable better aggregation.
3. **Attach metadata**: Include `user_id`, `domain`, and `experiment_id` for advanced analytics.
4. **Be selective with raw data**: In production, you may want to hash prompts/responses or omit them for privacy, while logging reasoning summaries in full.

## Resilience

The SDK is designed to be **non-blocking** and **resilient**.
- If the X-Ray API is unavailable, the SDK will (by default) log the error to the console and allow your application to continue.
- You can configure this behavior using the `onError` option (`'throw' | 'log' | 'silent'`).

## License

MIT
