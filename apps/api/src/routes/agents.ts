import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { runHealthcareAgent, runMultiAgentDiagnosis } from '../services/ai-agents.js';
import { successResponse, errorResponse, AppError, requireAuth } from '@healthos/shared';
import { query } from '../db/index.js';
import { generateId } from '@healthos/shared';

export async function registerAgentRoutes(app: FastifyInstance) {
  // Chat with agent endpoint
  app.post('/api/agents/:agentType/chat', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAuth(request, reply);

      const { agentType } = request.params as Record<string, unknown>;
      const { message, conversationId } = request.body as Record<string, unknown>;

      // Validate agent type
      const validAgents = [
        'diagnostic',
        'genomics',
        'longevity',
        'wearables',
        'research',
        'preventive',
        'medication',
      ];
      if (!validAgents.includes(agentType as string)) {
        throw new AppError('INVALID_AGENT', 'Invalid agent type', 400);
      }

      // Load previous conversation if provided
      let previousMessages = [];
      if (conversationId) {
        const convResult = await query(
          'SELECT messages FROM agent_conversations WHERE id = $1',
          [conversationId]
        );
        if (convResult.rows.length > 0) {
          previousMessages = convResult.rows[0].messages || [];
        }
      }

      // Run agent
      const { response, messages } = await runHealthcareAgent(
        agentType as any,
        message as string,
        previousMessages
      );

      // Save conversation
      const newConvId = conversationId || generateId();
      await query(
        `INSERT INTO agent_conversations (id, patient_id, agent_type, messages, created_at, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET messages = $4, updated_at = CURRENT_TIMESTAMP`,
        [newConvId, request.user?.sub, agentType, JSON.stringify(messages)]
      );

      reply.code(200).send(
        successResponse({
          conversationId: newConvId,
          response,
          messages,
        })
      );
    } catch (error) {
      if (error instanceof AppError) {
        reply.code(error.statusCode).send(errorResponse(error));
      } else {
        reply.code(500).send(
          errorResponse(new AppError('AGENT_ERROR', 'Agent processing failed'))
        );
      }
    }
  });

  // Multi-agent diagnosis endpoint
  app.post('/api/agents/diagnose', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAuth(request, reply);

      const { symptoms, medicalHistory } = request.body as Record<string, unknown>;

      const insights = await runMultiAgentDiagnosis(symptoms as string, {
        hasGenomicData: !!medicalHistory,
      });

      reply.code(200).send(successResponse(insights));
    } catch (error) {
      if (error instanceof AppError) {
        reply.code(error.statusCode).send(errorResponse(error));
      } else {
        reply.code(500).send(
          errorResponse(new AppError('DIAGNOSIS_ERROR', 'Diagnosis generation failed'))
        );
      }
    }
  });

  // Get conversation history
  app.get(
    '/api/agents/conversations/:conversationId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { conversationId } = request.params as Record<string, unknown>;

        const result = await query(
          'SELECT * FROM agent_conversations WHERE id = $1',
          [conversationId]
        );

        if (result.rows.length === 0) {
          throw new AppError('NOT_FOUND', 'Conversation not found', 404);
        }

        reply.code(200).send(successResponse(result.rows[0]));
      } catch (error) {
        if (error instanceof AppError) {
          reply.code(error.statusCode).send(errorResponse(error));
        } else {
          reply.code(500).send(
            errorResponse(new AppError('ERROR', 'Internal server error'))
          );
        }
      }
    }
  );
}
