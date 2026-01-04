import { BaseEvent } from './events/base';

export interface TransportConfig {
    endpoint?: string;
    apiKey?: string;
    debug?: boolean;
    onError?: 'throw' | 'log' | 'silent';
}

export class Transport {
    private config: TransportConfig;
    private endpoint: string;

    constructor(config: TransportConfig) {
        this.config = config;
        this.endpoint = config.endpoint || 'http://localhost:3000';
    }

    async send(event: BaseEvent): Promise<void> {
        const url = `${this.endpoint}/v1/events`;

        if (this.config.debug) {
            console.log('[XRay] Sending event:', JSON.stringify(event, null, 2));
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` }),
                },
                body: JSON.stringify(event),
            });

            if (!response.ok) {
                throw new Error(`Failed to send event: ${response.status} ${response.statusText}`);
            }

            if (this.config.debug) {
                console.log('[XRay] Event sent successfully');
            }
        } catch (error) {
            if (this.config.onError === 'throw') {
                throw error;
            } else if (this.config.onError === 'log') {
                console.error('[XRay] Transport error:', error);
            }
            // 'silent' does nothing
        }
    }
}
