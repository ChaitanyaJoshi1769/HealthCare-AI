import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { successResponse, errorResponse, AppError, generateId, requireAuth } from '@healthos/shared';
import { query } from '../db/index.js';
import type { Patient, HealthMetric } from '@healthos/types';

export async function registerPatientRoutes(app: FastifyInstance) {
  // Create patient profile
  app.post('/api/patients', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAuth(request, reply);

      const { dateOfBirth, gender, ethnicity } = request.body as Record<string, unknown>;
      const userId = (request.user as any)?.sub;

      const patientId = generateId();
      await query(
        `INSERT INTO patients (id, user_id, date_of_birth, gender, ethnicity)
         VALUES ($1, $2, $3, $4, $5)`,
        [patientId, userId, dateOfBirth, gender, ethnicity]
      );

      const result = await query('SELECT * FROM patients WHERE id = $1', [patientId]);

      reply.code(201).send(successResponse(result.rows[0]));
    } catch (error) {
      if (error instanceof AppError) {
        reply.code(error.statusCode).send(errorResponse(error));
      } else {
        reply.code(500).send(errorResponse(new AppError('ERROR', 'Failed to create patient')));
      }
    }
  });

  // Get patient profile
  app.get('/api/patients/:patientId', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAuth(request, reply);

      const { patientId } = request.params as Record<string, unknown>;

      const result = await query(
        `SELECT p.*, u.email, u.first_name, u.last_name
         FROM patients p
         JOIN users u ON p.user_id = u.id
         WHERE p.id = $1`,
        [patientId]
      );

      if (result.rows.length === 0) {
        throw new AppError('NOT_FOUND', 'Patient not found', 404);
      }

      reply.code(200).send(successResponse(result.rows[0]));
    } catch (error) {
      if (error instanceof AppError) {
        reply.code(error.statusCode).send(errorResponse(error));
      } else {
        reply.code(500).send(errorResponse(new AppError('ERROR', 'Internal server error')));
      }
    }
  });

  // Add health metric
  app.post('/api/patients/:patientId/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAuth(request, reply);

      const { patientId } = request.params as Record<string, unknown>;
      const { type, value, unit, source, recordedAt } = request.body as Record<string, unknown>;

      const metricId = generateId();
      await query(
        `INSERT INTO health_metrics (id, patient_id, metric_type, value, unit, source, recorded_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [metricId, patientId, type, value, unit, source, recordedAt]
      );

      reply.code(201).send(successResponse({ id: metricId }));
    } catch (error) {
      reply.code(500).send(errorResponse(new AppError('ERROR', 'Failed to add metric')));
    }
  });

  // Get health metrics
  app.get('/api/patients/:patientId/metrics', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAuth(request, reply);

      const { patientId } = request.params as Record<string, unknown>;
      const { type, limit = 100, offset = 0 } = request.query as Record<string, unknown>;

      let queryString =
        'SELECT * FROM health_metrics WHERE patient_id = $1';
      const params: unknown[] = [patientId];

      if (type) {
        queryString += ` AND metric_type = $2`;
        params.push(type);
      }

      queryString += ' ORDER BY recorded_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}';
      params.push(limit, offset);

      const result = await query(queryString, params);

      reply.code(200).send(successResponse({
        metrics: result.rows,
        total: result.rows.length,
      }));
    } catch (error) {
      reply.code(500).send(errorResponse(new AppError('ERROR', 'Failed to fetch metrics')));
    }
  });

  // Add medication
  app.post(
    '/api/patients/:patientId/medications',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { patientId } = request.params as Record<string, unknown>;
        const { name, dosage, frequency, startDate, indication } = request.body as Record<string, unknown>;

        const medicationId = generateId();
        await query(
          `INSERT INTO medications (id, patient_id, name, dosage, frequency, start_date, indication)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [medicationId, patientId, name, dosage, frequency, startDate, indication]
        );

        reply.code(201).send(successResponse({ id: medicationId }));
      } catch (error) {
        reply.code(500).send(errorResponse(new AppError('ERROR', 'Failed to add medication')));
      }
    }
  );

  // Get AI insights
  app.get('/api/patients/:patientId/insights', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAuth(request, reply);

      const { patientId } = request.params as Record<string, unknown>;
      const { type, limit = 20 } = request.query as Record<string, unknown>;

      let queryString = `SELECT * FROM ai_insights WHERE patient_id = $1`;
      const params: unknown[] = [patientId];

      if (type) {
        queryString += ` AND type = $2`;
        params.push(type);
      }

      queryString += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
      params.push(limit);

      const result = await query(queryString, params);

      reply.code(200).send(successResponse({
        insights: result.rows,
        total: result.rows.length,
      }));
    } catch (error) {
      reply.code(500).send(errorResponse(new AppError('ERROR', 'Failed to fetch insights')));
    }
  });

  // Save AI insight
  app.post(
    '/api/patients/:patientId/insights',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { patientId } = request.params as Record<string, unknown>;
        const { type, title, description, riskScore, confidence, recommendation, evidence } =
          request.body as Record<string, unknown>;

        const insightId = generateId();
        await query(
          `INSERT INTO ai_insights (id, patient_id, type, title, description, risk_score, confidence, recommendation, evidence)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            insightId,
            patientId,
            type,
            title,
            description,
            riskScore,
            confidence,
            recommendation,
            JSON.stringify(evidence),
          ]
        );

        reply.code(201).send(successResponse({ id: insightId }));
      } catch (error) {
        reply.code(500).send(errorResponse(new AppError('ERROR', 'Failed to save insight')));
      }
    }
  );
}
