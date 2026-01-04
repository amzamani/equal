import { Router } from 'express';
import { db } from '../db';
import { events } from '../db/schema';
import { sql, eq, and } from 'drizzle-orm';

const router: Router = Router();

/**
 * Helper function to parse metadata filters from query params
 * Converts ?metadata.domain=fraud&metadata.region=us-west to SQL conditions
 */
function parseMetadataFilters(query: any): any[] {
    const filters: any[] = [];

    for (const [key, value] of Object.entries(query)) {
        if (key.startsWith('metadata.')) {
            const metadataKey = key.substring('metadata.'.length);
            filters.push(sql`${events.data}->'metadata'->>${metadataKey} = ${value as string}`);
        }
    }

    return filters;
}

/**
 * GET /v1/analytics/high-drop-traces
 * Find traces with decision events that have high drop rates
 */
router.get('/analytics/high-drop-traces', async (req, res) => {
    try {
        const threshold = parseFloat(req.query.threshold as string) || 0.9;
        const service = req.query.service as string | undefined;
        const limit = parseInt(req.query.limit as string) || 50;

        console.log('Query params:', { threshold, service, limit });

        // Build WHERE conditions - use simple event type check
        // We'll filter by drop rate in JavaScript since JSONB access in SQL isn't working
        const conditions: any[] = [
            eq(events.eventType, 'decision'),
        ];

        // Add service filter if provided
        if (service) {
            conditions.push(eq(events.service, service));
        }

        // Add metadata filters
        const metadataFilters = parseMetadataFilters(req.query);
        conditions.push(...metadataFilters);

        // Select full data and calculate in JavaScript
        const eventList = await db
            .select()
            .from(events)
            .where(and(...conditions))
            .limit(limit * 10); // Get more results to filter in JS

        // Calculate drop rates and filter in JavaScript
        const results = eventList
            .map(e => {
                const data = e.data as any;
                const inputCount = data?.decision?.input_count || 0;
                const outputCount = data?.decision?.output_count || 0;

                if (inputCount === 0) return null;

                const dropRate = (1 - outputCount / inputCount);

                if (dropRate < threshold) return null;

                return {
                    trace_id: e.traceId,
                    service: e.service,
                    timestamp: e.timestamp,
                    input_count: inputCount,
                    output_count: outputCount,
                    drop_rate_percent: Math.round(dropRate * 100 * 100) / 100,
                    metadata: data?.metadata || null,
                };
            })
            .filter(r => r !== null)
            .sort((a, b) => (b?.drop_rate_percent || 0) - (a?.drop_rate_percent || 0))
            .slice(0, limit);

        console.log('Query results:', results.length, 'rows', results.length > 0 ? results[0] : null);

        res.json({
            threshold,
            count: results.length,
            traces: results,
        });
    } catch (error) {
        console.error('Error querying high drop traces:', error);
        res.status(500).json({
            error: 'Failed to query high drop traces',
            details: (error as Error).message,
        });
    }
});

/**
 * GET /v1/analytics/drop-reasons
 * Aggregate drop reasons across decision events
 */
router.get('/analytics/drop-reasons', async (req, res) => {
    try {
        const service = req.query.service as string | undefined;
        const traceId = req.query.trace_id as string | undefined;
        const limit = parseInt(req.query.limit as string) || 20;

        // Build WHERE conditions
        const conditions: any[] = [eq(events.eventType, 'decision')];

        if (service) {
            conditions.push(eq(events.service, service));
        }

        if (traceId) {
            conditions.push(eq(events.traceId, traceId));
        }

        // Add metadata filters
        const metadataFilters = parseMetadataFilters(req.query);
        conditions.push(...metadataFilters);

        // Query to extract and aggregate drop reasons
        // This uses jsonb_array_elements to unnest the dropped array
        const results = await db.execute(sql`
            SELECT 
                reason_data->>'reason' as reason,
                SUM((reason_data->>'count')::int) as total_count,
                COUNT(DISTINCT trace_id) as affected_traces,
                ROUND(CAST(AVG((reason_data->>'count')::float / 
                    NULLIF((data->'decision'->>'input_count')::int, 0) * 100) AS numeric), 2) as avg_percentage
            FROM ${events},
                 jsonb_array_elements(data->'decision'->'dropped') as reason_data
            WHERE ${and(...conditions)}
            GROUP BY reason_data->>'reason'
            ORDER BY total_count DESC
            LIMIT ${limit}
        `);

        const rows = results as any[];

        res.json({
            count: rows.length,
            reasons: rows,
        });
    } catch (error) {
        console.error('Error querying drop reasons:', error);
        res.status(500).json({
            error: 'Failed to query drop reasons',
            details: (error as Error).message,
        });
    }
});

