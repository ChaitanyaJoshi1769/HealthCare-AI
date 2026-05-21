import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { successResponse, errorResponse, AppError, requireAuth } from '@healthos/shared';
import {
  HealthcareKnowledgeGraph,
  OntologyManager,
  GraphAnalytics,
} from '@healthos/knowledge-graph';

// Initialize knowledge graph
const kg = new HealthcareKnowledgeGraph({
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  username: process.env.NEO4J_USER || 'neo4j',
  password: process.env.NEO4J_PASSWORD || 'password',
  database: 'neo4j',
});

export async function registerKnowledgeGraphRoutes(app: FastifyInstance) {
  // Find disease associations
  app.get(
    '/api/knowledge-graph/disease/:diseaseId/associations',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { diseaseId } = request.params as Record<string, unknown>;

        const result = await kg.findDiseaseAssociations(diseaseId as string);

        reply.code(200).send(successResponse(result));
      } catch (error) {
        reply.code(500).send(
          errorResponse(new AppError('ERROR', 'Failed to find disease associations'))
        );
      }
    }
  );

  // Find treatment pathways
  app.get(
    '/api/knowledge-graph/disease/:diseaseId/treatments',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { diseaseId } = request.params as Record<string, unknown>;

        const result = await kg.findTreatmentPathways(diseaseId as string);

        reply.code(200).send(successResponse(result));
      } catch (error) {
        reply.code(500).send(
          errorResponse(new AppError('ERROR', 'Failed to find treatment pathways'))
        );
      }
    }
  );

  // Find symptom connections
  app.get(
    '/api/knowledge-graph/symptom/:symptomId/connections',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { symptomId } = request.params as Record<string, unknown>;

        const result = await kg.findSymptomConnections(symptomId as string);

        reply.code(200).send(successResponse(result));
      } catch (error) {
        reply.code(500).send(
          errorResponse(new AppError('ERROR', 'Failed to find symptom connections'))
        );
      }
    }
  );

  // Find shortest path between two concepts
  app.get(
    '/api/knowledge-graph/path/:sourceId/:targetId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { sourceId, targetId } = request.params as Record<string, unknown>;
        const { maxDepth = 5 } = request.query as Record<string, unknown>;

        const result = await kg.findShortestPath(
          sourceId as string,
          targetId as string,
          parseInt(maxDepth as string) || 5
        );

        if (!result) {
          reply.code(404).send(
            errorResponse(new AppError('NOT_FOUND', 'No path found between concepts', 404))
          );
          return;
        }

        reply.code(200).send(successResponse(result));
      } catch (error) {
        reply.code(500).send(errorResponse(new AppError('ERROR', 'Failed to find path')));
      }
    }
  );

  // Generate clinical insight
  app.post(
    '/api/knowledge-graph/clinical-insight',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { symptoms } = request.body as Record<string, unknown>;

        const insight = await kg.generateClinicalInsight(symptoms as string[]);

        reply.code(200).send(successResponse(insight));
      } catch (error) {
        reply.code(500).send(
          errorResponse(new AppError('ERROR', 'Failed to generate clinical insight'))
        );
      }
    }
  );

  // Check drug-disease interaction
  app.post(
    '/api/knowledge-graph/drug-disease-check',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { drugId, diseaseId } = request.body as Record<string, unknown>;

        const result = await kg.checkDrugDiseaseInteraction(drugId as string, diseaseId as string);

        reply.code(200).send(successResponse(result));
      } catch (error) {
        reply.code(500).send(
          errorResponse(new AppError('ERROR', 'Failed to check drug-disease interaction'))
        );
      }
    }
  );

  // Find gene-disease relationship
  app.get(
    '/api/knowledge-graph/gene/:geneId/disease/:diseaseId',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { geneId, diseaseId } = request.params as Record<string, unknown>;

        const path = await kg.findGeneDiseasePath(geneId as string, diseaseId as string);

        if (!path) {
          reply.code(404).send(
            errorResponse(new AppError('NOT_FOUND', 'No gene-disease relationship found', 404))
          );
          return;
        }

        reply.code(200).send(successResponse(path));
      } catch (error) {
        reply.code(500).send(
          errorResponse(new AppError('ERROR', 'Failed to find gene-disease relationship'))
        );
      }
    }
  );

  // Find biomarkers for disease
  app.get(
    '/api/knowledge-graph/disease/:diseaseId/biomarkers',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { diseaseId } = request.params as Record<string, unknown>;

        const biomarkers = await kg.findBiomarkerForDisease(diseaseId as string);

        reply.code(200).send(successResponse({ biomarkers }));
      } catch (error) {
        reply.code(500).send(
          errorResponse(new AppError('ERROR', 'Failed to find biomarkers'))
        );
      }
    }
  );

  // Ontology mapping endpoints
  app.post(
    '/api/knowledge-graph/ontology/snomed-to-icd10',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { snomedCode } = request.body as Record<string, unknown>;

        const icdCode = OntologyManager.mapSNOMEDToICD10(snomedCode as string);

        reply.code(200).send(successResponse({ snomedCode, icdCode }));
      } catch (error) {
        reply.code(500).send(
          errorResponse(new AppError('ERROR', 'Failed to map SNOMED to ICD-10'))
        );
      }
    }
  );

  app.post(
    '/api/knowledge-graph/ontology/icd10-to-rxnorm',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { icdCode } = request.body as Record<string, unknown>;

        const drugs = OntologyManager.mapICD10ToRxNorm(icdCode as string);

        reply.code(200).send(successResponse({ icdCode, drugs }));
      } catch (error) {
        reply.code(500).send(
          errorResponse(new AppError('ERROR', 'Failed to map ICD-10 to RxNorm'))
        );
      }
    }
  );

  // Graph analytics
  app.post(
    '/api/knowledge-graph/analytics/network-density',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        await requireAuth(request, reply);

        const { nodes, edges } = request.body as Record<string, unknown>;

        const density = GraphAnalytics.analyzeNetworkDensity(
          nodes as any[],
          edges as any[]
        );

        reply.code(200).send(
          successResponse({
            density,
            interpretation: `Network density is ${(density * 100).toFixed(2)}%`,
          })
        );
      } catch (error) {
        reply.code(500).send(
          errorResponse(new AppError('ERROR', 'Failed to analyze network density'))
        );
      }
    }
  );
}
