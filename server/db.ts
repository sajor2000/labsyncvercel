import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { logger } from "./utils/logger";
import { getEnvConfig } from "./utils/envValidation";
import { getReplitDatabaseConfig } from "./utils/replitConfig";

neonConfig.webSocketConstructor = ws;

const envConfig = getEnvConfig();

// Get Replit-optimized database configuration
const dbConfig = getReplitDatabaseConfig();

// Optimized Neon connection pool configuration
export const pool = new Pool({ 
  connectionString: envConfig.DATABASE_URL,
  ...dbConfig
});

// Monitor connection health
let connectionAttempts = 0;
let lastError: Date | null = null;

const originalConnect = pool.connect.bind(pool);
pool.connect = async (...args) => {
  connectionAttempts++;
  try {
    const client = await originalConnect(...args);
    if (lastError) {
      logger.info('Database connection recovered', { 
        attemptsSinceError: connectionAttempts 
      });
      lastError = null;
      connectionAttempts = 0;
    }
    return client;
  } catch (error) {
    lastError = new Date();
    logger.error('Database connection failed', { 
      error: error instanceof Error ? error.message : String(error),
      attempts: connectionAttempts 
    });
    throw error;
  }
};

export const db = drizzle({ client: pool, schema });