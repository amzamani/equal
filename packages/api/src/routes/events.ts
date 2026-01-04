import { Router } from 'express';
import { db } from '../db';
import { events } from '../db/schema';

const router: Router = Router();

// POST /v1/events - Ingest a single event
router.post('/events', async (req, res) => {
    try {
        const event = req.body;

        // Validate required fields (span_id is now optional)
        if (!event.event_type || !event.trace_id || !event.timestamp) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['event_type', 'trace_id', 'timestamp']
            });
        }

        // Auto-generate span_id if not provided
        const spanId = event.span_id || crypto.randomUUID();

        // Insert event
        await db.insert(events).values({
            id: spanId, // Use span_id as primary key
            eventType: event.event_type,
            traceId: event.trace_id,
            spanId: spanId,
            parentSpanId: event.parent_span_id || null,
            service: event.service || null,
            timestamp: new Date(event.timestamp),
            durationMs: event.duration_ms || 0,
            data: event, // Store full event as JSON
        });

        res.status(201).json({
            id: spanId,
            trace_id: event.trace_id,
            message: 'Event ingested successfully'
        });
    } catch (error) {
        console.error('Error ingesting event:', error);
        res.status(500).json({
            error: 'Failed to ingest event',
            details: (error as Error).message
        });
    }
});

// POST /v1/events/batch - Ingest multiple events
router.post('/events/batch', async (req, res) => {
    try {
        const eventList = req.body.events || req.body;

        if (!Array.isArray(eventList)) {
            return res.status(400).json({ error: 'Expected an array of events' });
        }

        await db.transaction(async (tx) => {
            for (const event of eventList) {
                const spanId = event.span_id || crypto.randomUUID();
                await tx.insert(events).values({
                    id: spanId,
                    eventType: event.event_type,
                    traceId: event.trace_id,
                    spanId: spanId,
                    parentSpanId: event.parent_span_id || null,
                    service: event.service || null,
                    timestamp: new Date(event.timestamp),
                    durationMs: event.duration_ms || 0,
                    data: event,
                });
            }
        });

        res.status(201).json({
            message: `${eventList.length} events ingested successfully`,
            count: eventList.length
        });
    } catch (error) {
        console.error('Error ingesting events:', error);
        res.status(500).json({
            error: 'Failed to ingest events',
            details: (error as Error).message
        });
    }
});

export default router;
