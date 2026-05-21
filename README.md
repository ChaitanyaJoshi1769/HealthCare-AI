# HealthOS - AI-Native Precision Healthcare Intelligence Platform

A production-ready, full-stack healthcare intelligence platform combining EHR interoperability, genomics analysis, wearables integration, and AI-powered health copilots with Claude API.

## 🎯 Platform Overview

HealthOS is the operating system for intelligent, personalized healthcare. It integrates:

- **AI Health Copilots** - Multi-agent Claude-powered medical intelligence
- **Wearables Integration** - Apple Health, Fitbit, Garmin, Oura, WHOOP, Dexcom
- **Genomics Analysis** - Variant annotation, polygenic risk scoring, pharmacogenomics
- **Health Intelligence Graph** - Knowledge graph reasoning over biomedical ontologies
- **Risk Prediction** - Personalized disease risk modeling
- **Digital Health Twin** - Longitudinal patient modeling and intervention simulation
- **Clinical Research Retrieval** - RAG-based medical literature integration
- **Therapeutic Design Infrastructure** - Future-ready precision medicine foundation

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Next.js 15+ with App Router
- React 19, TypeScript
- Tailwind CSS + Framer Motion
- TanStack Query + Zustand
- Recharts for data visualization

**Backend:**
- Node.js 20+ with Fastify
- PostgreSQL 16 with pgvector
- Redis for caching
- Neo4j (optional) for knowledge graphs

**AI/ML:**
- Claude API (Opus, Sonnet, Haiku)
- Multi-agent orchestration
- LangGraph for workflows
- Medical embeddings
- Biomedical ontologies (SNOMED, ICD-10, RxNorm, UMLS)

**Infrastructure:**
- Docker & Docker Compose
- Kubernetes (EKS ready)
- Terraform for IaC
- AWS (S3, RDS, ElastiCache, ECR)
- CI/CD with GitHub Actions

## 📁 Monorepo Structure

```
healthos/
├── apps/
│   ├── api/              # Fastify backend
│   │   ├── src/
│   │   │   ├── config.ts
│   │   │   ├── db/
│   │   │   ├── services/
│   │   │   ├── routes/
│   │   │   └── index.ts
│   │   └── Dockerfile
│   └── web/              # Next.js frontend
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   └── lib/
│       └── Dockerfile
├── packages/
│   ├── types/            # Shared TypeScript types
│   ├── shared/           # Shared utilities
│   ├── db/               # Database client
│   └── ai/               # AI orchestration (future)
├── infrastructure/
│   ├── k8s/              # Kubernetes manifests
│   ├── terraform/        # AWS infrastructure
│   └── docker-compose.yml
└── .github/workflows/    # CI/CD pipelines
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose (for containerized development)
- PostgreSQL 16 (or use Docker)
- Redis (or use Docker)

### Local Development

1. **Clone and install dependencies:**

```bash
git clone https://github.com/yourusername/healthos.git
cd healthos

# Install dependencies
pnpm install
```

2. **Set up environment:**

```bash
cp .env.example .env
# Edit .env with your Anthropic API key and database settings
```

3. **Run with Docker Compose (recommended):**

```bash
docker-compose up -d

# Wait for services to start, then run migrations
pnpm run db:migrate
pnpm run db:seed
```

4. **Start development servers:**

```bash
# Terminal 1: Backend
cd apps/api
pnpm run dev

# Terminal 2: Frontend
cd apps/web
pnpm run dev
```

Visit `http://localhost:3001` (frontend) and `http://localhost:3000/health` (API health check).

### Using Docker Compose (All-in-One)

```bash
# Start all services
docker-compose up

# Stop services
docker-compose down

# View logs
docker-compose logs -f api
```

Services:
- **API**: `http://localhost:3000`
- **Web**: `http://localhost:3001`
- **PostgreSQL**: `localhost:5432`
- **Redis**: `localhost:6379`

## 📚 Core Modules

### 1. Authentication (`apps/api/src/services/auth.ts`)

