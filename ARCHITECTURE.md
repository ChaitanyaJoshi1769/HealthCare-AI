# HealthOS Architecture Documentation

## System Design Overview

HealthOS is designed as a modular, scalable, AI-native healthcare platform with the following core principles:

- **Modularity**: Distinct, independently deployable services
- **Scalability**: Horizontal scaling through Kubernetes
- **Security**: HIPAA-compliant with encryption and audit trails
- **AI-First**: Claude API integration for all intelligent features
- **Extensibility**: Plugin-based wearable and EHR integrations

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ Auth Pages   │  Dashboard   │   AI Copilot Interface  │ │
│  │ Profile Mgmt │  Health Data │   Health Insights       │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└────────────────────────┬──────────────────────────────────────┘
                         │
                    REST / GraphQL
                         │
┌────────────────────────┴──────────────────────────────────────┐
│                  API Gateway & Load Balancer                   │
└────────────────────────┬──────────────────────────────────────┘
                         │
     ┌───────────────────┼───────────────────┐
     │                   │                   │
┌────▼──────┐   ┌────────▼─────────┐   ┌────▼──────────┐
│  Auth     │   │ Patient Data     │   │ AI Agents     │
│ Service   │   │ Service          │   │ Service       │
│           │   │                  │   │               │
│ JWT Mgmt  │   │ CRUD operations  │   │ Multi-agent   │
│ Passkeys  │   │ Data validation  │   │ orchestration │
│ OAuth     │   │ FHIR mapping     │   │ Claude API    │
└────┬──────┘   └────────┬─────────┘   └────┬──────────┘
     │                   │                   │
     └───────────────────┼───────────────────┘
                         │
     ┌───────────────────┼───────────────────┐
     │                   │                   │
┌────▼────────────┐  ┌────▼──────┐  ┌──────▼────────┐
│  PostgreSQL     │  │  Redis    │  │  Neo4j        │
│  Primary DB     │  │  Cache    │  │  Knowledge    │
│  + pgvector     │  │  Sessions │  │  Graph        │
└─────────────────┘  └───────────┘  └───────────────┘
```

## Core Services

### 1. Authentication Service

**File**: `apps/api/src/services/auth.ts`

**Responsibilities**:
- User registration and onboarding
- JWT-based authentication
- Token generation and validation
- Session management
- Password hashing

**Database Tables**:
- `users` - User accounts with credentials
- `sessions` - Active user sessions

**API Endpoints**:
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh
GET    /api/auth/me
POST   /api/auth/logout
POST   /api/auth/verify-email
```

**Security**:
- Passwords hashed with bcrypt
- JWT tokens with expiration
- Refresh token rotation
- Rate limiting on auth endpoints
- Audit logging of auth events

### 2. Patient Data Service

**File**: `apps/api/src/routes/patients.ts`

**Responsibilities**:
- Patient profile management
- Medical history tracking
- Medication management
- Health metric ingestion
- Wearable data integration
- Consent management

**Database Tables**:
- `patients` - Patient profiles
- `health_metrics` - Time-series health data
- `medications` - Current medications
- `medical_history` - Diagnoses and conditions
- `family_history` - Genetic risk factors
- `wearable_integrations` - Connected devices
- `consent_records` - Data sharing consents

**API Endpoints**:
```
POST   /api/patients
GET    /api/patients/:patientId
PUT    /api/patients/:patientId
POST   /api/patients/:patientId/metrics
GET    /api/patients/:patientId/metrics
POST   /api/patients/:patientId/medications
GET    /api/patients/:patientId/medications
POST   /api/patients/:patientId/medical-history
GET    /api/patients/:patientId/insights
```

**Data Model**:
```typescript
interface Patient {
  id: string;
  userId: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  ethnicity?: string;
  familyHistory: FamilyHistory[];
  medicalHistory: MedicalHistory[];
  medications: Medication[];
  lifestyle: LifestyleData;
}
```

### 3. AI Agent Orchestration Service

**File**: `apps/api/src/services/ai-agents.ts`

**Architecture**:

```
User Input
    │
    ▼
┌─────────────────────┐
│  Agent Dispatcher   │
│  (Route by type)    │
└────────────┬────────┘
             │
    ┌────────┼────────┐
    │        │        │
    ▼        ▼        ▼
┌────────┐┌────────┐┌────────┐
│Diag.   ││Genomic││Prevent │
│Agent   ││Agent  ││Agent   │
└───┬────┘└───┬───┘└───┬────┘
    │         │        │
    └────┬────┴────┬───┘
         │         │
    ┌────▼────┐  ┌─▼──────────┐
    │Claude   │  │Tool Calling│
    │API      │  │(Healthcare)│
    └─────────┘  └────────────┘
         │
    ┌────▼──────┐
    │Response &  │
    │Confidence  │
    │Scoring     │
    └────────────┘
```

**Agents**:

