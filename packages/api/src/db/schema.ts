import { pgTable, uuid, text, varchar, timestamp, jsonb, integer, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Events table for new event-based SDK
export const events = pgTable('events', {
    id: uuid('id').primaryKey(),
    eventType: varchar('event_type', { length: 50 }).notNull(),
    traceId: uuid('trace_id').notNull(),
    spanId: uuid('span_id').notNull(),
    parentSpanId: uuid('parent_span_id'),
    service: varchar('service', { length: 255 }),
    timestamp: timestamp('timestamp').notNull(),
    durationMs: integer('duration_ms'),
    data: jsonb('data').notNull(), // Full event data
    createdAt: timestamp('created_at').defaultNow(),
});

