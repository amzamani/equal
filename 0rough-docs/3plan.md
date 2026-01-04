# X-Ray System Implementation Approach


## 1. Core Philosophy: The Decision Funnel
The fundamental difference between X-Ray and standard tracing is the unit of analysis. 
- **Tracing (Jaeger/OpenTelemetry):** Focuses on *Latency* and *Service Dependencies*. "How long did it take?"
- **X-Ray:** Focuses on *Data Reduction* and *Logic*. "Why was X chosen and Y discarded?"

My approach models the system as a **Funnel** where a large set of possibilities is progressively narrowing down to a final selection.

## 2. Proposed Data Model
To answer "Why did we drop candidate X?", the schema needs to be aware of sets and predicates, not just strings.

### Key Entities
1.  **Trace (Run):** A single execution flow (e.g., `trace_id: "competitor-select-123"`).
2.  **Step (Node):** A logical action (e.g., "Keyword Generation", "Price Filter").
3.  **Event (Decision):** The atomic unit of logic.
    *   **Type:** `Selection`, `Filter`, `Transformation`.
    *   **Input Set:** Summary or reference to the incoming candidates.
    *   **Logic:** The rule applied (e.g., `price < 50` or `LLM Similarity Score`).
    *   **Outcome:** `Kept`, `Dropped`, `Modified`.
    *   **Reasoning:** Structured (rule name) + Unstructured (LLM thoughts).

```json
// Conceptual usage
{
  "step": "filter_candidates",
  "total_input": 5000,
  "decisions": {
    "dropped": [
      { "reason": "price_mismatch", "count": 4500, "sample_item_id": "item_88" },
      { "reason": "rating_too_low", "count": 450, "sample_item_id": "item_99" }
    ],
    "kept": [
       { "id": "item_1", "reason": "matched_criteria" }
    ]
  }
}
```

## 3. Architecture & Components

### A. The SDK (Developer Interface)
The SDK must be minimally invasive. I would implement it as a **Context Manager** (Python) or **Wrapper/Hook** (Node/TS).

**Design Choice:** Separate *Control Flow* from *Data Flow* observation.
- Instead of just logging "Step done", the user logs "Candidates evaluated".

```typescript
// Proposed TS SDK Usage
const xray = new XRay({ service: "competitor-matcher" });

await xray.trace("select-competitor", async (trace) => {
  // Step 1: Capture the non-deterministic generation
  const keywords = await trace.step("generate_keywords", async (step) => {
    const kws = await llm.generate(...)
    step.logInput({ product_title: "..." });
    step.logResult(kws); // Captures the generated text
    return kws; 
  });

  // Step 2: The Funnel Step (High Volume)
  await trace.step("filter_candidates", async (step) => {
    const candidates = await db.search(keywords); // 5000 items
    
    // We don't log 5000 JSON objects. We use a 'Smart Logger' strategy.
    const filtered = candidates.filter(c => {
      if (c.price > target) {
        step.trackDrop(c.id, "price_too_high", { price: c.price }); // Aggregates in background
        return false;
      }
      return true;
    });
    
    step.trackKeep(filtered.length);
    return filtered;
  });
});
```

### B. The API & Storage (Backend)
- **Ingest:** High-throughput separate service (Go or Rust) that accepts async batches of logs. 
- **Storage Strategy:** 
  - **Structured Metadata (Postgres):** For searching runs (User ID, Status, Final Outcome).
  - **Trace Blobs (S3/Blob Storage + ClickHouse):** The heavy detail (reasoning, full lists) should be stored cheaply. ClickHouse is ideal for analytical queries like "Find all traces where 'price_filter' dropped > 90% of items".

### C. Scaling Strategy (The "5k Candidates" Problem)
**Decision:** **Aggregation over Enumeration.**
- **Default Mode:** The client SDK aggregates drops locally. It sends: `{"price_too_high": 4500, "example_ids": ["A", "B"]}`.
- **Debug Mode:** If `DEBUG=true` is passed in the context (or a specific Flag matched), we log FULL details. This allows "On-demand X-Ray" without bankrupting storage in production.

## 4. Debugging & Queryability
Visualizing the "Why".

### The "Funnel View" UI
Instead of a timeline, the main view is a **Sanky Diagram** or Funnel.
1.  **Start:** 20 Generated Keywords.
2.  **Search:** 5000 Products found.
3.  **Filter (Price):** 4500 Dropped (Red bar).
4.  **Rank (LLM):** 50 Evaluated -> 1 Selected.

**Query Example:** "Show me trace 123" -> Clicking the "Rank" step immediately reveals the LLM's raw output/reasoning: *"I chose product B because product A lacked 'waterproof' feature mentioned in user query."*

## 5. Implementation Roadmap
1.  **Proof of Concept (Day 1):** Simple TypeScript SDK that writes `xray-trace.json` to disk. Manual analysis of a broken "Amazon" pipeline.
2.  **API Build:** Tiny Express/FastAPI server to receive JSONs and dump to Postgres.
3.  **Visualization:** A React page using a library like `react-flow` to visualize the steps and a side-panel for the "Decision Data".

## 6. Real World Integration (Inngest)
For Inngest, X-Ray runs as a **Middleware**.
- Inngest steps are already distinct units of work. 
- The middleware can automatically capture Input/Output of every step.
- The user only needs to manually add the "Decision Logic" (why a specific output was chosen).

## 7. Future Proofing
- **Replayability:** Since we capture Inputs for every step, we can build a "Retry Step" button that grabs the input from a failed trace and re-runs *just that step* with new code or new LLM prompts.