1. **Diagnostic Agent**
   - Symptom analysis
   - Differential diagnosis
   - Urgency assessment
   - Specialist recommendation

2. **Genomics Agent**
   - Variant interpretation
   - Polygenic risk scoring
   - Pharmacogenomics
   - Carrier screening

3. **Longevity Agent**
   - Healthspan optimization
   - Lifestyle recommendations
   - Supplement analysis
   - Prevention strategies

4. **Wearables Agent**
   - Time-series analysis
   - Pattern detection
   - Anomaly identification
   - Trends and predictions

5. **Research Agent**
   - Clinical trial matching
   - Literature retrieval
   - Study recommendations
   - Evidence synthesis

6. **Preventive Agent**
   - Screening recommendations
   - Vaccination status
   - Risk-based prevention
   - Guideline compliance

7. **Medication Agent**
   - Drug interaction checking
   - Dosage optimization
   - Side effect monitoring
   - Deprescribing recommendations

**Tool System**:

```typescript
const healthcareTools = [
  {
    name: 'search_medical_literature',
    description: 'Search PubMed and medical literature',
    // Implementation: Calls Entrez API
  },
  {
    name: 'analyze_genetic_variant',
    description: 'Analyze variant pathogenicity',
    // Implementation: Calls ClinVar, gnomAD
  },
  {
    name: 'check_drug_interactions',
    description: 'Check medication interactions',
    // Implementation: Uses RxNorm, drug databases
  },
  {
    name: 'calculate_risk_score',
    description: 'Calculate disease risk',
    // Implementation: Runs statistical models
  },
  {
    name: 'retrieve_clinical_guidelines',
    description: 'Get relevant clinical guidelines',
    // Implementation: Searches guideline databases
  },
];
```

### 4. Knowledge Graph Service (Future)

**Implementation**: Neo4j

**Node Types**:
- Disease
- Biomarker
- Gene
- Treatment
- Symptom
- Lifestyle
- Clinical Trial

**Relationships**:
- `ASSOCIATED_WITH` - Disease-symptom, disease-biomarker
- `CAUSED_BY` - Symptom caused by disease
- `TREATED_BY` - Disease treated by treatment
- `RESEARCHED_IN` - Condition researched in study
- `CONTRAINDICATED` - Drug contraindicated in condition

**Example Query**:
```cypher
MATCH (d:Disease)-[:ASSOCIATED_WITH]->(b:Biomarker),
      (d)-[:TREATED_BY]->(t:Treatment),
      (t)-[r:CONTRAINDICATED]->(g:Gene)
WHERE d.name = "Type 2 Diabetes"
RETURN d, b, t, g, r
```

## Data Flow Architecture

### Wearable Data Ingestion Pipeline

```
┌──────────────────┐
│ Wearable Device  │
│ (Apple Health,   │
│  Fitbit, etc.)   │
└────────┬─────────┘
         │
    ┌────▼────────────────┐
    │ Integration Adapter  │
    │ (Device-specific)    │
    └────┬─────────────────┘
         │
    ┌────▼──────────────┐
    │ Normalization     │
    │ - Units           │
    │ - Timestamps      │
    │ - Data quality    │
    └────┬──────────────┘
         │
    ┌────▼──────────────┐
    │ Validation        │
    │ - Range checks    │
    │ - Outlier detect  │
    └────┬──────────────┘
         │
    ┌────▼──────────────┐
    │ Storage           │
    │ PostgreSQL        │
    │ + pgvector        │
    └────┬──────────────┘
         │
    ┌────▼──────────────┐
    │ Indexing          │
    │ - Time-series idx │
    │ - Patient idx     │
    └───────────────────┘
```

### AI Insight Generation Pipeline

```
Patient Data Collection
├─ Medical History
├─ Health Metrics
├─ Genomics
├─ Wearables
└─ Lifestyle

         │
         ▼

┌─────────────────────┐
│ Context Aggregation │
│ - Normalize units   │
│ - Temporal order    │
│ - Fill gaps         │
└────────┬────────────┘
         │
    ┌────▼────────────────────┐
    │ Agent Processing        │
    │ - Diagnostic analysis   │
    │ - Risk scoring          │
    │ - Evidence gathering    │
    └────┬───────────────────┘
         │
    ┌────▼──────────────────┐
    │ Confidence Scoring     │
    │ - Factor weighting     │
    │ - Evidence strength    │
    │ - Uncertainty bounds   │
    └────┬──────────────────┘
         │
    ┌────▼──────────────────┐
    │ Insight Formatting    │
    │ - User-friendly       │
    │ - Citation insertion  │
    │ - Actionability       │
    └────┬──────────────────┘
         │
    ┌────▼──────────────────┐
    │ Storage & Display     │
    │ - DB insert           │
    │ - Cache update        │
    │ - UI notification     │
    └───────────────────────┘
```

## Database Schema

### Core Tables

