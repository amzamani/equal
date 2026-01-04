import { Router } from 'express';
import { db } from '../db';
import { events } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const router: Router = Router();

// GET /v1/events - Get all events (for a trace_id)
router.get('/events', async (req, res) => {
    try {
        const { trace_id } = req.query;

        if (!trace_id) {
            return res.status(400).json({ error: 'trace_id query parameter is required' });
        }

        const eventList = await db
            .select()
            .from(events)
            .where(eq(events.traceId, trace_id as string))
            .orderBy(desc(events.timestamp));

        // Return events with full data
        const formattedEvents = eventList.map(e => e.data);

        res.json({
            trace_id,
            count: formattedEvents.length,
            events: formattedEvents
        });
    } catch (error) {
        console.error('Error querying events:', error);
        res.status(500).json({
            error: 'Failed to query events',
            details: (error as Error).message
        });
    }
});

// GET /v1/events/:span_id - Get a single event by span_id
router.get('/events/:span_id', async (req, res) => {
    try {
        const { span_id } = req.params;

        const event = await db
            .select()
            .from(events)
            .where(eq(events.spanId, span_id))
            .limit(1);

        if (event.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        res.json(event[0].data);
    } catch (error) {
        console.error('Error querying event:', error);
        res.status(500).json({
            error: 'Failed to query event',
            details: (error as Error).message
        });
    }
});

export default router;
