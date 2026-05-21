import Fastify from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from 'fastify-cors';
import { config } from './config.js';
import { initializeDatabase, closeDatabase } from './db/index.js';
import { initializeSchema } from './db/schema.js';
import { registerAuthRoutes } from './routes/auth.js';
import { registerAgentRoutes } from './routes/agents.js';
import { registerPatientRoutes } from './routes/patients.js';
import { registerGenomicsRoutes } from './routes/genomics.js';
import { registerKnowledgeGraphRoutes } from './routes/knowledge-graph.js';
import { registerTherapeuticDesignRoutes } from './routes/therapeutic-design.js';
import { registerEnterpriseRoutes } from './routes/enterprise.js';
import { ConsoleLogger, AppError, errorResponse } from '@healthos/shared';

const logger = new ConsoleLogger();

const app = Fastify({
  logger: config.ENABLE_LOGGING,
});

// Register plugins
await app.register(fastifyHelmet, {
  contentSecurityPolicy: false, // Adjust based on your needs
});

await app.register(fastifyCors, {
  origin: true,
  credentials: true,
});

await app.register(fastifyJwt, {
  secret: config.JWT_SECRET,
});

// Error handler
app.setErrorHandler((error, request, reply) => {
  if (error instanceof AppError) {
    reply.code(error.statusCode).send(errorResponse(error));
  } else {
    logger.error('Unhandled error', error);
    reply.code(500).send(
      errorResponse(new AppError('INTERNAL_ERROR', 'Internal server error', 500))
    );
  }
});

// Health check
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Initialize database and routes
try {
  logger.info('Initializing database...');
  await initializeDatabase();

  logger.info('Initializing schema...');
  await initializeSchema();

  logger.info('Registering routes...');
  await registerAuthRoutes(app);
  await registerPatientRoutes(app);
  await registerAgentRoutes(app);
  await registerGenomicsRoutes(app);
  await registerKnowledgeGraphRoutes(app);
  await registerTherapeuticDesignRoutes(app);
  await registerEnterpriseRoutes(app);

  // Start server
  await app.listen({ port: config.PORT, host: config.HOST });
  logger.info(`Server running at http://${config.HOST}:${config.PORT}`);
} catch (error) {
  logger.error('Failed to start server', error);
  await closeDatabase();
  process.exit(1);
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  await app.close();
  await closeDatabase();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully...');
  await app.close();
  await closeDatabase();
  process.exit(0);
});

export default app;