```sql
-- Users
CREATE TABLE users (
  id VARCHAR(255) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'patient',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patients
CREATE TABLE patients (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) UNIQUE NOT NULL,
  date_of_birth DATE NOT NULL,
  gender VARCHAR(50),
  ethnicity VARCHAR(255),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Health Metrics (Time-series)
CREATE TABLE health_metrics (
  id VARCHAR(255) PRIMARY KEY,
  patient_id VARCHAR(255) NOT NULL,
  metric_type VARCHAR(255) NOT NULL,
  value DECIMAL(10, 2),
  unit VARCHAR(50),
  source VARCHAR(255),
  recorded_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  INDEX (patient_id, metric_type, recorded_at DESC)
);

-- AI Insights
CREATE TABLE ai_insights (
  id VARCHAR(255) PRIMARY KEY,
  patient_id VARCHAR(255) NOT NULL,
  type VARCHAR(255) NOT NULL,
  title VARCHAR(255),
  description TEXT,
  risk_score DECIMAL(5, 2),
  confidence DECIMAL(3, 2),
  recommendation TEXT,
  evidence JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id),
  INDEX (patient_id, type, created_at DESC)
);

-- Agent Conversations
CREATE TABLE agent_conversations (
  id VARCHAR(255) PRIMARY KEY,
  patient_id VARCHAR(255) NOT NULL,
  agent_type VARCHAR(255) NOT NULL,
  messages JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);
```

### Vector Search (pgvector)

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Research articles with embeddings
CREATE TABLE research_articles (
  id VARCHAR(255) PRIMARY KEY,
  pmid VARCHAR(255) UNIQUE,
  title VARCHAR(255),
  abstract TEXT,
  embedding vector(1536),
  -- Search similar papers
  -- SELECT * FROM research_articles 
  -- ORDER BY embedding <-> :query_embedding LIMIT 10
);
```

## Deployment Architecture

### Local Development (Docker Compose)

```
Host Machine
├─ API Container (Node.js)
├─ Web Container (Next.js)
├─ PostgreSQL Container
├─ Redis Container
└─ Network Bridge
```

### Production (Kubernetes on AWS)

```
AWS VPC
├─ EKS Cluster
│  ├─ API Pods (replicated)
│  ├─ Web Pods (replicated)
│  └─ Worker Nodes
├─ RDS PostgreSQL
├─ ElastiCache Redis
├─ S3 for uploads
├─ CloudFront CDN
└─ Route53 DNS
```

## Security Architecture

### Authentication Flow

```
1. User Registration
   ├─ Validate input
   ├─ Hash password
   ├─ Create user record
   └─ Return confirmation

2. User Login
   ├─ Verify credentials
   ├─ Generate JWT token
   ├─ Generate refresh token
   └─ Return tokens

3. API Requests
   ├─ Include Authorization header
   ├─ Verify JWT signature
   ├─ Check token expiration
   ├─ Extract user ID
   └─ Proceed with request
```

### Data Protection

```
At Rest:
├─ PostgreSQL: AES-256 encryption
├─ S3: Server-side encryption
└─ Secrets Manager: Encrypted storage

In Transit:
├─ HTTPS/TLS 1.3
├─ API authentication
└─ Rate limiting

Access Control:
├─ RBAC (role-based)
├─ Row-level security
├─ Audit logging
└─ Consent enforcement
```

## Monitoring & Observability

### Metrics

```
API Metrics:
├─ Request latency (p50, p95, p99)
├─ Error rates (4xx, 5xx)
├─ Throughput (requests/sec)
└─ Active connections

Database Metrics:
├─ Query latency
├─ Connection pool usage
├─ Slow query logs
└─ Cache hit rates

AI Metrics:
├─ Agent execution time
├─ Token usage
├─ Confidence scores
└─ Error rates by agent
```

### Logging

```
Structured Logging:
├─ Timestamp
├─ Level (info, warn, error)
├─ Service
├─ Message
├─ Context (user_id, patient_id)
└─ Stack trace (errors)

Logging Destinations:
├─ CloudWatch (AWS)
├─ ELK Stack (self-hosted)
└─ Application logs
```

## Future Enhancements

### Phase 2: Advanced Features
- **Real-time Monitoring**: WebSocket support for live health updates
- **Federated Learning**: Train models across distributed datasets
- **Population Health**: Cohort analysis and epidemiology tools
- **Knowledge Graph**: Neo4j integration for semantic reasoning

### Phase 3: Clinical Integration
- **EHR Connectors**: Direct Epic, Cerner, Athenahealth integrations
- **HL7/FHIR**: Full FHIR server implementation
- **Clinical Decision Support**: Real-time CDS hooks
- **Therapeutic Design**: mRNA, CRISPR, protein engineering tools

### Phase 4: Enterprise
- **Multi-tenancy**: Support for health systems and enterprises
- **Advanced Analytics**: Population health and outcomes research
- **API Marketplace**: 3rd party integrations
- **Compliance Automation**: Automated audit and compliance reporting
