import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { successResponse, errorResponse, AppError, generateId, requireAuth } from '@healthos/shared';
import { query } from '../db/index.js';
import type { Variant, GenomicProfile } from '@healthos/types';
import {
  analyzeVariant,
  calculatePolygeneticRisk,
  analyzePharmacogenomics,
  performCarrierScreening,
  analyzeRareDisease,
} from '@healthos/genomics';

export async function registerGenomicsRoutes(app: FastifyInstance) {
  // Upload genomic data
  app.post('/api/genomics/upload', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAuth(request, reply);

      const { patientId, filename, fileType, fileContent } = request.body as Record<string, unknown>;

      const profileId = generateId();
      await query(
        `INSERT INTO genomic_profiles (id, patient_id, filename, file_type, status, uploaded_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
        [profileId, patientId, filename, fileType, 'pending']
      );

      // In production: process file asynchronously
      console.log(`Queued genomic file for processing: ${profileId}`);

      reply.code(202).send(
        successResponse({
          profileId,
          status: 'processing',
          message: 'Genomic file uploaded. Processing will begin shortly.',
        })
      );
    } catch (error) {
      reply.code(500).send(errorResponse(new AppError('UPLOAD_ERROR', 'Failed to upload genomic file')));
    }
  });

  // Get genomic profile
  app.get(
    '/api/genomics/profiles/:profileId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { profileId } = request.params as Record<string, unknown>;

        const result = await query(
          'SELECT * FROM genomic_profiles WHERE id = $1',
          [profileId]
        );

        if (result.rows.length === 0) {
          throw new AppError('NOT_FOUND', 'Genomic profile not found', 404);
        }

        reply.code(200).send(successResponse(result.rows[0]));
      } catch (error) {
        if (error instanceof AppError) {
          reply.code(error.statusCode).send(errorResponse(error));
        } else {
          reply.code(500).send(
            errorResponse(new AppError('ERROR', 'Failed to fetch genomic profile'))
          );
        }
      }
    }
  );

  // Analyze variants
  app.post('/api/genomics/analyze-variant', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await requireAuth(request, reply);

      const variant = request.body as Variant;

      const analysis = await analyzeVariant(variant);

      // Store analysis results
      await query(
        `INSERT INTO variants (
          id, genomic_profile_id, chromosome, position, ref, alt,
          clinvar_id, pathogenicity, allele_frequency, consequence, affected_genes
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          generateId(),
          variant.id,
          variant.chromosome,
          variant.position,
          variant.ref,
          variant.alt,
          variant.clinvarId,
          analysis.classification,
          variant.alleleFrequency,
          variant.consequence,
          JSON.stringify(variant.affectedGenes),
        ]
      );

      reply.code(200).send(successResponse(analysis));
    } catch (error) {
      reply.code(500).send(
        errorResponse(new AppError('ANALYSIS_ERROR', 'Variant analysis failed'))
      );
    }
  });

  // Calculate polygenic risk
  app.post(
    '/api/genomics/polygenic-risk',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { variants, condition, ancestry } = request.body as Record<string, unknown>;

        const risk = await calculatePolygeneticRisk(
          variants as Variant[],
          condition as string,
          ancestry as string
        );

        // Store risk score
        const riskScoreId = generateId();
        await query(
          `INSERT INTO risk_scores (
            id, patient_id, model_name, condition, score, percentile, risk_level, calculated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)`,
          [
            riskScoreId,
            (request.user as any)?.sub,
            'polygenic_risk_score',
            condition,
            risk.riskScore,
            risk.percentile,
            risk.riskCategory,
          ]
        );

        reply.code(200).send(successResponse(risk));
      } catch (error) {
        reply.code(500).send(
          errorResponse(
            new AppError('RISK_CALCULATION_ERROR', 'Failed to calculate polygenic risk')
          )
        );
      }
    }
  );

  // Pharmacogenomics analysis
  app.post(
    '/api/genomics/pharmacogenomics',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { variants, medications } = request.body as Record<string, unknown>;

        const pgxResults = await analyzePharmacogenomics(
          variants as Variant[],
          medications as string[]
        );

        // Store PGx findings
        for (const result of pgxResults) {
          await query(
            `INSERT INTO ai_insights (
              id, patient_id, type, title, description, confidence
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              generateId(),
              (request.user as any)?.sub,
              'pharmacogenomic_finding',
              `${result.gene} - ${result.phenotype} metabolizer`,
              JSON.stringify(result),
              0.9,
            ]
          );
        }

        reply.code(200).send(successResponse({ results: pgxResults }));
      } catch (error) {
        reply.code(500).send(
          errorResponse(new AppError('PGX_ERROR', 'Pharmacogenomics analysis failed'))
        );
      }
    }
  );

  // Carrier screening
  app.post(
    '/api/genomics/carrier-screening',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { variants, conditions } = request.body as Record<string, unknown>;

        const carrierResults = await performCarrierScreening(
          variants as Variant[],
          conditions as string[]
        );

        // Store carrier findings
        for (const result of carrierResults) {
          await query(
            `INSERT INTO ai_insights (
              id, patient_id, type, title, description, confidence
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              generateId(),
              (request.user as any)?.sub,
              'carrier_status',
              `${result.condition} - ${result.carrierStatus}`,
              JSON.stringify(result),
              0.95,
            ]
          );
        }

        reply.code(200).send(successResponse({ results: carrierResults }));
      } catch (error) {
        reply.code(500).send(
          errorResponse(new AppError('SCREENING_ERROR', 'Carrier screening failed'))
        );
      }
    }
  );

  // Rare disease analysis
  app.post(
    '/api/genomics/rare-disease',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { variants, symptoms } = request.body as Record<string, unknown>;

        const rareResults = await analyzeRareDisease(
          variants as Variant[],
          symptoms as string[]
        );

        // Store rare disease findings
        for (const result of rareResults) {
          await query(
            `INSERT INTO ai_insights (
              id, patient_id, type, title, description, confidence
            ) VALUES ($1, $2, $3, $4, $5, $6)`,
            [
              generateId(),
              (request.user as any)?.sub,
              'rare_disease_finding',
              result.disease,
              `Potential match for ${result.disease}`,
              result.confidence,
            ]
          );
        }

        reply.code(200).send(successResponse({ results: rareResults }));
      } catch (error) {
        reply.code(500).send(
          errorResponse(new AppError('RARE_DISEASE_ERROR', 'Rare disease analysis failed'))
        );
      }
    }
  );

  // Get variant interpretations
  app.get(
    '/api/genomics/variants/:patientId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { patientId } = request.params as Record<string, unknown>;

        const result = await query(
          `SELECT v.* FROM variants v
           JOIN genomic_profiles gp ON v.genomic_profile_id = gp.id
           WHERE gp.patient_id = $1
           ORDER BY v.created_at DESC`,
          [patientId]
        );

        reply.code(200).send(
          successResponse({
            variants: result.rows,
            total: result.rows.length,
          })
        );
      } catch (error) {
        reply.code(500).send(errorResponse(new AppError('ERROR', 'Failed to fetch variants')));
      }
    }
  );

  // Get genomic summary
  app.get(
    '/api/genomics/summary/:patientId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { patientId } = request.params as Record<string, unknown>;

        // Get latest genomic profile
        const profileResult = await query(
          `SELECT * FROM genomic_profiles WHERE patient_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
          [patientId]
        );

        if (profileResult.rows.length === 0) {
          throw new AppError('NOT_FOUND', 'No genomic data found for patient', 404);
        }

        const profile = profileResult.rows[0];

        // Get variant summary
        const variantsResult = await query(
          `SELECT COUNT(*) as count, pathogenicity FROM variants
           WHERE genomic_profile_id = $1
           GROUP BY pathogenicity`,
          [profile.id]
        );

        // Get risk scores
        const risksResult = await query(
          `SELECT condition, score, percentile, risk_level FROM risk_scores
           WHERE patient_id = $1
           ORDER BY calculated_at DESC LIMIT 5`,
          [patientId]
        );

        reply.code(200).send(
          successResponse({
            profile,
            variantSummary: variantsResult.rows,
            topRisks: risksResult.rows,
            recommendations: [
              'Consider genetic counseling for pathogenic variants',
              'Review pharmacogenomic recommendations with pharmacist',
              'Discuss family screening for carrier status conditions',
            ],
          })
        );
      } catch (error) {
        if (error instanceof AppError) {
          reply.code(error.statusCode).send(errorResponse(error));
        } else {
          reply.code(500).send(errorResponse(new AppError('ERROR', 'Failed to fetch genomic summary')));
        }
      }
    }
  );
}
