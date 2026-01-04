// Types for API responses

export interface Trace {
    id: string;
    service: string;
    name: string;
    status: 'running' | 'completed' | 'failed';
    startTime: number;
    endTime?: number;
    metadata: Record<string, any>;
    steps?: Step[];
}

export interface Step {
    id: string;
    traceId: string;
    name: string;
    type: 'generation' | 'retrieval' | 'filter' | 'transform' | 'selection';
    startTime: number;
    endTime?: number;
    input: StepIO;
    output: StepIO;
    decisions: DecisionSummary;
    reasoning?: {
        effort: string;
        summary: string;
    };
    error?: { message: string; stack?: string };
}

export interface StepIO {
    count: number;
    sample?: any[];
    raw?: any;
}

export interface DecisionSummary {
    kept: { count: number; reasons: ReasonBucket[] };
    dropped: { count: number; reasons: ReasonBucket[] };
}

export interface ReasonBucket {
    reason: string;
    count: number;
    examples: any[];
    metadata?: Record<string, any>;
}

// Event types for new SDK
export interface LLMEvent {
    event_type: 'llm_call';
    trace_id: string;
    span_id: string;
    timestamp: string;
    duration_ms: number;
    service?: string;

    reasoning: {
        summary: string;
        effort?: string;
        strategy?: string;
        confidence?: number;
        decision_factors?: string[];
        alternatives_considered?: string[];
    };

    model: {
        provider: string;
        name: string;
    };

    input: {
        user_prompt_hash?: string;
        input_tokens: number;
        raw_prompt?: string;
    };

    output: {
        response_hash?: string;
        output_tokens: number;
        response_text?: string;
        finish_reason?: string;
    };

    params?: {
        temperature?: number;
        max_tokens?: number;
        seed?: number | null;
        [key: string]: any;
    };
    variability?: any;
    metrics?: any;
}

export interface DecisionEvent {
    event_type: 'decision';
    trace_id: string;
    span_id: string;
    timestamp: string;
    duration_ms: number;
    service?: string;

    decision: {
        input_count: number;
        output_count: number;
        kept: { count: number; reason: string }[];
        dropped: { count: number; reason: string }[];
    };

    criteria?: any;
}

export interface CustomEvent {
    event_type: string;
    trace_id: string;
    span_id: string;
    timestamp: string;
    duration_ms: number;
    service?: string;
    data: any;
}

export type Event = LLMEvent | DecisionEvent | CustomEvent;

export interface EventsResponse {
    trace_id: string;
    count: number;
    events: Event[];
}


export interface StepStat {
    stepId: string;
    stepName: string;
    inputCount: number;
    droppedCount: number;
    dropRate: number;
}

// API Client
export const api = {
    async getTraces(params?: { service?: string; status?: string; limit?: number }) {
        const query = new URLSearchParams(params as any).toString();
        const res = await fetch(`/v1/traces?${query}`);
        if (!res.ok) throw new Error('Failed to fetch traces');
        return res.json() as Promise<Trace[]>;
    },

    async getTrace(id: string): Promise<Trace> {
        const API_BASE = '/v1'; // Define API_BASE or ensure it's globally available
        const response = await fetch(`${API_BASE}/traces/${id}`);
        if (!response.ok) throw new Error('Failed to fetch trace');
        return response.json();
    },

    async getEvents(traceId: string): Promise<EventsResponse> {
        const API_BASE = '/v1'; // Define API_BASE or ensure it's globally available
        const response = await fetch(`${API_BASE}/events?trace_id=${traceId}`);
        if (!response.ok) throw new Error('Failed to fetch events');
        return response.json();
    },

    async getDropStats(service?: string) {
        const query = service ? `?service=${service}` : '';
        const res = await fetch(`/v1/stats/drop-reasons${query}`);
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json() as Promise<any[]>;
    },

    async getHighDropSteps(threshold = 0.5) {
        const res = await fetch(`/v1/steps/high-drop-rate?threshold=${threshold}`);
        if (!res.ok) throw new Error('Failed to fetch high drop steps');
        return res.json() as Promise<StepStat[]>;
    },

    // Analytics endpoints
    async getHighDropTraces(
        threshold = 0.9,
        service?: string,
        limit = 50,
        metadata?: Record<string, string>
    ) {
        const params = new URLSearchParams({
            threshold: threshold.toString(),
            limit: limit.toString()
        });
        if (service) params.append('service', service);

        // Add metadata filters dynamically
        if (metadata) {
            Object.entries(metadata).forEach(([key, value]) => {
                params.append(`metadata.${key}`, value);
            });
        }

        const res = await fetch(`/v1/analytics/high-drop-traces?${params}`);
        if (!res.ok) throw new Error('Failed to fetch high drop traces');
        return res.json();
    },

    async getDropReasons(
        service?: string,
        traceId?: string,
        metadata?: Record<string, string>
    ) {
        const params = new URLSearchParams();
        if (service) params.append('service', service);
        if (traceId) params.append('trace_id', traceId);

        if (metadata) {
            Object.entries(metadata).forEach(([key, value]) => {
                params.append(`metadata.${key}`, value);
            });
        }

        const res = await fetch(`/v1/analytics/drop-reasons?${params}`);
        if (!res.ok) throw new Error('Failed to fetch drop reasons');
        return res.json();
    },

    async getFunnelStats(traceId: string) {
        const res = await fetch(`/v1/analytics/funnel-stats?trace_id=${traceId}`);
        if (!res.ok) throw new Error('Failed to fetch funnel stats');
        return res.json();
    },

    async getMetadataValues(field: string, eventType?: string) {
        const params = new URLSearchParams({ field });
        if (eventType) params.append('event_type', eventType);
        const res = await fetch(`/v1/analytics/metadata-values?${params}`);
        if (!res.ok) throw new Error('Failed to fetch metadata values');
        return res.json();
    },
};
