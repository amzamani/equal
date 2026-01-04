import { Router } from 'express';
import { db } from '../db';
import { events } from '../db/schema';
import { sql, desc } from 'drizzle-orm';

const router: Router = Router();

// GET /v1/traces - List unique traces from events
router.get('/traces', async (req, res) => {
    try {
        // Query to get unique trace_ids with aggregated info
        const traces = await db
            .select({
                id: events.traceId,
                service: sql<string>`MAX(${events.service})`,
                name: sql<string>`'Event-based trace'`, // Generic name
                status: sql<string>`'completed'`, // Assume completed
                startTime: sql<Date>`MIN(${events.timestamp})`,
                endTime: sql<Date>`MAX(${events.timestamp})`,
                eventCount: sql<number>`COUNT(*)`,
            })
            .from(events)
            .groupBy(events.traceId)
            .orderBy(desc(sql`MIN(${events.timestamp})`))
            .limit(50);

        // Format to match expected Trace interface
        const formattedTraces = traces.map(t => ({
            id: t.id,
            service: t.service || 'unknown',
            name: t.name,
            status: t.status,
            startTime: t.startTime.getTime(),
            endTime: t.endTime?.getTime(),
            metadata: {},
            steps: [], // Event-based traces have 0 steps
            eventCount: t.eventCount,
        }));

        res.json(formattedTraces);
    } catch (error) {
        console.error('Error fetching traces:', error);
        res.status(500).json({
            error: 'Failed to fetch traces',
            details: (error as Error).message
        });
    }
});

export default router;
