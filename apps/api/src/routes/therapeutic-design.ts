import { FastifyInstance } from 'fastify';
import {
  mRNADesigner,
  CRISPRDesigner,
  ProteinEngineer,
  type mRNADesignRequest,
  type CRISPRDesignRequest,
  type ProteinEngineeringRequest,
  type DeliveryVectorRequest,
} from '@healthos/therapeutic-design';
import { AppError } from '@healthos/shared';

export async function registerTherapeuticDesignRoutes(app: FastifyInstance) {
  // mRNA design endpoint
  app.post('/api/therapeutic-design/mrna', async (request, reply) => {
    try {
      const body = request.body as mRNADesignRequest;

      if (!body.proteinSequence || !body.targetDisease) {
        throw new AppError('INVALID_INPUT', 'Missing required fields: proteinSequence, targetDisease', 400);
      }

      const designer = new mRNADesigner();
      const result = await designer.designmRNA(body);

      return reply.code(201).send(result);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('MRNA_DESIGN_ERROR', (error as any).message, 500);
    }
  });

  // mRNA structure prediction
  app.post('/api/therapeutic-design/mrna/structure', async (request, reply) => {
    try {
      const { mRNASequence } = request.body as { mRNASequence: string };

      if (!mRNASequence) {
        throw new AppError('INVALID_INPUT', 'Missing mRNASequence', 400);
      }

      const designer = new mRNADesigner();
      const structure = designer.predictSecondaryStructure(mRNASequence);

      return reply.send(structure);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('STRUCTURE_PREDICTION_ERROR', (error as any).message, 500);
    }
  });

  // CRISPR design endpoint
  app.post('/api/therapeutic-design/crispr', async (request, reply) => {
    try {
      const body = request.body as CRISPRDesignRequest;

      if (!body.targetSequence || !body.casSystem || !body.targetGene) {
        throw new AppError('INVALID_INPUT', 'Missing required fields: targetSequence, casSystem, targetGene', 400);
      }

      const designer = new CRISPRDesigner();
      const result = await designer.designCRISPR(body);

      return reply.code(201).send(result);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('CRISPR_DESIGN_ERROR', (error as any).message, 500);
    }
  });

  // CRISPR off-target analysis
  app.post('/api/therapeutic-design/crispr/off-targets', async (request, reply) => {
    try {
      const { guideRNASequence, targetGene } = request.body as { guideRNASequence: string; targetGene: string };

      if (!guideRNASequence || !targetGene) {
        throw new AppError('INVALID_INPUT', 'Missing guideRNASequence or targetGene', 400);
      }

      const designer = new CRISPRDesigner();
      const analysis = await designer.analyzeOffTargets(guideRNASequence, targetGene);

      return reply.send(analysis);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('OFF_TARGET_ANALYSIS_ERROR', (error as any).message, 500);
    }
  });

  // Protein engineering endpoint
  app.post('/api/therapeutic-design/protein', async (request, reply) => {
    try {
      const body = request.body as ProteinEngineeringRequest;

      if (!body.proteinSequence || !body.targetFunction) {
        throw new AppError('INVALID_INPUT', 'Missing required fields: proteinSequence, targetFunction', 400);
      }

      const engineer = new ProteinEngineer();
      const result = await engineer.engineerProtein(body);

      return reply.code(201).send(result);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('PROTEIN_ENGINEERING_ERROR', (error as any).message, 500);
    }
  });

  // Protein structure analysis
  app.post('/api/therapeutic-design/protein/structure', async (request, reply) => {
    try {
      const { proteinSequence, pdbId } = request.body as { proteinSequence?: string; pdbId?: string };

      if (!proteinSequence && !pdbId) {
        throw new AppError('INVALID_INPUT', 'Provide either proteinSequence or pdbId', 400);
      }

      const engineer = new ProteinEngineer();
      const analysis = await engineer.analyzeStructure({
        proteinSequence: proteinSequence || '',
        targetFunction: 'structure_analysis',
      });

      return reply.send(analysis);
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('STRUCTURE_ANALYSIS_ERROR', (error as any).message, 500);
    }
  });

  // Delivery vector design endpoint
  app.post('/api/therapeutic-design/delivery-vector', async (request, reply) => {
    try {
      const body = request.body as DeliveryVectorRequest;

      if (!body.vectorType || !body.targetTissue || !body.payloadType) {
        throw new AppError(
          'INVALID_INPUT',
          'Missing required fields: vectorType, targetTissue, payloadType',
          400
        );
      }

      const engineer = new ProteinEngineer();
      const result = await engineer.engineerProtein({
        proteinSequence: '',
        targetFunction: `vector_${body.vectorType}`,
      });

      return reply.code(201).send({
        vectorDesign: result,
        deliveryStrategy: {
          vectorType: body.vectorType,
          targetTissue: body.targetTissue,
          payloadCapacity: body.payloadSize || 4700,
          transfectionEfficiency: 0.75,
        },
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('VECTOR_DESIGN_ERROR', (error as any).message, 500);
    }
  });

  // List therapeutic projects
  app.get('/api/therapeutic-design/projects/:patientId', async (request, reply) => {
    try {
      const { patientId } = request.params as { patientId: string };

      // Mock implementation - in production, fetch from database
      return reply.send({
        projects: [
          {
            projectId: `project_${Date.now()}`,
            patientId,
            therapeuticType: 'mRNA',
            status: 'in_progress',
            createdAt: new Date(),
          },
        ],
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('LIST_PROJECTS_ERROR', (error as any).message, 500);
    }
  });

  // Get specific therapeutic design
  app.get('/api/therapeutic-design/:designId', async (request, reply) => {
    try {
      const { designId } = request.params as { designId: string };

      // Mock implementation - in production, fetch from database
      return reply.send({
        designId,
        status: 'completed',
        therapeuticType: 'mRNA',
        results: {},
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError('GET_DESIGN_ERROR', (error as any).message, 500);
    }
  });
}
