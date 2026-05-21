import { HealthcareKnowledgeGraph, OntologyManager, GraphAnalytics } from '@healthos/knowledge-graph';

describe('Knowledge Graph Module', () => {
  let kg: HealthcareKnowledgeGraph;

  beforeEach(() => {
    const config = {
      uri: 'bolt://localhost:7687',
      username: 'neo4j',
      password: 'test',
    };
    kg = new HealthcareKnowledgeGraph(config);
  });

  describe('HealthcareKnowledgeGraph', () => {
    it('should create disease node', async () => {
      const result = await kg.createNode({
        label: 'Disease',
        properties: {
          name: 'Type 2 Diabetes',
          icd10: 'E11',
        },
      });

      expect(result.nodeId).toBeDefined();
      expect(result.label).toBe('Disease');
    });

    it('should find disease associations', async () => {
      const associations = await kg.findDiseaseAssociations('Type 2 Diabetes');

      expect(associations).toBeInstanceOf(Array);
      if (associations.length > 0) {
        expect(associations[0]).toHaveProperty('targetDisease');
        expect(associations[0]).toHaveProperty('score');
      }
    });

    it('should find treatment pathways', async () => {
      const treatments = await kg.findTreatmentPathways('Type 2 Diabetes');

      expect(treatments).toBeInstanceOf(Array);
      if (treatments.length > 0) {
        expect(treatments[0]).toHaveProperty('treatment');
        expect(treatments[0]).toHaveProperty('evidence');
      }
    });

    it('should find symptom connections', async () => {
      const connections = await kg.findSymptomConnections('Fatigue');

      expect(connections).toBeInstanceOf(Array);
      if (connections.length > 0) {
        expect(connections[0]).toHaveProperty('disease');
        expect(connections[0]).toHaveProperty('confidence');
      }
    });

    it('should find shortest path between nodes', async () => {
      const path = await kg.findShortestPath('Type 2 Diabetes', 'Metformin');

      expect(path).toBeInstanceOf(Array);
      if (path.length > 0) {
        expect(path[0]).toHaveProperty('nodeId');
        expect(path[0]).toHaveProperty('label');
      }
    });

    it('should perform clinical insight from symptoms', async () => {
      const insight = await kg.generateClinicalInsight({
        symptoms: ['Fatigue', 'Polyuria', 'Polydipsia'],
        findings: { glucose: 450 },
      });

      expect(insight).toBeDefined();
      expect(insight.primaryDiagnosis).toBeDefined();
      expect(insight.confidence).toBeGreaterThanOrEqual(0);
      expect(insight.confidence).toBeLessThanOrEqual(1);
    });

    it('should check drug-disease interactions', async () => {
      const interaction = await kg.checkDrugDiseaseInteraction('Metformin', 'Type 2 Diabetes');

      expect(interaction).toBeDefined();
      expect(interaction.contraindicated).toBeInstanceOf(Boolean);
      if (interaction.contraindicated) {
        expect(interaction.severity).toBeDefined();
      }
    });
  });

  describe('OntologyManager', () => {
    let ontology: OntologyManager;

    beforeEach(() => {
      ontology = new OntologyManager(kg);
    });

    it('should map SNOMED CT to ICD-10', () => {
      const mapping = ontology.mapSNOMEDToICD10('11891009'); // Type 2 Diabetes SNOMED code

      expect(mapping).toBeDefined();
      expect(mapping.icd10).toBeDefined();
    });

    it('should map ICD-10 to RxNorm', () => {
      const mapping = ontology.mapICD10ToRxNorm('E11');

      expect(mapping).toBeInstanceOf(Array);
      if (mapping.length > 0) {
        expect(mapping[0]).toHaveProperty('rxnormId');
        expect(mapping[0]).toHaveProperty('drugName');
      }
    });

    it('should lookup UMLS concepts', () => {
      const concept = ontology.lookupUMLSConcept('Type 2 Diabetes');

      expect(concept).toBeDefined();
      expect(concept.cui).toBeDefined();
      expect(concept.preferredTerm).toBeDefined();
    });

    it('should perform multi-ontology reasoning', () => {
      const result = ontology.performMultiOntologyReasoning({
        snomedCode: '11891009',
        icd10Code: 'E11',
        condition: 'Type 2 Diabetes',
      });

      expect(result.consistent).toBeInstanceOf(Boolean);
      expect(result.equivalentConcepts).toBeInstanceOf(Array);
    });
  });

  describe('GraphAnalytics', () => {
    let analytics: GraphAnalytics;

    beforeEach(() => {
      analytics = new GraphAnalytics(kg);
    });

    it('should calculate node centrality', async () => {
      const centrality = await analytics.calculateNodeCentrality('Type 2 Diabetes', 'betweenness');

      expect(centrality).toBeDefined();
      expect(centrality.score).toBeGreaterThanOrEqual(0);
      expect(centrality.rank).toBeGreaterThanOrEqual(1);
    });

    it('should detect communities', async () => {
      const communities = await analytics.findCommunities();

      expect(communities).toBeInstanceOf(Array);
      if (communities.length > 0) {
        expect(communities[0]).toHaveProperty('nodeIds');
        expect(communities[0]).toHaveProperty('size');
      }
    });

    it('should analyze network density', async () => {
      const density = await analytics.analyzeNetworkDensity();

      expect(density).toBeDefined();
      expect(density.density).toBeGreaterThanOrEqual(0);
      expect(density.density).toBeLessThanOrEqual(1);
    });

    it('should identify hub nodes', async () => {
      const hubs = await analytics.identifyHubs(5);

      expect(hubs).toBeInstanceOf(Array);
      if (hubs.length > 0) {
        expect(hubs[0]).toHaveProperty('nodeId');
        expect(hubs[0]).toHaveProperty('degree');
      }
    });
  });
});
