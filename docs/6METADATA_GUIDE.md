# Adding Rejected Items and Custom Metadata in X-Ray SDK

The X-Ray SDK provides a flexible `metadata` field on all events that allows developers to attach any custom data, including rejected items, intermediate results, or domain-specific context.

## Quick Example

```typescript
import { XRayLogger } from '@xray/sdk';

const xray = new XRayLogger({ service: 'product-filter' });
const traceId = xray.createTrace();

// Log a decision with rejected items in metadata
await xray.logDecision({
    trace_id: traceId,
    timestamp: new Date().toISOString(),
    duration_ms: 150,
    decision: {
        input_count: 100,
        output_count: 5,
        kept: [{ count: 5, reason: 'meets_all_criteria' }],
        dropped: [
            { count: 60, reason: 'price_too_high' },
            { count: 35, reason: 'out_of_stock' }
        ]
    },
    // ✅ Add rejected items and any custom data here
    metadata: {
        rejected_items: [
            { id: 'prod-123', name: 'Widget A', price: 299, reason: 'price_too_high' },
            { id: 'prod-456', name: 'Widget B', price: 199, reason: 'out_of_stock' },
            // ... more rejected items
        ],
        price_threshold: 150,
        stock_threshold: 10,
        user_id: 'user-789',
        session_id: 'sess-abc'
    }
});
```

## Use Cases

### 1. **Rejected Items with Full Details**

Store complete information about rejected items for debugging:

```typescript
await xray.logDecision({
    trace_id: traceId,
    timestamp: new Date().toISOString(),
    duration_ms: 200,
    decision: {
        input_count: 50,
        output_count: 3,
        kept: [{ count: 3, reason: 'high_relevance_score' }],
        dropped: [
            { count: 30, reason: 'low_relevance' },
            { count: 17, reason: 'category_mismatch' }
        ]
    },
    metadata: {
        // Full rejected item details
        rejected_items: [
            {
                id: 'item-001',
                title: 'Gaming Mouse',
                score: 0.45,
                category: 'Electronics',
                rejection_reason: 'low_relevance',
                rejection_details: 'Score below 0.7 threshold'
            },
            // ... more items
        ],
        // Query context
        search_query: 'ergonomic office chair',
        user_preferences: { budget: 500, brand: 'Herman Miller' }
    }
});
```

### 2. **LLM Reasoning with Rejected Candidates**

When using LLMs to make decisions, store rejected options:

```typescript
await xray.logLLM({
    trace_id: traceId,
    timestamp: new Date().toISOString(),
    duration_ms: 1200,
    reasoning: {
        summary: 'Selected best category match based on keywords',
        effort: 'medium',
        confidence: 0.85,
        decision_factors: ['keyword_overlap', 'semantic_similarity'],
        alternatives_considered: ['Furniture > Chairs', 'Office > Seating']
    },
    model: {
        provider: 'openai',
        name: 'gpt-4'
    },
    input: {
        input_tokens: 450,
        raw_prompt: 'Categorize: ergonomic gaming chair...'
    },
    output: {
        output_tokens: 120,
        response_text: 'Furniture > Chairs > Gaming Chairs'
    },
    metadata: {
        // Store rejected category options
        rejected_categories: [
            {
                path: 'Furniture > Chairs > Office Chairs',
                score: 0.72,
                reason: 'Missing gaming keyword'
            },
            {
                path: 'Sports > Gaming > Accessories',
                score: 0.45,
                reason: 'Wrong primary category'
            }
        ],
        selected_category: {
            path: 'Furniture > Chairs > Gaming Chairs',
            score: 0.91
        }
    }
});
```

### 3. **Multi-Stage Pipeline with Intermediate Results**

Track rejected items at each stage:

```typescript
// Stage 1: Keyword filtering
await xray.logDecision({
    trace_id: traceId,
    timestamp: new Date().toISOString(),
    duration_ms: 50,
    decision: {
        input_count: 1000,
        output_count: 150,
        kept: [{ count: 150, reason: 'keyword_match' }],
        dropped: [{ count: 850, reason: 'no_keyword_match' }]
    },
    metadata: {
        stage: 'keyword_filter',
        keywords: ['gaming', 'chair', 'ergonomic'],
        sample_rejected: [
            { id: 'p1', title: 'Office Desk', reason: 'no_keyword_match' },
            { id: 'p2', title: 'Standing Desk', reason: 'no_keyword_match' }
        ]
    }
});

// Stage 2: Price filtering
await xray.logDecision({
    trace_id: traceId,
    timestamp: new Date().toISOString(),
    duration_ms: 30,
    decision: {
        input_count: 150,
        output_count: 45,
        kept: [{ count: 45, reason: 'within_budget' }],
        dropped: [{ count: 105, reason: 'price_too_high' }]
    },
    metadata: {
        stage: 'price_filter',
        max_price: 300,
        sample_rejected: [
            { id: 'p10', title: 'Premium Gaming Chair', price: 599, reason: 'price_too_high' },
            { id: 'p11', title: 'Executive Chair', price: 450, reason: 'price_too_high' }
        ]
    }
});
```

