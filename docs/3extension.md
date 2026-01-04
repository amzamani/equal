# X-Ray Extensibility Analysis

**Objective:** Assess whether the current X-Ray architecture (LLMEvent, DecisionEvent, CustomEvent) supports extensibility.

## 1. Scenario Coverage

The current architecture is built around Event Sourcing with three core primitives:

*   **LLMEvent:** Captures non-deterministic generation, prompts, reasoning, and tokens.
*   **DecisionEvent:** Captures "funnel" logic—filtering, ranking, and selection.
*   **CustomEvent:** Captures arbitrary context, intermediate states, or external signals.

### Scenario A: Competitor Discovery (Implemented)
**Flow:** Generate Keywords (LLM) → Search (API) → Filter (Decision) → Rank (Score).

*   **Status:** ✅ Supported.
*   **Analysis:** We successfully implemented this using `logLLM` (Keyword Gen) and `logDecision` (Search/Filtering). The Viewer correctly visualises the drop rates and reasoning.

### Scenario B: Listing Quality Optimisation
**Flow:**
1. Analyse Current Listing (LLM)
2. Extract Competitor Patterns (LLM/Retrieval)
3. Generate Variations (LLM x N)
4. Select Best Version (Decision/Scoring)

*   **Status:** ✅ Deeply Supported.
*   **Analysis:**
    *   **Parallelism:** The "Generate Variations" step often involves multiple parallel LLM calls. X-Ray's flat event stream for a `trace_id` handles parallel sequences naturally.
    *   **Selection:** The "Select Best" step is a classic `DecisionEvent`: `input_count` (variations generated) → `kept` (selected version) → `dropped` (rejected versions with reasons like `too_long`, `tone_mismatch`).

### Scenario C: Product Categorisation
**Flow:**
1. Extract Attributes (LLM/Parser)
2. Match against 10k+ categories (Vector Search / Rules)
3. Score Confidence (Model)
4. Select Category (Decision)

*   **Status:** ✅ Supported.
*   **Analysis:**
    *   **Large Scale Decisions:** The `DecisionEvent` schema supports dropped buckets (e.g., `{ reason: 'wrong_department', count: 9000 }`), making it efficient to log decisions even when filtering against huge datasets (10k categories).
    *   **Ambiguity:** `LLMEvent`'s reasoning field is perfect for logging why the system resolved an ambiguous case (e.g., "Phone charger is electronics, not office").

---

## 2. Future Extensibility

The architecture uses PostgreSQL JSONB for event storage, which decouples the schema from the storage engine. This allows us to extend capabilities without breaking changes.

### Potential Extensions

#### Tool Use / Agentic Tracing
*   **Capability:** Trace tool inputs, outputs, and execution time.
*   **Implementation:** Just add a new `event_type: 'tool_call'` to the JSON schema. All events are grouped by `trace_id`.

#### Human-in-the-Loop (RLHF)
*   **Capability:** Capture user feedback on a decision (Thumbs Up/Down, Corrections).
*   **Implementation:** A `FeedbackEvent` linked via `trace_id`. The Viewer can aggregate this to show "Success Rate" based on real user feedback.

#### Embedding / Vector Search
*   **Capability:** Debug "Why did this vector search return these results?".
*   **Implementation:** `RetrievalEvent` containing `query_vector_summary`, `top_k`, and `distance_metrics`.

#### Distributed Context
*   **Capability:** Trace across microservices.
*   **Implementation:** The `trace_id` is a UUID string. Passing this header allows X-Ray to stitch together events from Python, Go, and Node.js services into one timeline.

## Conclusion

The X-Ray architecture is highly extensible. By focusing on a flat event stream per `trace_id` rather than hierarchical spans, it models the messiness of AI pipelines (loops, retries, parallel branches) accurately and simply.