# X-Ray Architecture

X-Ray is a tool that helps us understand **why** AI systems make certain decisions. Unlike other tools that just tell you "something failed" or "it took 5 seconds," X-Ray tells you the *reasoning* behind the result.

## The Problem: Why did the AI do that?

Imagine you ask an AI to find "wireless headphones" but it gives you a "bluetooth adapter." Why? You can't just "step through" the AI's brain like code debugging.

Our solution is simple: **Make the AI write down its thoughts.**

Instead of just getting the answer, we ask the AI to give us:

1. The **Reasoning** (Why did I choose this?)
2. The **Confidence** (How sure am I?)
3. The **Result** (The actual answer)

X-Ray captures all this so you can read it later.

---

## 1. How It Works

The system has three simple parts:

1. **The SDK (The Reporter)**: A small library you add to your app. It watches what your AI does and sends reports (events) to our server.
2. **The API (The Storage)**: A server that receives these reports and saves them safely in a database.
3. **The Viewer (The Dashboard)**: A website where you can look at the decisions and visualise them( just basic abstraction of the query API )

![Architecture Diagram](/image%20copy%202.png)

The detailed API spec is available in the `docs/5API-SPEC.md` file. [API Spec](docs/5API-SPEC.md) 

---

## 2. Defining the Data Model

We don't use complicated tables. We treat everything as an **Event**. Think of an event like a log entry, but better.

We store everything in a simple table called `events`. Inside, we use a flexible storage format called **JSON**.

We chose an **Event-Sourcing** model over the traditional Trace/Span hierarchy for flexibility.

**Core Schema (`events` table)**

| **Field** | **Type** | **Description** |
| --- | --- | --- |
| `id` | UUID | Primary key |
| `event_type` | String | Discriminator: `llm_call`, `decision`, `http_request`, `custom` |
| `trace_id` | UUID | Grouping ID for a full request/pipeline run |
| `span_id` | UUID | Unique event/span (same as id for now, can be used for extension) identifier |
| `parent_span_id` | UUID | Optional parent span for hierarchical relationships (can be used for extension) |
| `service` | String | Service name (e.g., `competitor-search-ui`) |
| `timestamp` | Timestamp | When the event occurred |
| `duration_ms` | Integer | Event duration in milliseconds |
| `data` | JSONB | Full event payload (schemaless storage for flexibility) |
| `created_at` | Timestamp | When the event was ingested into the database |

**Rationale**

**Why SQL ?**

- Makes querying easier and faster to get analytics, SQL is preferred, in future we can also have an NLP dashboard, which can answer questions like “how much average is drop off rate among all events name competitor-search” and this will generate an SQL in backend and run and will give answer in natural language.

**Why JSONB over normalized tables?**

- Different events have vastly different structures. An LLM event has `tokens` and `reasoning`; a Decision event has `input_count` and `dropped_reasons`.
- JSONB allows us to index fields like `data->>'model'` without rigid schema migrations.
- **Alternative considered:** Separate tables per event type (`llm_events`, `decision_events`). **Rejected** because querying across event types would require complex UNION queries, and adding new event types would require schema migrations.
- **Trade-off:** JSONB queries are slightly slower than indexed columns, but the flexibility is worth it for an evolving system.

**Why flat events over hierarchical spans?**

- Pipelines are often non-linear (loops, retries, parallel branches).
- **Alternative** **Rejected** because it adds complexity for developers (managing span lifecycle) and doesn't fit AI pipelines well.Though currently present in db schema, can be used later for extendibility
- **Trade-off:** We lose automatic call-graph visualization, but gain simplicity and flexibility.

**What would break if we'd made different choices?**

- **If we used hierarchical spans:** Developers would need to manually manage span creation/closure, making the SDK harder to use.

---

## 3. Debugging a Real Problem

Let's walk through a real scenario.

**The Problem:**
You are building an online store search.
User searches for: **"Laptop Stand"**
Result includes: **"Phone Case"** (Wrong!)

**How to fix it with X-Ray:**

1. **Open the Viewer:** Go to the dashboard.
2. **Find the Event:** unique ID for that specific search action.
3. You can use the analytics API endpoint or RAW SQL as well to achieve this.
4. **Inspect Event**
    - **Action:** Click on a trace to view its timeline
    - **See:** All events for that trace, ordered by timestamp
    - **Look for:**
        - LLM events
        - Decision events
        - Selected and rejected items with reason
    - You see a list of 50 products found.
    - You see the status "Selected" or "Rejected" for each.
    - You see the "Phone Case" was **Selected**.
