// Base event interface that all events extend

export interface BaseEvent {
    // Required fields
    event_type: string;
    trace_id: string;
    timestamp: string;
    duration_ms: number;

    // Optional fields
    service?: string;
    metadata?: Record<string, any>;
}
