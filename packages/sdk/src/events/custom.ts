import { BaseEvent } from './base';

// Flexible custom event for any use case

export interface CustomEvent extends BaseEvent {
    event_type: string;  // User-defined
    data: Record<string, any>;
}