- JWT-based authentication
- User registration and login
- Token generation and verification
- Session management

**API Endpoints:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### 2. Healthcare Data Ingestion

Supports:
- **Wearables**: Apple Health, Fitbit, Garmin, Oura, WHOOP, Dexcom
- **EHR**: Epic, Cerner, Athenahealth
- **File Formats**: HL7/FHIR, DICOM, CSV, PDF, VCF, FASTQ
- **Manual Upload**: Medical records, genomic data

**Database Tables:**
- `health_metrics` - Wearable and clinical measurements
- `wearable_integrations` - Connected device credentials
- `medical_history` - Patient diagnoses (ICD-10 coded)
- `medications` - Active medications (RxNorm coded)

### 3. AI Agent Orchestration (`apps/api/src/services/ai-agents.ts`)

Multi-agent system with specialized agents:

```typescript
type AgentType = 
  | 'diagnostic'        // Symptom analysis, differential diagnosis
  | 'genomics'          // Genetic variant interpretation
  | 'longevity'         // Healthspan optimization
  | 'wearables'         // Health data analysis
  | 'research'          // Clinical trial matching
  | 'preventive'        // Preventive care recommendations
  | 'medication'        // Drug interactions, optimization
```

**Features:**
- Structured tool calling
- Memory and context awareness
- Confidence scoring
- Evidence-based citations
- Longitudinal reasoning

**Example Usage:**
```typescript
const { response, messages } = await runHealthcareAgent(
  'diagnostic',
  'I have been experiencing persistent headaches for 2 weeks',
  conversationHistory
);
```

### 4. Patient Profiles (`apps/api/src/routes/patients.ts`)

**Endpoints:**
- `POST /api/patients` - Create patient profile
- `GET /api/patients/:patientId` - Get patient data
- `POST /api/patients/:patientId/metrics` - Add health metric
- `GET /api/patients/:patientId/metrics` - Retrieve metrics
- `POST /api/patients/:patientId/medications` - Add medication
- `POST /api/patients/:patientId/insights` - Save AI insight

### 5. AI Insights & Risk Scoring

**Insight Types:**
- `disease_risk` - Personalized disease risk assessment
- `preventive_care` - Screening and vaccination recommendations
- `medication_interaction` - Drug interaction warnings
- `lifestyle_recommendation` - Personalized health optimization
- `genomic_finding` - Genetic test interpretation
- `clinical_research_match` - Relevant trial matching

**Risk Scoring:**
Implements validated models for:
- Cardiovascular disease (Framingham, ASCVD)
- Type 2 Diabetes (Findrisk)
- Cancer predisposition
- Neurodegenerative risk
- Sleep disorders
- Metabolic health

### 6. Knowledge Graph (Future)

Planned Neo4j integration for:
- Disease-biomarker relationships
- Treatment pathways
- Gene-disease associations
- Drug-target interactions
- Clinical guideline networks

**Ontologies:**
- SNOMED CT (clinical terminology)
- ICD-10 (diagnoses)
- RxNorm (medications)
- UMLS (unified medical language)

## 🔒 Security & Compliance

### HIPAA Compliance

- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- PHI isolation and access controls
- Audit logging for all data access
- Consent tracking and management
- De-identification pipelines

### Data Protection

- Role-based access control (RBAC)
- Row-level security (RLS)
- API rate limiting
- SQL injection prevention (parameterized queries)
- CORS security headers
- JWT token rotation

### Secrets Management

- Environment variables
- AWS Secrets Manager (production)
- HashiCorp Vault (enterprise)
- Never commit `.env` files

## 🧪 Testing

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test --watch

# Run tests with coverage
pnpm run test --coverage

# Type checking
pnpm run type-check

# Linting
pnpm run lint
```

## 📦 Deployment

### Docker Deployment

```bash
# Build images
docker build -t healthos-api:latest apps/api
docker build -t healthos-web:latest apps/web

# Run with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f
```

### Kubernetes Deployment

```bash
# Create namespace
kubectl apply -f infrastructure/k8s/namespace.yaml