/**
 * GET /v1/analytics/funnel-stats
 * Get funnel statistics for a specific trace
 */
router.get('/analytics/funnel-stats', async (req, res) => {
    try {
        const traceId = req.query.trace_id as string;

        if (!traceId) {
            return res.status(400).json({ error: 'trace_id query parameter is required' });
        }

        // Get all decision events for this trace, ordered by timestamp
        const eventList = await db
            .select()
            .from(events)
            .where(and(
                eq(events.traceId, traceId),
                eq(events.eventType, 'decision')
            ))
            .orderBy(events.timestamp);

        if (eventList.length === 0) {
            return res.status(404).json({
                error: 'No decision events found for this trace',
                trace_id: traceId
            });
        }

        // Calculate drop rates in JavaScript
        const decisionEvents = eventList.map(e => {
            const data = e.data as any;
            const inputCount = data?.decision?.input_count || 0;
            const outputCount = data?.decision?.output_count || 0;
            const dropRate = inputCount > 0
                ? Math.round((1 - outputCount / inputCount) * 100 * 100) / 100
                : 0;

            return {
                span_id: e.spanId,
                timestamp: e.timestamp,
                input_count: inputCount,
                output_count: outputCount,
                drop_rate_percent: dropRate,
                dropped: data?.decision?.dropped || [],
                kept: data?.decision?.kept || [],
            };
        });

        // Calculate cumulative drop rate
        const cumulativeInput = decisionEvents[0].input_count;
        const finalOutput = decisionEvents[decisionEvents.length - 1].output_count;
        const cumulativeDropRate = cumulativeInput > 0
            ? Math.round((1 - finalOutput / cumulativeInput) * 100 * 100) / 100
            : 0;

        res.json({
            trace_id: traceId,
            decision_count: decisionEvents.length,
            cumulative_drop_rate: cumulativeDropRate,
            initial_input: cumulativeInput,
            final_output: finalOutput,
            funnel: decisionEvents,
        });
    } catch (error) {
        console.error('Error querying funnel stats:', error);
        res.status(500).json({
            error: 'Failed to query funnel stats',
            details: (error as Error).message,
        });
    }
});

/**
 * GET /v1/analytics/metadata-values
 * Get unique values for a metadata field (for populating UI filters)
 */
router.get('/analytics/metadata-values', async (req, res) => {
    try {
        const field = req.query.field as string;
        const eventType = req.query.event_type as string | undefined;

        if (!field) {
            return res.status(400).json({ error: 'field query parameter is required' });
        }

        // Build WHERE conditions
        const conditions: any[] = [
            sql`${events.data}->'metadata' ? ${field}`, // Check if metadata field exists
        ];

        if (eventType) {
            conditions.push(eq(events.eventType, eventType));
        }

        // Query for unique metadata values with counts
        const results = await db.execute(sql`
            SELECT 
                ${events.data}->'metadata'->>${field} as value,
                COUNT(*) as count
            FROM ${events}
            WHERE ${and(...conditions)}
            GROUP BY value
            ORDER BY count DESC
        `);

        const rows = results as any[];

        res.json({
            field,
            values: rows,
        });
    } catch (error) {
        console.error('Error querying metadata values:', error);
        res.status(500).json({
            error: 'Failed to query metadata values',
            details: (error as Error).message,
        });
    }
});

export default router;
