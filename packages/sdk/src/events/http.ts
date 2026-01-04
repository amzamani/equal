import { BaseEvent } from './base';

// HTTP request event

export interface HTTPEvent extends BaseEvent {
    event_type: 'http_request';

    request: {
        method: string;
        url: string;
        headers_hash?: string;
        body_hash?: string;
    };

    response: {
        status: number;
        headers_hash?: string;
        body_hash?: string;
    };

    error?: {
        message: string;
        code?: string;
    };
}
