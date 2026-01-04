import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Code, Brain, CheckCircle } from 'lucide-react';

export function DocsPage() {
    return (
        <div className="space-y-6 max-w-5xl">
            <div>
                <h1 className="text-3xl font-bold">X-Ray SDK Documentation</h1>
                <p className="text-muted-foreground mt-2">
                    Event-based observability for AI decision systems
                </p>
            </div>

            {/* Quick Start */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Brain className="w-5 h-5 text-violet-500" />
                        <CardTitle>Quick Start</CardTitle>
                    </div>
                    <CardDescription>Get started with the X-Ray SDK</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-3">
                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <h4 className="font-semibold mb-1">1. Install the SDK</h4>
                                <pre className="bg-secondary p-3 rounded-md text-sm overflow-x-auto">
                                    <code>npm install @xray/sdk</code>
                                </pre>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <h4 className="font-semibold mb-1">2. Initialize XRayLogger</h4>
                                <pre className="bg-secondary p-3 rounded-md text-sm overflow-x-auto">
                                    <code>{`import { XRayLogger } from '@xray/sdk';

const xray = new XRayLogger({
  service: 'my-service',
  endpoint: 'http://localhost:3000'
});`}</code>
                                </pre>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <h4 className="font-semibold mb-1">3. Log LLM Events</h4>
                                <pre className="bg-secondary p-3 rounded-md text-sm overflow-x-auto">
                                    <code>{`const traceId = xray.createTrace();

// Call your LLM
const response = await openai.chat.completions.create({
  model: "gpt-4",
  messages: [{ role: "user", content: prompt }]
});

// Log the event
await xray.logLLM({
  // REQUIRED: Trace identifier
  trace_id: traceId,
  timestamp: new Date().toISOString(),
  duration_ms: 567,
  
  // REQUIRED: Reasoning context
  reasoning: {
    summary: "Selected top 3 products based on relevance",
    effort: "medium",
    confidence: 0.85
  },
  
  // REQUIRED: Model info
  model: { provider: 'openai', name: 'gpt-4' },
  
  // REQUIRED: Input data
  input: {
    user_prompt_hash: 'hash_abc123',
    raw_prompt: prompt, // OPTIONAL: for debugging
    input_tokens: 150
  },
  
  // REQUIRED: Output data
  output: {
    response_hash: 'hash_def456',
    response_text: response.choices[0].message.content, // OPTIONAL
    output_tokens: 200
  },
  
  // REQUIRED: Model parameters
  params: { temperature: 0.7 }
});`}</code>
                                </pre>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <h4 className="font-semibold mb-1">4. Log Decision Events</h4>
                                <pre className="bg-secondary p-3 rounded-md text-sm overflow-x-auto">
                                    <code>{`// Track filtering/funnel decisions
await xray.logDecision({
  // REQUIRED: Trace identifier
  trace_id: traceId,
  timestamp: new Date().toISOString(),
  duration_ms: 5,
  
  // REQUIRED: Decision breakdown
  decision: {
    input_count: 50,
    output_count: 3,
    kept: [{ count: 3, reason: "high_relevance" }],
    dropped: [
      { count: 40, reason: "price_too_high" },
      { count: 7, reason: "out_of_stock" }
    ]
  },
  
  // OPTIONAL: Decision criteria context
  criteria: { max_price: 300 }
});`}</code>
                                </pre>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="flex-1">
                                <h4 className="font-semibold mb-1">5. Add Metadata (Rejected/Selected Items)</h4>
                                <pre className="bg-secondary p-3 rounded-md text-sm overflow-x-auto">
                                    <code>{`// Store rejected and selected items in metadata
await xray.logDecision({
  trace_id: traceId,
  timestamp: new Date().toISOString(),
  duration_ms: 150,
  decision: {
    input_count: 100,
    output_count: 5,
    kept: [{ count: 5, reason: "meets_criteria" }],
    dropped: [
      { count: 60, reason: "price_too_high" },
      { count: 35, reason: "out_of_stock" }
    ]
  },
  
  // ✅ Add rejected and selected items in metadata
  metadata: {
    // Selected items with full details
    selected_items: [
      { id: 'prod-789', name: 'Widget C', price: 149, score: 0.95 }
    ],
    
    // Rejected items grouped by reason
    rejected_items: {
      price_too_high: [
        { id: 'prod-123', name: 'Widget A', price: 299, 
          rejection_details: 'Price $299 exceeds max $200' }
      ],
      out_of_stock: [
        { id: 'prod-456', name: 'Widget B', price: 199,
          rejection_details: 'Product not available' }
      ]
    },
    
    // Add domain context for cross-domain analytics
    domain: 'ecommerce',
    user_id: 'user-123',
    search_query: 'gaming headphones'
  }
});`}</code>
                                </pre>
                                <p className="text-xs text-muted-foreground mt-2">
                                    💡 The Viewer automatically displays selected items (green cards) and rejected items (red cards) from metadata!
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Metadata Guide */}
            <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                    <CardTitle>Metadata: Storing Custom Data</CardTitle>
                    <CardDescription>Add rejected items, user context, and domain-specific data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2">What is Metadata?</h4>
                        <p className="text-sm text-muted-foreground">
                            The <code className="bg-white px-1 py-0.5 rounded">metadata</code> field is available on all events (LLM, Decision, Custom)
                            and allows you to store <strong>any custom data</strong> as key-value pairs. This is perfect for:
                        </p>
                        <ul className="text-sm text-muted-foreground mt-2 space-y-1 ml-4 list-disc">
                            <li><strong>Rejected/Selected Items</strong>: Full details of items that passed or failed filters</li>
                            <li><strong>User Context</strong>: user_id, session_id, tier, preferences</li>
                            <li><strong>Domain Tags</strong>: domain, category, region for cross-domain analytics</li>
                            <li><strong>A/B Testing</strong>: experiment_id, variant, feature_flags</li>
                            <li><strong>Custom Tags</strong>: Any other data relevant to your use case</li>
                        </ul>
                    </div>

                    <div className="bg-white p-3 rounded border">
                        <p className="text-xs font-semibold mb-2">Example: E-commerce Product Filtering</p>
                        <pre className="text-xs overflow-x-auto"><code>{`metadata: {
  // Selected items
  selected_items: [
    { id: 'p1', name: 'Gaming Chair', price: 299, score: 0.95 }
  ],
  
  // Rejected items grouped by reason
  rejected_items: {
    price_too_high: [
      { id: 'p2', name: 'Premium Chair', price: 599,
        rejection_details: 'Price $599 exceeds max $300' }
    ],
    out_of_stock: [
      { id: 'p3', name: 'Office Chair', price: 249,
        rejection_details: 'Product not available' }
    ]
  },
  
  // Domain context
  domain: 'ecommerce',
  category: 'furniture',
  user_id: 'user-123',
  search_query: 'gaming chair'
}`}</code></pre>
                    </div>

                    <div className="bg-white p-3 rounded border">
                        <p className="text-xs font-semibold mb-2">Example: Fraud Detection</p>
                        <pre className="text-xs overflow-x-auto"><code>{`metadata: {
  domain: 'fraud_detection',
  risk_threshold: 0.8,
  transaction_type: 'wire_transfer',
  region: 'us-west',
  flagged_transactions: [
    { id: 'tx-001', amount: 50000, risk_score: 0.92,
      reason: 'unusual_amount' }
  ]
}`}</code></pre>
                    </div>

                    <div className="bg-white p-3 rounded border">
                        <p className="text-xs font-semibold mb-2">Example: Medical Diagnosis</p>
                        <pre className="text-xs overflow-x-auto"><code>{`metadata: {
  domain: 'healthcare',
  specialty: 'cardiology',
  patient_age: 45,
  symptoms: ['chest_pain', 'shortness_of_breath'],
  ruled_out_diagnoses: [
    { condition: 'anxiety', probability: 0.15 },
    { condition: 'gerd', probability: 0.25 }
  ]
}`}</code></pre>
                    </div>

                    <div className="border-t pt-3 mt-3">
                        <h4 className="font-semibold text-sm mb-2">Viewer Display</h4>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-green-500 rounded"></div>
                                <span><strong>Selected Items</strong>: Displayed in green cards with checkmark (✓)</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded"></div>
                                <span><strong>Rejected Items</strong>: Displayed in red cards with X mark (✗), grouped by reason</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                <span><strong>Search Context</strong>: Displays query parameters and filters used</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t pt-3 mt-3">
                        <h4 className="font-semibold text-sm mb-2">Cross-Domain Analytics</h4>
                        <p className="text-xs text-muted-foreground mb-2">
                            Query across different domains using metadata filters:
                        </p>
                        <pre className="text-xs bg-secondary p-2 rounded overflow-x-auto"><code>{`# Query fraud detection traces with high drop rates
GET /v1/analytics/high-drop-traces?threshold=0.9&metadata.domain=fraud_detection

# Query medical diagnosis traces
GET /v1/analytics/high-drop-traces?threshold=0.8&metadata.domain=healthcare

# Query e-commerce product filtering
GET /v1/analytics/high-drop-traces?threshold=0.7&metadata.domain=ecommerce`}</code></pre>
                    </div>
                </CardContent>
            </Card>

            {/* API Reference */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Code className="w-5 h-5 text-primary" />
                        <CardTitle>API Reference</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <ApiMethod
                        name="xray.logLLM(event)"
                        description="Log an LLM call with reasoning and context"
                        params={[
                            { name: 'trace_id', type: 'string', desc: 'Unique trace identifier' },
                            { name: 'reasoning.summary', type: 'string', desc: 'Natural language explanation of the decision' },
                            { name: 'reasoning.confidence', type: 'number', desc: 'Confidence score (0-1)' },
                            { name: 'model', type: '{ provider: string, name: string }', desc: 'Model information' },
                            { name: 'input', type: 'object', desc: 'Input data with tokens and optional raw_prompt' },
                            { name: 'output', type: 'object', desc: 'Output data with tokens and optional response_text' },
                            { name: 'params', type: 'object', desc: 'Model parameters (temperature, etc.)' },
                            { name: 'metadata', type: 'Record<string, any>', desc: 'OPTIONAL: Custom key-value pairs (user_id, experiment_id, etc.)' },
                        ]}
                    />
                    <ApiMethod
                        name="xray.logDecision(event)"
                        description="Log a decision/filtering step for funnel analysis"
                        params={[
                            { name: 'trace_id', type: 'string', desc: 'Unique trace identifier' },
                            { name: 'decision.input_count', type: 'number', desc: 'Number of items before filtering' },
                            { name: 'decision.output_count', type: 'number', desc: 'Number of items after filtering' },
                            { name: 'decision.kept', type: 'Array<{count, reason}>', desc: 'Breakdown of kept items by reason' },
                            { name: 'decision.dropped', type: 'Array<{count, reason}>', desc: 'Breakdown of dropped items by reason' },
                            { name: 'criteria', type: 'object', desc: 'Decision criteria used' },
                            { name: 'metadata', type: 'Record<string, any>', desc: 'OPTIONAL: Custom key-value pairs (user_id, experiment_id, etc.)' },
                        ]}
                    />
                    <ApiMethod
                        name="xray.logCustom(eventType, data)"
                        description="Log a custom event"
                        params={[
                            { name: 'eventType', type: 'string', desc: 'Custom event type name' },
                            { name: 'data', type: 'any', desc: 'Event data' },
                        ]}
                    />
                    <ApiMethod
                        name="xray.createTrace()"
                        description="Generate a unique trace ID for grouping related events"
                        params={[]}
                    />
                </CardContent>
            </Card>

            {/* Understanding Trace IDs */}
            <Card className="border-blue-200 bg-blue-50/50">
                <CardHeader>
                    <CardTitle>Understanding Trace IDs</CardTitle>
                    <CardDescription>How to group related events</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold mb-2 flex items-center gap-2">
                            <span className="text-blue-600">trace_id</span>
                            <span className="text-sm font-normal text-muted-foreground">= "grouping key" for the whole operation</span>
                        </h4>
                        <p className="text-sm text-muted-foreground">
                            Use <code className="bg-white px-1 py-0.5 rounded">xray.createTrace()</code> <strong>once per end-to-end operation</strong> (one user request, one job run, one pipeline execution).
                            Every event you log for that operation should reuse the same <code className="bg-white px-1 py-0.5 rounded">trace_id</code>.
                        </p>
                    </div>


                    <div className="bg-white p-3 rounded border">
                        <p className="text-xs font-mono text-muted-foreground mb-2">Example:</p>
                        <pre className="text-xs"><code>{`const traceId = xray.createTrace(); // Once per request

// Event 1: LLM call
await xray.logLLM({ trace_id: traceId, ... });

// Event 2: Decision step
await xray.logDecision({ trace_id: traceId, ... });

// Event 3: Another LLM call
await xray.logLLM({ trace_id: traceId, ... });`}</code></pre>
                    </div>
                </CardContent>
            </Card>

            {/* Best Practices */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <CardTitle>Best Practices</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-3">
                        <BestPracticeItem
                            title="Always log reasoning for LLM calls"
                            description="Reasoning is the most important part - it helps you understand why the LLM made a decision"
                        />
                        <BestPracticeItem
                            title="Use consistent trace IDs"
                            description="Group related events with the same trace_id to see the full pipeline"
                        />
                        <BestPracticeItem
                            title="Include raw_prompt and response_text in development"
                            description="These optional fields help with debugging but should be omitted in production for PII protection"
                        />
                        <BestPracticeItem
                            title="Track all decision points"
                            description="Use logDecision() for every filtering/selection step to visualize your funnel"
                        />
                        <BestPracticeItem
                            title="Use metadata for rejected/selected items and context"
                            description="Store rejected and selected items in metadata for detailed debugging. Add domain tags (domain, user_id, region) for cross-domain analytics"
                        />
                        <BestPracticeItem
                            title="Keep metadata structured and consistent"
                            description="Use nested objects (rejected_items.price_too_high) instead of flat keys. Standardize field names across services"
                        />
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}

function ApiMethod({ name, description, params }: { name: string; description: string; params: Array<{ name: string; type: string; desc: string }> }) {
    return (
        <div className="border-l-2 border-primary pl-4 space-y-2">
            <div>
                <code className="text-sm font-semibold font-mono">{name}</code>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>
            {params.length > 0 && (
                <div className="space-y-1">
                    {params.map((param, i) => (
                        <div key={i} className="text-xs">
                            <span className="font-mono font-semibold">{param.name}</span>
                            <span className="text-muted-foreground"> ({param.type})</span>
                            <span className="text-muted-foreground"> - {param.desc}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function BestPracticeItem({ title, description }: { title: string; description: string }) {
    return (
        <li className="flex gap-3">
            <CheckCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
                <h4 className="font-semibold text-sm">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </li>
    );
}
