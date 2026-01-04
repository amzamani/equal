import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import eventsRoutes from './routes/events';
import eventsQueryRoutes from './routes/events-query';
import tracesListRoutes from './routes/traces-list';
import analyticsRoutes from './routes/analytics';
import testRoutes from './routes/test';

// Load environment variables
dotenv.config();

const app: express.Application = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Support large trace payloads
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/v1', eventsRoutes);
app.use('/v1', eventsQueryRoutes);
app.use('/v1', tracesListRoutes);
app.use('/v1', analyticsRoutes);
app.use('/v1', testRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 X-Ray API server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📥 Events endpoint: http://localhost:${PORT}/v1/events`);
    console.log(`📤 Events query: http://localhost:${PORT}/v1/events?trace_id=xxx`);
});

export default app as express.Application;
