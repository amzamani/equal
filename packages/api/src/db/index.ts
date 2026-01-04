import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';
import * as schema from './schema';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgres://localhost:5432/xray';

// Create postgres connection
const client = postgres(connectionString);

// Create drizzle instance
export const db = drizzle(client, { schema });