# Create secrets
kubectl create secret generic healthos-secrets \
  --from-literal=database-url=$DATABASE_URL \
  --from-literal=redis-url=$REDIS_URL \
  --from-literal=jwt-secret=$JWT_SECRET \
  --from-literal=anthropic-api-key=$ANTHROPIC_API_KEY \
  -n healthos

# Deploy services
kubectl apply -f infrastructure/k8s/

# Check deployment
kubectl get pods -n healthos
```

### Terraform Deployment (AWS)

```bash
cd infrastructure/terraform

# Initialize Terraform
terraform init

# Plan infrastructure
terraform plan -var-file=prod.tfvars

# Apply infrastructure
terraform apply -var-file=prod.tfvars

# Outputs
terraform output rds_endpoint
terraform output redis_endpoint
```

## 🔄 CI/CD Pipeline

GitHub Actions workflow:

1. **Test** - Run type checks, linting, and tests
2. **Build** - Build Docker images
3. **Push** - Push images to container registry
4. **Deploy** - Deploy to Kubernetes (on main branch)

See `.github/workflows/ci.yml` for details.

## 📖 API Documentation

### Health Check

```bash
GET /health
```

### Authentication

```bash
# Register
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123456",
  "firstName": "John",
  "lastName": "Doe"
}

# Login
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "securepassword123456"
}

# Response
{
  "success": true,
  "data": {
    "user": { /* user object */ },
    "token": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

### Patient Data

```bash
# Create patient profile
POST /api/patients
Authorization: Bearer TOKEN

{
  "dateOfBirth": "1990-01-15",
  "gender": "male",
  "ethnicity": "Caucasian"
}

# Add health metric
POST /api/patients/:patientId/metrics
{
  "type": "heart_rate",
  "value": 72,
  "unit": "bpm",
  "source": "apple_health",
  "recordedAt": "2024-05-21T10:30:00Z"
}

# Get metrics
GET /api/patients/:patientId/metrics?type=heart_rate&limit=100
```

### AI Agents

```bash
# Chat with agent
POST /api/agents/:agentType/chat
{
  "message": "I've been experiencing fatigue and weight gain",
  "conversationId": "optional-conversation-id"
}

# Multi-agent diagnosis
POST /api/agents/diagnose
{
  "symptoms": "Persistent headaches for 2 weeks",
  "medicalHistory": { /* optional */ }
}
```

## 🤝 Contributing

1. Create a branch: `git checkout -b feature/amazing-feature`
2. Make changes and test: `pnpm test`
3. Commit: `git commit -am 'Add amazing feature'`
4. Push: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📋 Roadmap

### Phase 1 (Current)
- ✅ Core platform architecture
- ✅ Authentication & authorization
- ✅ Patient data ingestion
- ✅ AI agent orchestration
- ✅ Frontend MVP
- ⏳ Wearable integrations

### Phase 2
- Genomics engine with variant analysis
- Health knowledge graph
- Risk prediction models
- Digital health twin
- Clinical trial matching

### Phase 3
- Therapeutic design infrastructure
- mRNA & CRISPR workflows
- Protein engineering tools
- Advanced molecular visualization
- Research collaboration platform

### Phase 4
- Federated learning
- Population health analytics
- Real-time clinical decision support
- 3rd party integrations (Epic, Cerner)
- Mobile applications

## 📄 License

MIT License - See LICENSE file for details

## 🔗 References

Platform inspired by:
- Tempus AI
- 23andMe
- Flatiron Health
- Foundation Medicine
- OpenEvidence
- Neko Health
- Apple Health
- Human API
- Epic Systems
- Benchling

## 📞 Support

For issues, feature requests, and discussions:
- GitHub Issues: [Create an issue](https://github.com/yourusername/healthos/issues)
- Email: support@healthos.health
- Documentation: [healthos.health/docs](https://healthos.health/docs)

---

Built with ❤️ for the future of personalized healthcare.
