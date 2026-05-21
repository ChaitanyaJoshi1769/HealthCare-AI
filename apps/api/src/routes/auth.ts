import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { registerUser, loginUser, getCurrentUser, requireAuth } from '../services/auth.js';
import { successResponse, errorResponse, AppError } from '@healthos/shared';

export async function registerAuthRoutes(app: FastifyInstance) {
  // Register endpoint
  app.post('/api/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password, firstName, lastName } = request.body as Record<string, unknown>;
      const user = await registerUser(
        email as string,
        password as string,
        firstName as string,
        lastName as string
      );
      reply.code(201).send(successResponse({ user }));
    } catch (error) {
      if (error instanceof AppError) {
        reply.code(error.statusCode).send(errorResponse(error));
      } else {
        reply.code(500).send(
          errorResponse(new AppError('REGISTRATION_ERROR', 'Registration failed'))
        );
      }
    }
  });

  // Login endpoint
  app.post('/api/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { email, password } = request.body as Record<string, unknown>;
      const result = await loginUser(email as string, password as string);
      reply.code(200).send(successResponse(result));
    } catch (error) {
      if (error instanceof AppError) {
        reply.code(error.statusCode).send(errorResponse(error));
      } else {
        reply.code(500).send(
          errorResponse(new AppError('LOGIN_ERROR', 'Login failed'))
        );
      }
    }
  });

  // Get current user endpoint
  app.get('/api/auth/me', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAuth(request, reply);
      const user = await getCurrentUser(request);
      if (!user) {
        reply.code(401).send(
          errorResponse(new AppError('USER_NOT_FOUND', 'User not found', 401))
        );
        return;
      }
      reply.code(200).send(successResponse({ user }));
    } catch (error) {
      if (error instanceof AppError) {
        reply.code(error.statusCode).send(errorResponse(error));
      } else {
        reply.code(500).send(
          errorResponse(new AppError('ERROR', 'Internal server error'))
        );
      }
    }
  });
}