### 4. **Domain-Specific Context**

Add domain-specific metadata for cross-domain analytics:

```typescript
// Fraud detection
await xray.logDecision({
    trace_id: traceId,
    timestamp: new Date().toISOString(),
    duration_ms: 100,
    decision: {
        input_count: 500,
        output_count: 12,
        kept: [{ count: 12, reason: 'high_risk' }],
        dropped: [
            { count: 450, reason: 'low_risk' },
            { count: 38, reason: 'insufficient_data' }
        ]
    },
    metadata: {
        domain: 'fraud_detection',
        risk_threshold: 0.8,
        transaction_type: 'wire_transfer',
        region: 'us-west',
        flagged_transactions: [
            { id: 'tx-001', amount: 50000, risk_score: 0.92, reason: 'unusual_amount' },
            { id: 'tx-002', amount: 15000, risk_score: 0.85, reason: 'velocity_check' }
        ]
    }
});

// Medical diagnosis
await xray.logDecision({
    trace_id: traceId,
    timestamp: new Date().toISOString(),
    duration_ms: 250,
    decision: {
        input_count: 20,
        output_count: 3,
        kept: [{ count: 3, reason: 'high_probability' }],
        dropped: [{ count: 17, reason: 'low_probability' }]
    },
    metadata: {
        domain: 'healthcare',
        specialty: 'cardiology',
        patient_age: 45,
        symptoms: ['chest_pain', 'shortness_of_breath'],
        ruled_out_diagnoses: [
            { condition: 'anxiety', probability: 0.15 },
            { condition: 'gerd', probability: 0.25 }
        ]
    }
});
```

## Querying Metadata in Analytics

The metadata is automatically indexed and queryable through the analytics API:

```bash
# Query fraud detection traces with high drop rates
curl "http://localhost:3000/v1/analytics/high-drop-traces?threshold=0.9&metadata.domain=fraud_detection&metadata.region=us-west"

# Query medical traces for specific specialty
curl "http://localhost:3000/v1/analytics/high-drop-traces?threshold=0.8&metadata.domain=healthcare&metadata.specialty=cardiology"

# Discover available metadata values
curl "http://localhost:3000/v1/analytics/metadata-values?field=domain"
```

## Best Practices

### 1. **Keep Metadata Structured**
```typescript
// ✅ Good: Structured metadata
metadata: {
    rejected_items: [...],
    filter_config: { threshold: 0.7, max_results: 10 },
    user_context: { id: 'user-123', tier: 'premium' }
}

// ❌ Avoid: Flat, unorganized metadata
metadata: {
    item1_id: 'p1',
    item1_reason: 'low_score',
    item2_id: 'p2',
    // ... hard to query
}
```

### 2. **Use Consistent Field Names**
```typescript
// ✅ Good: Consistent across services
metadata: {
    domain: 'ecommerce',  // Always lowercase
    user_id: 'user-123',  // Always snake_case
    rejected_items: []    // Always plural for arrays
}
```

### 3. **Limit Metadata Size**
```typescript
// ✅ Good: Store samples or summaries
metadata: {
    sample_rejected: items.slice(0, 10),  // First 10 items
    total_rejected: items.length,
    rejection_summary: {
        by_reason: { 'low_score': 45, 'out_of_stock': 30 }
    }
}

// ❌ Avoid: Storing thousands of items
metadata: {
    all_rejected_items: [...1000s of items...]  // Too large
}
```

### 4. **Add Domain Tags for Cross-Domain Analytics**
```typescript
// Always include domain tag for cross-domain queries
metadata: {
    domain: 'fraud_detection',  // Enables filtering across domains
    // ... other metadata
}
```

## TypeScript Type Safety

For better type safety, define your metadata interfaces:

```typescript
interface ProductFilterMetadata {
    rejected_items: Array<{
        id: string;
        title: string;
        price: number;
        score: number;
        reason: string;
    }>;
    filter_config: {
        price_max: number;
        score_threshold: number;
    };
    user_context?: {
        id: string;
        preferences: Record<string, any>;
    };
}

// Use with type assertion
await xray.logDecision({
    trace_id: traceId,
    timestamp: new Date().toISOString(),
    duration_ms: 100,
    decision: { /* ... */ },
    metadata: {
        rejected_items: [...],
        filter_config: { price_max: 300, score_threshold: 0.7 }
    } as ProductFilterMetadata
});
```

## Summary

The `metadata` field provides unlimited flexibility for:
- ✅ Storing rejected items with full details
- ✅ Adding domain-specific context
- ✅ Tracking intermediate pipeline results
- ✅ Enabling cross-domain analytics
- ✅ Debugging complex decision flows

All metadata is automatically queryable through the analytics API and visible in the X-Ray Viewer UI.
