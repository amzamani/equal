
## Determining "Why" in LLM Decisions

*Decision like non deterministic decisions of keyword selection is made by LLM itself, how to determine the why in it ?*

- This is the central paradox of LLM debugging: we cannot step through a neural network like you step through code.
- To capture the "Why" in an LLM decision, our X-Ray SDK must stop treating the LLM as a black box and start treating it as a Reasoning Engine.

### The Strategy: "Coercive" Observability

- Since we cannot read the LLM's "mind," we must force it to write its thoughts down. Our SDK will not just wrap the call; it will enforce Structured Output using JSON mode in LLM.
- Instead of asking the LLM directly for: `['keyword1', 'keyword2']`
- We will receive reply in form of : 

```json
{
  "reasoning": "Product mentions 'no wires' and 'pairing', so 'Bluetooth' is implied but 'wireless' is safer.",
  "confidence_score": 0.85,
  "selected_keywords": ["wireless", "audio"]
}
```

- The "Why" is now data. The SDK separates these fields: the application gets the keywords, but X-Ray stores the reasoning.

- The other simpler thing we can do is use the new LLMcalling method with reasoning parameter, which we are going to proceed with in one example.

## [New Calling Reasoning File](new-calling-reasoning.md)

## Decision Observability

- We are moving beyond standard observability (like OpenTelemetry, which focuses on latency and errors) to Decision Observability (which focuses on non-deterministic outcomes).

## Unit of Measurement: The Decision Frame

- We must define the unit of measurement. Unlike a standard "trace" in tracing, an X-Ray requires a Decision Frame.

## The Decision Frame Model

Every step in the pipeline must capture four specific dimensions:

- **Input Context**: What data entered this step?
- **The Candidate Set**: What was the pool of options?
- **The Filter Logic**: Why was the decision made ?
- **The Outcome**: What was selected/generated and passed to the next step?

## The SDK wrapper

- The SDK must be minimal and simple. Developers should not have to rewrite their logic to inspect it. We will use Higher-Order Functions (JS/TS) to wrap blocks of code.
- **trace_id Propagation**: Automatically handles passing a unique ID down the chain (async-aware).
- **log_llm()**: A specialized logger for non-deterministic blocks (captures prompt, model version,reasoning and raw completion).

## The X-Ray API Design

The API needs two distinct layers: an Ingestion Layer and a Query Layer.

### A. Ingest Endpoints (Write-Heavy)

- This must be non-blocking. The SDK pushes data here asynchronously.
- **POST /v1/trace**: Starts a new trace session.
- **POST /v1/event**: Appends a step, decision, or log to an existing trace.
- **Payload**: JSONB structured data (flexible schema to allow any domain data).

### B. Query Endpoints (Read-Heavy)

- This allows the frontend or debugger tool to reconstruct the pipeline.
- **GET /v1/traces/{trace_id}**: Returns the full hierarchical tree of that specific execution.



## Data Storage Strategy

- **Primary Store**: PostgreSQL (with JSONB).
    - **Why**: We need to store arbitrary "inputs" and "outputs" which will vary wildly between different pipeline steps.


## Implementation step

- Set up a simple Express (Node) server to receive JSON logs.
- Store logs in PostgreSQL.
- Create a basic UI that renders a view of a trace (Input -> 100 candidates -> Filter -> 5 candidates -> Rank -> 1 winner).





## Visualizing the "Why" in the Dashboard

When we query this data in our X-Ray UI, we will present a Decision Card rather than a log line.

### Keyword Step (Failed)

- **Input**: "Sony WH-1000XM5 Noise Canceling"
- **Output**: ["speaker", "hifi"] (Wrong!)
- **X-Ray Analysis (The "Why")**:
    - **1. Reasoning Trace**: "The title mentions 'Noise Canceling' which implies audio output. I associated 'Sony' with high-end speakers rather than headphones."
    - **2. Confidence**: 0.6 (Low)
    - **3. Fix**: The reasoning reveals a category hallucination. You know to update the prompt to prioritize "Headphones" for this model number.