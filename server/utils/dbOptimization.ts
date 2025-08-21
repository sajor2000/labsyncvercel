import { pool } from '../db';
import { logger } from './logger';

/**
 * Database optimization utilities
 */

/**
 * Create performance indexes for better query speed
 */
export async function createPerformanceIndexes(): Promise<void> {
  const client = await pool.connect();
  
  try {
    logger.info('Creating database performance indexes...');
    
    const indexes = [
      // Task indexes for common queries
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_study_id ON tasks(study_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id)', 
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_status ON tasks(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_due_date ON tasks(due_date)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tasks_created_at ON tasks(created_at)',
      
      // Study indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_studies_lab_id ON studies(lab_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_studies_status ON studies(status)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_studies_created_at ON studies(created_at)',
      
      // User and team member indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_active ON users(is_active)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_lab_id ON team_members(lab_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_team_members_user_id ON team_members(user_id)',
      
      // Session indexes for faster authentication
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_sid ON sessions(sid)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sessions_expire ON sessions(expire)',
      
      // Lab indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_labs_created_by ON labs(created_by)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_labs_active ON labs(is_active)',
      
      // Bucket indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_buckets_lab_id ON buckets(lab_id)',
      
      // Standup indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_standups_lab_id ON standups(lab_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_standups_date ON standups(date)',
      
      // Action item indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_action_items_standup_id ON action_items(standup_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_action_items_assignee_id ON action_items(assignee_id)'
    ];
    
    for (const indexQuery of indexes) {
      try {
        await client.query(indexQuery);
        logger.debug('Index created successfully', { query: indexQuery });
      } catch (error) {
        if (error instanceof Error && error.message.includes('already exists')) {
          logger.debug('Index already exists', { query: indexQuery });
        } else {
          logger.warn('Failed to create index', { 
            query: indexQuery, 
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
    
    logger.info('Database index creation completed');
    
  } finally {
    client.release();
  }
}

/**
 * Get database performance statistics
 */
export async function getPerformanceStats(): Promise<any> {
  const client = await pool.connect();
  
  try {
    // Get slow queries
    const slowQueries = await client.query(`
      SELECT 
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        rows
      FROM pg_stat_statements 
      WHERE mean_exec_time > 1000
      ORDER BY mean_exec_time DESC 
      LIMIT 10;
    `);
    
    // Get index usage stats
    const indexStats = await client.query(`
      SELECT 
        schemaname,
        tablename,
        indexname,
        idx_tup_read,
        idx_tup_fetch
      FROM pg_stat_user_indexes 
      ORDER BY idx_tup_read DESC 
      LIMIT 10;
    `);
    
    // Get connection stats
    const connectionStats = await client.query(`
      SELECT 
        state,
        COUNT(*) as count
      FROM pg_stat_activity 
      WHERE datname = current_database()
      GROUP BY state;
    `);
    
    return {
      slowQueries: slowQueries.rows,
      indexStats: indexStats.rows,
      connectionStats: connectionStats.rows,
      poolStats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
    
  } catch (error) {
    logger.warn('Could not get performance stats (pg_stat_statements extension may not be enabled)', {
      error: error instanceof Error ? error.message : String(error)
    });
    return {
      poolStats: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    };
  } finally {
    client.release();
  }
}

/**
 * Clean up expired sessions and optimize database
 */
export async function cleanupDatabase(): Promise<void> {
  const client = await pool.connect();
  
  try {
    logger.info('Starting database cleanup...');
    
    // Clean expired sessions
    const expiredSessions = await client.query(`
      DELETE FROM sessions 
      WHERE expire < NOW() 
      RETURNING sid;
    `);
    
    // Vacuum analyze to update statistics
    await client.query('VACUUM ANALYZE;');
    
    logger.info('Database cleanup completed', {
      expiredSessions: expiredSessions.rowCount
    });
    
  } catch (error) {
    logger.error('Database cleanup failed', {
      error: error instanceof Error ? error.message : String(error)
    });
  } finally {
    client.release();
  }
}

/**
 * Initialize database optimizations
 */
export async function initializeDbOptimizations(): Promise<void> {
  try {
    await createPerformanceIndexes();
    
    // Schedule periodic cleanup (every 6 hours)
    setInterval(async () => {
      await cleanupDatabase();
    }, 6 * 60 * 60 * 1000);
    
    // Log performance stats periodically in development
    if (process.env.NODE_ENV === 'development') {
      setInterval(async () => {
        const stats = await getPerformanceStats();
        logger.debug('Database performance stats', stats);
      }, 10 * 60 * 1000); // Every 10 minutes
    }
    
    logger.info('Database optimizations initialized');
    
  } catch (error) {
    logger.error('Failed to initialize database optimizations', {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}