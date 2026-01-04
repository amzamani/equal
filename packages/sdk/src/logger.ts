import { BaseEvent } from './events/base';
import { LLMEvent } from './events/llm';
import { HTTPEvent } from './events/http';
import { DecisionEvent } from './events/decision';
import { CustomEvent } from './events/custom';
import { Transport } from './transport';

export interface LoggerConfig {
    service: string;
    endpoint?: string;
    apiKey?: string;
    debug?: boolean;
    onError?: 'throw' | 'log' | 'silent';
}

export class XRayLogger {
    private config: LoggerConfig;
    private transport: Transport;

    constructor(config: LoggerConfig) {
        this.config = {
            debug: false,
            onError: 'log',
            ...config,
        };
        this.transport = new Transport(this.config);
    }

    /**
     * Generic log method - accepts any event
     */
    async log(event: BaseEvent): Promise<void> {
        try {
            await this.transport.send(event);
        } catch (error) {
            this.handleError(error as Error);
        }
    }

    /**
     * Log an LLM call with reasoning
     */
    async logLLM(event: Omit<LLMEvent, 'event_type'>): Promise<void> {
        await this.log({ ...event, event_type: 'llm_call' });
    }

    /**
     * Log an HTTP request
     */
    async logHTTP(event: Omit<HTTPEvent, 'event_type'>): Promise<void> {
        await this.log({ ...event, event_type: 'http_request' });
    }

    /**
     * Log a decision event (filtering, selection, etc.)
     */
    async logDecision(event: Omit<DecisionEvent, 'event_type'>): Promise<void> {
        await this.log({ ...event, event_type: 'decision' });
    }

    /**
     * Log a custom event
     */
    async logCustom(eventType: string, data: any): Promise<void> {
        const event: CustomEvent = {
            event_type: eventType,
            trace_id: data.trace_id || this.createTrace(),
            timestamp: new Date().toISOString(),
            duration_ms: data.duration_ms || 0,
            service: this.config.service,
            data,
        };
        await this.log(event);
    }

    /**
     * Create a new trace ID
     */
    createTrace(): string {
        return crypto.randomUUID();
    }

    /**
     * Helper: time an async function and log the event
     */
    async time<T>(
        traceId: string,
        fn: () => Promise<T>,
        eventBuilder: (duration: number, result: T) => BaseEvent
    ): Promise<T> {
        const start = Date.now();
        try {
            const result = await fn();
            const duration = Date.now() - start;
            await this.log(eventBuilder(duration, result));
            return result;
        } catch (error) {
            const duration = Date.now() - start;
            // Still log the event with error info
            const errorEvent = eventBuilder(duration, null as any);
            errorEvent.metadata = {
                ...errorEvent.metadata,
                error: (error as Error).message,
            };
            await this.log(errorEvent);
            throw error;
        }
    }

    private handleError(error: Error): void {
        if (this.config.onError === 'throw') {
            throw error;
        } else if (this.config.onError === 'log') {
            console.error('[XRayLogger] Error:', error);
        }
        // 'silent' does nothing
    }
}
