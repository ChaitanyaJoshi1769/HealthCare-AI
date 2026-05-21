# HealthOS API Documentation

Complete API reference for all HealthOS endpoints across Phases 1-4.

## Table of Contents
- [Phase 1: Core Platform](#phase-1-core-platform)
- [Phase 2: Genomics & Intelligence](#phase-2-genomics--intelligence)
- [Phase 3: Therapeutic Design](#phase-3-therapeutic-design)
- [Phase 4: Enterprise](#phase-4-enterprise)

---

## Phase 1: Core Platform

### Authentication
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET /api/auth/me
```

### Patient Management
```
POST /api/patients
GET /api/patients/:patientId
PUT /api/patients/:patientId
GET /api/patients/:patientId/metrics
POST /api/patients/:patientId/metrics
GET /api/patients/:patientId/medications
POST /api/patients/:patientId/medications
GET /api/patients/:patientId/conditions
POST /api/patients/:patientId/conditions
GET /api/patients/:patientId/wearables
```

### AI Agents
```
POST /api/agents/:agentType/chat
POST /api/agents/diagnose
GET /api/agents/:conversationId/history
```

### Health Check
```
GET /health
```

---

## Phase 2: Genomics & Intelligence

### Genomic Analysis
```
POST /api/genomics/upload
  Body: { file: File, patientId: string, source: string }
  Response: { profileId: string, fileHash: string }

POST /api/genomics/analyze-variant
  Body: { variantData: VariantInput, genomicProfileId: string }
  Response: { 
    variantId: string,
    pathogenicity: number,
    clinvar_sig: string,
    recommendations: string[]
  }

POST /api/genomics/polygenic-risk
  Body: { genomicProfileId: string, conditions: string[] }
  Response: { 
    prsScores: PRSResult[],
    riskCategories: string[]
  }

POST /api/genomics/pharmacogenomics
  Body: { genomicProfileId: string, medications: string[] }
  Response: {
    phenotypes: { gene: string, phenotype: string }[],
    dosageRecommendations: DosageRec[]
  }

POST /api/genomics/carrier-screening
  Body: { genomicProfileId: string }
  Response: {
    carrierStatus: CarrierResult[],
    reproductiveRisk: number
  }

POST /api/genomics/rare-disease
  Body: { variantId: string }
  Response: {
    matchedDiseases: RareDiseaseMatch[],
    confidence: number
  }

GET /api/genomics/profiles/:profileId
  Response: { profile: GenomicProfile, summary: string }

GET /api/genomics/variants/:patientId
  Response: { variants: Variant[] }

GET /api/genomics/summary/:patientId
  Response: { summary: GenomicSummary }
```

### Knowledge Graph
```
GET /api/knowledge-graph/disease/:diseaseId/assoc
  Response: { associations: Association[] }

GET /api/knowledge-graph/disease/:diseaseId/treat
  Response: { treatments: Treatment[] }

GET /api/knowledge-graph/symptom/:symptomId/conn
  Response: { connections: Connection[] }

GET /api/knowledge-graph/path/:srcId/:tgtId
  Response: { path: Node[], distance: number }

POST /api/knowledge-graph/clinical-insight
  Body: { symptoms: string[], findings: object }
  Response: { insight: Insight, reasoning: string }

POST /api/knowledge-graph/drug-disease-check
  Body: { drug: string, disease: string }
  Response: { interaction: Interaction, severity: string }

GET /api/knowledge-graph/analytics/centrality
  Response: { nodeIds: string[], scores: number[] }

GET /api/knowledge-graph/analytics/communities
  Response: { communities: string[][] }
```

---

## Phase 3: Therapeutic Design

### mRNA Design
```
POST /api/therapeutic-design/mrna
  Body: { 
    proteinSequence: string,
    targetDisease: string,
    optimizationGoals: string[]
  }
  Response: {
    designId: string,
    mRNASequence: string,
    optimizationScores: object,
    synthesisProtocol: object
  }

POST /api/therapeutic-design/mrna/structure
  Body: { mRNASequence: string }
  Response: {
    secondaryStructure: string,
    mfeScore: number,
    stability: string,
    modifications: string[]
  }
```

### CRISPR Design
```
POST /api/therapeutic-design/crispr
  Body: {
    targetSequence: string,
    targetGene: string,
    casSystem: 'SpCas9' | 'SaCas9' | 'Cas12a'
  }
  Response: {
    designId: string,
    guideRNAs: string[],
    specificityScore: number,
    offTargetAnalysis: object
  }

POST /api/therapeutic-design/crispr/off-targets
  Body: { guideRNASequence: string, targetGene: string }
  Response: {
    offTargetSites: string[],
    riskLevel: string,
    mitigationStrategies: string[]
  }
```

### Protein Engineering
```
POST /api/therapeutic-design/protein
  Body: {
    proteinSequence: string,
    targetFunction: string
  }
  Response: {
    designId: string,
    engineeredSequence: string,
    structuralAnalysis: object,
    mutations: Mutation[]
  }

POST /api/therapeutic-design/protein/structure
  Body: { proteinSequence: string, pdbId?: string }
  Response: {
    plddt: number,
    pae: number,
    thermicStability: number,
    bindingSites: string[]
  }
```

### Delivery Vector
```
POST /api/therapeutic-design/delivery-vector
  Body: {
    vectorType: string,
    targetTissue: string,
    payloadType: string,
    payloadSize?: number
  }
  Response: {
    vectorDesign: object,
    deliveryStrategy: object,
    transfectionEfficiency: number
  }
```

### Project Management
```
GET /api/therapeutic-design/projects/:patientId
  Response: { projects: Project[] }

GET /api/therapeutic-design/:designId
  Response: { design: DesignDetail }
```

---

## Phase 4: Enterprise

### Multi-Tenancy & Organization
```
POST /api/organizations
  Body: { tenantId: string, name: string, type: string }
  Response: { tenantConfig: TenantConfig }

GET /api/organizations/:tenantId
  Response: { organization: Organization }

PUT /api/organizations/:tenantId
  Body: { customizations: object }
  Response: { organization: Organization }
```

### EHR Integration
```
POST /api/ehr-sync/connect
  Body: {
    system: 'epic' | 'cerner' | 'athenahealth' | 'fhir',
    endpoint: string,
    credentials: object
  }
  Response: { connected: boolean, lastValidated: string }

POST /api/ehr-sync/sync-patient
  Body: { patientId: string, ehrSystem: string }
  Response: { 
    synced: boolean,
    records: object,
    syncLog: SyncLog
  }

POST /api/ehr-sync/fhir/search
  Body: { resourceType: string, criteria: object }
  Response: { results: FHIRResource[] }
```

### Population Health Analytics
```
POST /api/population-health/cohort/analyze
  Body: { name: string, filters: Filter[] }
  Response: {
    analytics: PopulationHealthAnalytics,
    metrics: PopulationMetrics
  }

POST /api/population-health/high-risk-patients
  Body: { cohortId: string, riskThreshold: number }
  Response: { 
    highRiskPatients: HighRiskPatient[],
    count: number
  }

POST /api/population-health/roi-analysis
  Body: { condition: string, targetPopulation: number }
  Response: { roiAnalysis: ROIAnalysis }
```

### Federated Learning
```
POST /api/federated-learning/initialize
  Body: {
    modelName: string,
    trainingStrategy: 'horizontal' | 'vertical',
    participants: Participant[]
  }
  Response: { roundId: string, startTime: string }

POST /api/federated-learning/aggregate
  Body: { roundId: string, modelWeights: ModelWeight[] }
  Response: { aggregatedWeights: number[] }

GET /api/federated-learning/:roundId/privacy-analysis
  Response: {
    epsilonUsed: number,
    deltaUsed: number,
    riskLevel: string
  }
```

### Clinical Decision Support
```
POST /api/cds/evaluate-order
  Body: { patientData: object, proposedOrder: object }
  Response: {
    hooks: CDSHook[],
    alerts: string[]
  }

GET /api/cds/hooks
  Response: {
    hooks: [{
      hook: string,
      title: string,
      description: string
    }]
  }
```

### Advanced Analytics
```
GET /api/advanced-analytics/predictions?patientId=:patientId
  Response: {
    predictions: [{
      model: string,
      prediction: number,
      confidence: number
    }]
  }

POST /api/advanced-analytics/anomalies
  Body: { cohortId: string, timeWindow: string }
  Response: {
    anomaliesDetected: number,
    patterns: string[]
  }
```

---

## Error Handling

All endpoints return error responses in this format:
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message",
    "statusCode": 400
  }
}
```

Common HTTP Status Codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 500: Internal Server Error

---

## Authentication

All endpoints except `/health` and `/api/auth/*` require Bearer token authentication:

```
Authorization: Bearer <JWT_TOKEN>
```

---

## Rate Limiting

API rate limits:
- Default: 100 requests per 15 minutes per user
- Enterprise: Configurable per tenant

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

---

## API Versioning

Current API version: v1
```
GET /api/v1/... (future)
```

---

Last Updated: 2024-05-21
Total Endpoints: 60+
