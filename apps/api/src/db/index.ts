import { Pool } from 'pg';
import { config } from '../config.js';
import { ConsoleLogger } from '@healthos/shared';

const logger = new ConsoleLogger();
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: config.DATABASE_URL,
      max: config.NODE_ENV === 'production' ? 20 : 5,
    });

    pool.on('error', (error) => {
      logger.error('Unexpected error on idle client', error);
    });
  }

  return pool;
}

export async function initializeDatabase(): Promise<void> {
  const client = getPool();

  try {
    await client.query('SELECT NOW()');
    logger.info('Database connection successful');
  } catch (error) {
    logger.error('Failed to connect to database', error);
    throw error;
  }
}

export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database connection closed');
  }
}

export async function query(text: string, params?: unknown[]) {
  const client = getPool();
  return client.query(text, params);
}

export async function transaction<T>(
  callback: (client: any) => Promise<T>
): Promise<T> {
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
