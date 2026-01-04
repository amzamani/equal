import { BaseEvent } from './base';

// LLM event with reasoning as the primary focus

export interface LLMEvent extends BaseEvent {
    event_type: 'llm_call';

    // 🎯 REASONING - The most important part! (REQUIRED)
    reasoning: {
        // From OpenAI Responses API reasoning summary
        summary: string;           // Natural language explanation of the decision
        effort?: string;           // 'low' | 'medium' | 'high' | 'xhigh'

        // Additional context
        strategy?: string;         // e.g., "direct_answer", "chain_of_thought", "retrieval_augmented"
        confidence?: number;       // 0-1 confidence score
        decision_factors?: string[]; // Key factors that influenced the decision
        alternatives_considered?: string[]; // What other options were considered
    };

    model: {
        provider: string;
        name: string;
    };

    params: {
        temperature?: number;
        max_tokens?: number;
        seed?: number | null;
        [key: string]: any;
    };

    input: {
        system_prompt_hash?: string;
        user_prompt_hash?: string;  // Optional: only useful for deduplication in high-volume systems
        raw_prompt?: string;  // Full prompt for debugging
        input_tokens: number;
    };

    output: {
        response_text?: string;  // Full response for debugging
        response_hash?: string;  // Optional: only useful for deduplication in high-volume systems
        output_tokens: number;
        finish_reason?: string;
    };

    variability?: {
        nondeterministic: boolean;
        reason?: string;  // e.g., "temperature > 0", "sampling enabled"
    };

    metrics?: {
        latency_ms: number;
        cost_usd?: number;
        [key: string]: any;
    };
}
