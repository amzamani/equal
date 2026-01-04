// Quick test endpoint to debug the query
import { Router } from 'express';
import { db } from '../db';
import { events } from '../db/schema';
import { sql, eq } from 'drizzle-orm';

const router: Router = Router();

router.get('/test/decision-events', async (req, res) => {
    try {
        const eventList = await db
            .select()
            .from(events)
            .where(eq(events.eventType, 'decision'))
            .limit(10);

        const formatted = eventList.map(e => ({
            trace_id: e.traceId,
            service: e.service,
            has_data: !!e.data,
            data_keys: e.data ? Object.keys(e.data) : [],
            input_count: (e.data as any)?.decision?.input_count,
            output_count: (e.data as any)?.decision?.output_count,
        }));

        res.json({ count: formatted.length, results: formatted });
    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
});

export default router;
