# Cross-Pipeline Query Support

Enable users to query "Show me all runs where the filtering step eliminated more than 90% of candidates" across different pipelines, both in the Viewer UI and via the Node.js API.

> [!IMPORTANT]
> **API Design Decision**: The analytics endpoints will be added under `/v1/analytics/*` to separate them from basic CRUD operations. This keeps the API organized and allows for future analytics features.

> [!NOTE]
> **Query Performance**: Initial implementation will query the database directly without caching. For production use with large datasets, we should consider adding:
> - Database indexes on JSONB fields (e.g., `decision.input_count`, `decision.output_count`)
> - Materialized views for common aggregations
> - Query result caching

## Handling Variability Across Diverse Use Cases

The X-Ray system is designed to be domain-agnostic and support queryability across vastly different use cases—from e-commerce pipelines to fraud detection, content moderation, medical diagnosis systems, financial risk assessment, and beyond.

### Variability Dimensions

#### 1. Event Structure Variability
- Core events (`llm_call`, `decision`, `http_request`) have standardized structures.
- Custom events allow arbitrary JSONB payloads for domain-specific needs.
- **Metadata** field enables tagging with domain-specific context (`user_id`, `experiment_id`, `region`, etc.).

#### 2. Decision Criteria Variability
Different domains have different filtering logic:
- **E-commerce**: Price range, ratings, stock availability.
- **Fraud Detection**: Risk score thresholds, velocity checks, blacklist matches.
- **Content Moderation**: Toxicity scores, policy violations, user reports.
- **Medical Diagnosis**: Symptom matches, test result thresholds, contraindications.
- **Loan Approval**: Credit score, debt-to-income ratio, employment verification.

#### 3. Reasoning Variability
LLM reasoning differs by domain:
- **Product matching**: "Both are wireless accessories..."
- **Fraud detection**: "Transaction pattern matches known fraud signature..."
- **Content moderation**: "Text contains hate speech indicators..."
- **Medical diagnosis**: "Symptoms align with differential diagnosis..."

## Enabling Cross-Domain Queryability

### Strategy 1: Standardized Event Contracts
- All **decision** events MUST have: `input_count`, `output_count`, `dropped[]`, `kept[]`.
- All **LLM** events MUST have: `reasoning`, `model`, `input`, `output`.
- This allows queries like "show high drop rates" to work across ANY domain.

### Strategy 2: Metadata-Based Filtering
The metadata field enables domain-specific queries without schema changes:

```json
// E-commerce pipeline
metadata: { domain: 'ecommerce', product_category: 'electronics', price_range: 'premium' }

// Fraud detection pipeline
metadata: { domain: 'fraud', risk_level: 'high', transaction_type: 'wire_transfer' }

// Medical diagnosis pipeline
metadata: { domain: 'healthcare', specialty: 'cardiology', urgency: 'critical' }
```

**Query examples:**

```sql
-- Find high drop rates in fraud detection systems
SELECT * FROM events 
WHERE event_type = 'decision' 
  AND data->'metadata'->>'domain' = 'fraud'
  AND (1 - (data->'decision'->>'output_count')::float / 
           (data->'decision'->>'input_count')::float) > 0.9;

-- Find all LLM calls in medical diagnosis with low confidence
SELECT * FROM events
WHERE event_type = 'llm_call'
  AND data->'metadata'->>'domain' = 'healthcare'
  AND (data->'reasoning'->>'confidence')::float < 0.7;
```

### Strategy 3: Flexible Analytics Endpoints
Our analytics endpoints accept optional metadata filters:

```bash
# Get high drop traces for fraud domain
GET /v1/analytics/high-drop-traces?threshold=0.9&metadata.domain=fraud&metadata.risk_level=high

# Aggregate drop reasons for cardiology
GET /v1/analytics/drop-reasons?metadata.specialty=cardiology
```

### Strategy 4: Reason String Conventions
We recommend (but don't enforce) `snake_case` reason strings:

- ✅ `price_too_high`, `risk_score_exceeded`, `toxicity_detected`
- ❌ `Price Too High`, `RiskScoreExceeded`, `TOXICITY_DETECTED`

This enables cross-domain aggregation:

```sql
-- Find most common drop reasons across ALL domains
SELECT 
    data->'decision'->'dropped'->0->>'reason' as reason,
    COUNT(*) as occurrences
FROM events
WHERE event_type = 'decision'
GROUP BY reason
ORDER BY occurrences DESC;
```

## Developer Constraints for Extensibility

### What we enforce (via TypeScript types)
- ✅ Required fields in core event types (`decision`, `llm_call`, etc.).
- ✅ SDK validates event structure before sending.
- ✅ `trace_id` and `service` are always present.

### What we enable (via flexibility)
- ✅ Custom event types with arbitrary JSONB payloads.
- ✅ **Metadata** field for domain-specific tagging.
- ✅ **Criteria** field in decision events for storing filter parameters.
- ✅ JSONB storage allows nested objects and arrays.

### What we recommend (via documentation)
- 📖 Use `snake_case` for reason strings.
- 📖 Include `domain` in metadata for multi-domain deployments.
- 📖 Use consistent service naming (e.g., `fraud-detection-v2`, not `FraudDetection`).
- 📖 Store decision criteria in the `criteria` field for auditability.

## Example: Fraud Detection Use Case

### SDK Usage:

```typescript
const xray = new XRayLogger({ 
  service: 'fraud-detection',
  metadata: { domain: 'fraud', version: 'v2' }
});

// Log a decision event
await xray.logDecision({
  trace_id: traceId,
  decision: {
    input_count: 1000,  // Transactions analyzed
    output_count: 15,   // Flagged as suspicious
    dropped: [
      { reason: 'risk_score_low', count: 950 },
      { reason: 'velocity_check_failed', count: 35 }
    ],
    kept: [
      { reason: 'risk_score_high', count: 10 },
      { reason: 'blacklist_match', count: 5 }
    ]
  },
  criteria: {
    risk_threshold: 0.75,
    velocity_window_minutes: 60,
    blacklist_version: 'v3.2'
  },
  metadata: {
    transaction_type: 'wire_transfer',
    region: 'us-west',
    customer_tier: 'premium'
  }
});
```

### Cross-Domain Query:

```sql
-- Find all pipelines (any domain) with >95% drop rates
SELECT 
    service,
    data->'metadata'->>'domain' as domain,
    COUNT(*) as high_drop_count
FROM events
WHERE event_type = 'decision'
  AND (1 - (data->'decision'->>'output_count')::float / 
           (data->'decision'->>'input_count')::float) > 0.95
GROUP BY service, domain
ORDER BY high_drop_count DESC;
```

This query works for fraud detection, e-commerce, content moderation, or any other domain using the X-Ray system.

## Future Extensibility Considerations

### 1. Schema Registry
- Optional registry for reason codes per domain.
- Enables autocomplete in Viewer UI.
- Validates reason strings at SDK level.
- *Example*: `fraud-detection` domain registers `risk_score_high`, `velocity_check_failed`, etc.

### 2. Custom Aggregations
- Allow users to define custom aggregation queries via UI.
- Save and share queries across teams.
- *Example*: "Show me all medical diagnosis traces where confidence < 0.8 AND specialty = cardiology"

### 3. Cross-Domain Benchmarking
- Compare drop rates across different domains.
- Identify outliers (e.g., "Why does fraud-detection have 95% drop rate while others have 70%?").
- Normalize metrics for fair comparison.