5. **Examine the LLM Event:**
    - **Action:** Click on the LLM event card
    - **See:**
        - **Reasoning section** (highlighted): "Both are tech accessories that improve device usability..."
        - **Confidence**: 0.85
        - **Model**: openai/gpt-5, temperature: 0.7
        - **Input/Output**: Full prompt and response (if `raw_prompt` and `response_text` were logged)
    - **Diagnosis:** The reasoning reveals the LLM used overly broad matching criteria
6. **Look at the "LLM" Event:**
    - You see the AI's reasoning: *"The phone case is a stand for a device, and a laptop is a device, so this is relevant."*
7. **The Fix:** The AI is being too broad! You now know exactly what to change in your prompt: *"Only match items that strictly fit the user's specific query category."*

---

## 4. Queryability

Your boss asks: *"Show me every time our filter rejected more than 90% of the products."*

Because we standardized the way we save "Decisions" (specifically saving `input_count` and `output_count`), we can answer this question easily, even if the decision was for shoes, cars, or job applicants.

**We support this in two ways:**

1. **For Simple Checks:** Use our Analytics API.
    - `GET /v1/analytics/high-drop-traces?threshold=0.9`
    - This gives you a list of all "strict" decisions instantly.
    - These APIs can be custom made, according to the frequent query that the developer might want to get answer to, and these are highly extendible.
    - The API spec doc also has more similar analytics query.
2. **For Complex Questions:** You can write SQL queries directly against our data.
    - *"Find me all decisions where the user was 'VIP' and the rejection reason was 'Price too high'."*
    - Since we store `metadata` (extra info), you can filter by anything you saved.

In Future we can have

- **Natural Language Queries**: We can have text-to-SQL LLM tool that can enable the user to ask in natural language any query and the tool will give answer directly, without the user writing any code, or performing any complex SQL query.

---

## 5. Performance (The 5,000 Item Problem)

What if you start with 5,000 items and filter down to 30?
Saving the details for all 4,970 rejected items would be huge and slow.

**Our Solution:**
We let the developer choose.The SDK provides a Metadata field using which developer can choose to store data in any way he likes.

1. **Summary Mode:** Just save the counts. *"Rejected 4,900 items because of price."* (Fast, cheap)
2. **Detail Mode:** Save the full list. (Good for debugging, but uses more space)
3. **Sample Mode:** Save the summary + the first 5 rejected items as examples.

We recommend "Summary Mode" by default to keep things fast, but give you the power to see details when you need them.

---

## 6. Developer Experience

We made it super easy to use.

**Events**:
There are primarily 2 types of events:

1. `logLLM`: Logs the input, output and reasoning of the LLM.
2. `logDecision`: Logs the list of items selected and rejected items and any other detail using meta data field.

**Minimal Setup:**
Just 3 lines of code.

```jsx
const xray = new XRayLogger({ service: "search-app" });
const traceId = xray.createTrace();

// Log what the AI did
await xray.logLLM({
    trace_id: traceId,
    model: { name: "gpt-4" },
    input: { prompt: "Find headphones..." },
    output: { text: "Here are 3 options..." }
});

```

**Full Instrumentation:**

```jsx
 
await xray.logDecision({
  trace_id: traceId,
  decision: {
    input_count: candidates.length,
    output_count: filtered.length,
    dropped: [{ reason: 'price', count: 5 }]
  }
});
```

**Full Setup:**
You can add `metadata` to save extra details like User ID, Region, or A/B Test Group.

**What if the X-Ray server crashes?**
Your app **will not break**. The SDK is designed to fail silently (it just logs an error to your console) so your users never experience a crash just because our logging tool is down.

---

## 7. Real World Example (Inngest)

I have worked previously with https://www.inngest.com/ which is an AI and backend workflow orchestrator.

![image.png](/image.png)

This Xray type logger can be fitted into Inngest (for background job orchestrating, logging and parent child span observability):

1. **Start a job**: Generate a `trace_id`.
2. **Pass it along**: Every step of the job uses that same ID.
3. **Log it**: When a step finishes, log it to X-Ray.

This way, even if the job takes 30 minutes and has 10 steps, you see one continuous story in the X-Ray Viewer.

---

## 8. What's Next?

We are building for the future.

- **Smarter Buffering**: We want the SDK to hold events for a second and send them in batches, to be even faster.
- **Natural Language Queries**: Imagine typing *"Show me the events where user searched for shoes and got 0 results"* and getting an answer without writing code.
- **Metadata Checks**: Helping teams agree on what "User ID" or other info to be passed should look like so data stays clean.
- Integration and customisation with Full Observability Platform

---