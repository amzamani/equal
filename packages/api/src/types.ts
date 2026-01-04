// Core types shared between SDK and API
export interface TraceConfig {
    service: string;
    apiKey?: string;
    endpoint?: string;
    debug?: boolean;
    batchSize?: number;
    onError?: 'throw' | 'log' | 'silent';
}

export interface Trace {
    id: string;
    service: string;
    name: string;
    startTime: number;
    endTime?: number;
    status: 'running' | 'completed' | 'failed';
    metadata: Record<string, any>;
    steps: Step[];
}

export interface Step {
    id: string;
    traceId: string;
    name: string;
    type: 'generation' | 'retrieval' | 'filter' | 'transform' | 'selection';
    startTime: number;
    endTime?: number;

    // The funnel data
    input: StepIO;
    output: StepIO;

    // Decision tracking
    decisions: DecisionSummary;

    // For LLM steps
    reasoning?: {
        effort: string;
        summary: string;
    };

    // Error info
    error?: { message: string; stack?: string };
}

export interface StepIO {
    count: number;
    sample?: any[];
    schema?: Record<string, string>;
    raw?: any;
}

export interface DecisionSummary {
    kept: { count: number; reasons: ReasonBucket[] };
    dropped: { count: number; reasons: ReasonBucket[] };
    modified?: { count: number; reasons: ReasonBucket[] };
}

export interface ReasonBucket {
    reason: string;
    count: number;
    examples: any[];
    metadata?: Record<string, any>;
}
