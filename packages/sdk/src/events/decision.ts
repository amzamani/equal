import { BaseEvent } from './base';

export interface DecisionEvent extends BaseEvent {
    event_type: 'decision';

    decision: {
        input_count: number;
        output_count: number;

        // Detailed breakdown of what happened
        kept: {
            count: number;
            reason: string; // e.g. "meets_criteria"
        }[];

        dropped: {
            count: number;
            reason: string; // e.g. "price_too_high"
        }[];
    };

    // Optional: criteria used for the decision
    criteria?: Record<string, any>;
}
