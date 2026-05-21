# HealthOS Quick Start Guide

Get up and running with HealthOS in 5 minutes.

## 1️⃣ Prerequisites

- Node.js 20+ ([download](https://nodejs.org))
- Docker & Docker Compose ([download](https://www.docker.com/products/docker-desktop))
- An Anthropic API key ([get one](https://console.anthropic.com/))

## 2️⃣ Clone & Setup

```bash
# Clone the repository
git clone <repo-url> healthos
cd healthos

# Install pnpm (if not already installed)
npm install -g pnpm

# Install dependencies
pnpm install

# Copy environment file
cp .env.example .env

# Edit .env and add your Anthropic API key
# ANTHROPIC_API_KEY=sk-ant-...
```

## 3️⃣ Start with Docker Compose (Easiest)

```bash
# Start all services (API, Web, PostgreSQL, Redis)
docker-compose up -d

# Wait for services to be healthy (~30 seconds)
docker-compose ps

# Check API health
curl http://localhost:3000/health
# {"status":"ok","timestamp":"2024-05-21T..."}
```

**Services running:**
- 🌐 Frontend: http://localhost:3001
- 🔌 API: http://localhost:3000
- 🗄️ Database: localhost:5432 (healthos/healthos_dev)
- 💾 Cache: localhost:6379

## 4️⃣ Create Your First Account

1. Visit http://localhost:3001
2. Click "Sign Up"
3. Enter credentials:
   - First Name: John
   - Last Name: Doe
   - Email: john@example.com
   - Password: TestPassword123 (min 12 chars)
4. Click "Create Account"
5. Login with your credentials

## 5️⃣ Explore the Platform

### View Your Profile
- Dashboard shows getting started checklist
- Profile section for personal health data

### Test AI Copilot
Make an API call to the AI agent:

```bash
# Get your auth token first
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "TestPassword123"
  }'

# Response includes token:
# {"success":true,"data":{"user":{...},"token":"eyJhbGc...","refreshToken":"..."}}

# Save token to variable
TOKEN="your_token_here"

# Chat with diagnostic agent
curl -X POST http://localhost:3000/api/agents/diagnostic/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have been experiencing persistent fatigue and weight gain",
    "conversationId": "optional-conversation-id"
  }'

# Multi-agent diagnosis
curl -X POST http://localhost:3000/api/agents/diagnose \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symptoms": "Persistent headaches for 2 weeks",
    "medicalHistory": true
  }'
```

### Add Health Metrics

```bash
# Get your patient ID from the database or API response

# Add a heart rate metric
curl -X POST http://localhost:3000/api/patients/patient-id/metrics \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "heart_rate",
    "value": 72,
    "unit": "bpm",
    "source": "apple_health",
    "recordedAt": "2024-05-21T10:30:00Z"
  }'

# Add multiple metrics
curl -X POST http://localhost:3000/api/patients/patient-id/metrics \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "blood_pressure",
    "value": 120,
    "unit": "mmHg",
    "source": "manual",
    "recordedAt": "2024-05-21T10:30:00Z"
  }'
```

### Query Health Metrics

```bash
# Get recent heart rate metrics
curl -X GET "http://localhost:3000/api/patients/patient-id/metrics?type=heart_rate&limit=20" \
  -H "Authorization: Bearer $TOKEN"
```

## 🛠️ Local Development (Without Docker)

If you prefer running services locally:

```bash
# Terminal 1: Start PostgreSQL (Docker)
docker run -d \
  --name healthos-postgres \
  -e POSTGRES_USER=healthos \
  -e POSTGRES_PASSWORD=healthos_dev \
  -e POSTGRES_DB=healthos \
  -p 5432:5432 \
  postgres:16-alpine

# Terminal 2: Start Redis (Docker)
docker run -d \
  --name healthos-redis \
  -p 6379:6379 \
  redis:7-alpine

# Terminal 3: Start Backend
cd apps/api
pnpm run dev
# Server listening at http://0.0.0.0:3000

# Terminal 4: Start Frontend
cd apps/web
pnpm run dev
# Navigate to http://localhost:3001
```

## 📊 Database & Monitoring

### PostgreSQL

```bash
# Connect to database
psql postgresql://healthos:healthos_dev@localhost:5432/healthos

# List tables
\dt

# Query users
SELECT id, email, first_name, last_name, role FROM users;

# Query patients
SELECT * FROM patients WHERE user_id = 'user-id';

# Query health metrics
SELECT * FROM health_metrics WHERE patient_id = 'patient-id' ORDER BY recorded_at DESC;
```

### Redis CLI

```bash
# Connect to Redis
redis-cli

# Check keys
KEYS *

# Get session info
GET session:key

# Monitor in real-time
MONITOR
```

## 🧪 Running Tests

```bash
# Run all tests
pnpm run test

# Run tests in watch mode
pnpm run test --watch

# Run with coverage
pnpm run test --coverage

# Type checking
pnpm run type-check

# Linting
pnpm run lint
```

## 📦 Build for Production

```bash
# Build all services
pnpm run build

# Build Docker images
docker build -t healthos-api:latest apps/api
docker build -t healthos-web:latest apps/web

# Push to registry
docker push healthos-api:latest
docker push healthos-web:latest
```

## 🚀 Deploy to Kubernetes

```bash
# Build images
docker build -t healthos/api:latest apps/api
docker build -t healthos/web:latest apps/web

# Create namespace
kubectl create namespace healthos

# Create secrets
kubectl create secret generic healthos-secrets \
  --from-literal=database-url=postgresql://... \
  --from-literal=redis-url=redis://... \
  --from-literal=jwt-secret=your-secret \
  --from-literal=anthropic-api-key=$ANTHROPIC_API_KEY \
  -n healthos

# Deploy
kubectl apply -f infrastructure/k8s/

# Check deployment
kubectl get pods -n healthos
kubectl logs -f deployment/healthos-api -n healthos
```

## 🔍 Troubleshooting

### API won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Check database connection
curl http://localhost:3000/health

# View API logs
docker-compose logs -f api
```

### Frontend won't load
```bash
# Check if port 3001 is in use
lsof -i :3001

# Clear Next.js cache
rm -rf apps/web/.next
pnpm run dev
```

### Database connection issues
```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Reconnect database
docker-compose down
docker-compose up postgres -d
```

### Authentication fails
```bash
# Make sure JWT_SECRET in .env is set and >= 32 chars
echo ${#JWT_SECRET}

# Restart API
docker-compose restart api
```

## 📚 Next Steps

1. **Explore the codebase**:
   - `apps/api` - Backend service
   - `apps/web` - Frontend application
   - `packages/types` - Shared TypeScript types
   - `infrastructure` - Deployment configs

2. **Read the docs**:
   - [README.md](README.md) - Overview and features
   - [ARCHITECTURE.md](ARCHITECTURE.md) - System design details
   - [API Endpoints](#api-endpoints) - Full API reference

3. **Customize for your use case**:
   - Add wearable integrations
   - Implement genomics analysis
   - Build specialized AI agents
   - Extend data models

4. **Deploy to production**:
   - Use Terraform to provision AWS infrastructure
   - Deploy with Kubernetes
   - Configure CI/CD with GitHub Actions
   - Set up monitoring and logging

## 🆘 Getting Help

- **Issues**: Create a GitHub issue
- **Docs**: Read README.md and ARCHITECTURE.md
- **API Reference**: See inline comments in `apps/api/src/routes/`
- **Types**: Check `packages/types/src/index.ts`

---

**Happy building! 🚀**
