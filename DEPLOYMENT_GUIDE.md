# HealthOS Deployment & Production Checklist

Comprehensive guide for deploying HealthOS to production across all 4 phases.

## Pre-Deployment Requirements

### 1. Infrastructure Setup
- [ ] AWS account configured with VPC, security groups, IAM roles
- [ ] RDS PostgreSQL instance created (version 14+)
- [ ] ElastiCache Redis instance deployed (version 7+)
- [ ] Neo4j Enterprise cluster setup (version 5+)
- [ ] S3 buckets created for genomic data storage
- [ ] CloudFront distribution configured for static assets
- [ ] Route53 DNS records configured
- [ ] ACM SSL/TLS certificates requested and validated

### 2. Environment Configuration
- [ ] Copy `.env.example` to `.env`
- [ ] Update all API keys and credentials:
  - [ ] ANTHROPIC_API_KEY
  - [ ] EHR system credentials (Epic, Cerner, Athenahealth)
  - [ ] External genomics APIs (ClinVar, gnomAD, PharmGKB)
  - [ ] AWS credentials and S3 access
  - [ ] SMTP credentials for email
- [ ] Generate strong JWT_SECRET with high entropy
- [ ] Set ENCRYPTION_KEY for sensitive data
- [ ] Configure CORS_ORIGIN for production domain
- [ ] Review and update rate limiting thresholds

### 3. Database Migrations
```bash
# Run all pending migrations in order:
# 001_base_schema.sql
# 002_add_genomics_tables.sql
# 003_add_therapeutic_design_tables.sql
# 004_add_enterprise_tables.sql

npm run db:migrate

# Verify migration status
npm run db:migrate:status

# Create backups
pg_dump healthos > backups/pre_production_backup.sql
```

### 4. Neo4j Setup
```bash
# Initialize Neo4j with base ontology
neo4j-admin import --database=neo4j \
  --nodes=disease.csv \
  --nodes=gene.csv \
  --nodes=treatment.csv \
  --relationships=associations.csv

# Create indexes
CREATE INDEX disease_name FOR (d:Disease) ON (d.name);
CREATE INDEX gene_symbol FOR (g:Gene) ON (g.symbol);
```

### 5. Build & Deployment
```bash
# Build all packages
npm run build

# Run type checking
npm run type-check

# Build Docker images
docker build -t healthos-api:latest -f apps/api/Dockerfile .
docker build -t healthos-web:latest -f apps/web/Dockerfile .

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com
docker tag healthos-api:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/healthos-api:v0.1.0
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/healthos-api:v0.1.0
```

---

## Testing Checklist

### Unit & Integration Tests
```bash
# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage

# Required coverage thresholds:
# - Statements: 80%
# - Branches: 75%
# - Functions: 80%
# - Lines: 80%
```

### Test Scenarios (Phase-Specific)

#### Phase 1: Core Platform
- [ ] User authentication (register, login, token refresh)
- [ ] Patient data CRUD operations
- [ ] Health metrics ingestion
- [ ] AI agent conversations
- [ ] JWT validation and expiration

#### Phase 2: Genomics
- [ ] Variant file upload and parsing
- [ ] Variant analysis with pathogenicity scoring
- [ ] PRS calculation with multiple conditions
- [ ] Pharmacogenomics phenotyping
- [ ] Carrier screening assessment
- [ ] Knowledge graph queries and traversals

#### Phase 3: Therapeutic Design
- [ ] mRNA sequence design and optimization
- [ ] CRISPR guide RNA design and off-target analysis
- [ ] Protein structure prediction
- [ ] Delivery vector engineering
- [ ] Project management and history

#### Phase 4: Enterprise
- [ ] Multi-tenant isolation and data security
- [ ] EHR connector authentication and sync
- [ ] FHIR R4 and STU3 compatibility
- [ ] Population health cohort analysis
- [ ] Federated learning aggregation
- [ ] CDS hook evaluation
- [ ] Advanced analytics predictions

### Performance Tests
```bash
# Load testing with k6
k6 run tests/load/api_endpoints.js

# Benchmarks:
# - API response time: <200ms (p95)
# - Database query: <100ms (p95)
# - Knowledge graph traversal: <500ms (p95)
```

### Security Tests
- [ ] OWASP Top 10 vulnerability scan
- [ ] SQL injection prevention verified
- [ ] XSS protection enabled
- [ ] CSRF token validation working
- [ ] Rate limiting functional
- [ ] JWT validation proper
- [ ] Sensitive data encryption verified

---

## Kubernetes Deployment

### 1. Create Kubernetes Manifests
```bash
# Apply infrastructure
kubectl apply -f infrastructure/k8s/namespace.yaml
kubectl apply -f infrastructure/k8s/configmap.yaml
kubectl apply -f infrastructure/k8s/secrets.yaml

# Deploy services
kubectl apply -f infrastructure/k8s/postgres-statefulset.yaml
kubectl apply -f infrastructure/k8s/redis-deployment.yaml
kubectl apply -f infrastructure/k8s/neo4j-statefulset.yaml

# Deploy application
kubectl apply -f infrastructure/k8s/api-deployment.yaml
kubectl apply -f infrastructure/k8s/web-deployment.yaml

# Create ingress
kubectl apply -f infrastructure/k8s/ingress.yaml
```

### 2. Verify Deployments
```bash
# Check pod status
kubectl get pods -n healthos

# Check services
kubectl get svc -n healthos

# Check ingress
kubectl get ingress -n healthos

# View logs
kubectl logs -f deployment/healthos-api -n healthos
```

### 3. Health Checks
```bash
# API health check
curl http://healthos-api:3000/health

# Database connectivity
kubectl exec -it postgres-0 -n healthos -- pg_isready

# Redis connectivity
kubectl exec -it redis-0 -n healthos -- redis-cli ping

# Neo4j connectivity
kubectl exec -it neo4j-0 -n healthos -- cypher-shell
```

---

## CI/CD Pipeline Deployment

### GitHub Actions
- [ ] Verify all GitHub Actions workflows are configured
- [ ] Secrets added to GitHub repository settings:
  - [ ] ANTHROPIC_API_KEY
  - [ ] AWS_ACCESS_KEY_ID
  - [ ] AWS_SECRET_ACCESS_KEY
  - [ ] DOCKER_REGISTRY_URL
  - [ ] DOCKER_REGISTRY_USERNAME
  - [ ] DOCKER_REGISTRY_PASSWORD
  - [ ] KUBE_CONFIG (base64 encoded)

### Automated Deployment
```yaml
# Pipeline stages:
1. Lint: TypeScript, ESLint, Prettier
2. Test: Unit, integration, coverage
3. Build: Docker images, optimize bundles
4. Security: Trivy image scan, dependency check
5. Push: ECR/Docker Hub
6. Deploy: Kubernetes rollout
7. Smoke Tests: Verify production endpoints
```

---

## Monitoring & Observability

### Prometheus Setup
```bash
# Deploy Prometheus
kubectl apply -f infrastructure/k8s/prometheus-deployment.yaml

# Key metrics to monitor:
- api_request_duration_seconds
- api_requests_total
- database_connection_pool_size
- redis_connected_clients
- neo4j_query_duration_seconds
- memory_usage_bytes
- cpu_usage_percent
```

### Grafana Dashboards
- [ ] API performance dashboard
- [ ] Database health dashboard
- [ ] Neo4j performance dashboard
- [ ] Business metrics dashboard
- [ ] Error rate tracking

### Alerting Rules
```yaml
- High error rate (>1%)
- Slow API response (>500ms)
- Database connection pool exhaustion
- Memory usage >80%
- Disk space >85%
- Neo4j query timeouts
```

### Logging (ELK Stack / CloudWatch)
```bash
# Log aggregation
kubectl apply -f infrastructure/k8s/filebeat-daemonset.yaml
kubectl apply -f infrastructure/k8s/logstash-deployment.yaml
kubectl apply -f infrastructure/k8s/elasticsearch-statefulset.yaml

# Queries:
- Error logs
- Slow query logs
- Authentication failures
- Data sync errors
```

---

## Security Hardening

### HIPAA Compliance
- [ ] Encryption at rest enabled (KMS)
- [ ] Encryption in transit (TLS 1.2+)
- [ ] Access control configured (RBAC)
- [ ] Audit logging enabled
- [ ] Backup encryption configured
- [ ] VPC with security groups
- [ ] WAF rules applied
- [ ] Secrets rotation scheduled

### Data Protection
- [ ] Patient data encrypted with HSM
- [ ] Database encryption enabled
- [ ] Backup encryption configured
- [ ] Key rotation policy established
- [ ] PII masking in logs verified
- [ ] Data residency compliance confirmed

### Access Management
- [ ] MFA enabled for production accounts
- [ ] API key rotation policy
- [ ] IAM roles with least privilege
- [ ] VPN/Bastion host for database access
- [ ] Session timeout configured
- [ ] IP allowlisting for critical operations

---

## Production Deployment Steps

### Phase 1: Canary Deployment (10% traffic)
```bash
# Deploy API v0.1.0
kubectl set image deployment/healthos-api \
  api=healthos-api:v0.1.0 -n healthos

# Monitor for 30 minutes
# Check error rate, latency, dependencies
```

### Phase 2: Gradual Rollout (50% → 100%)
```bash
# Increase traffic gradually
kubectl patch deployment healthos-api -n healthos \
  -p '{"spec":{"progressDeadlineSeconds":600}}'

# Monitor key metrics
# - Error rate <0.5%
# - API latency p95 <200ms
- Database connection pool healthy
```

### Phase 3: Full Production (100%)
```bash
# Complete rollout
kubectl rollout status deployment/healthos-api -n healthos

# Verify all endpoints
npm run smoke-tests:production

# Monitor for 24 hours
```

---

## Rollback Procedure

### Quick Rollback (if needed)
```bash
# Previous version
kubectl rollout undo deployment/healthos-api -n healthos

# To specific version
kubectl rollout history deployment/healthos-api -n healthos
kubectl rollout undo deployment/healthos-api --to-revision=2 -n healthos

# Verify rollback
kubectl get pods -n healthos
kubectl logs -f deployment/healthos-api -n healthos
```

---

## Post-Deployment Verification

### 1. Endpoint Testing
```bash
# Health check
curl https://api.healthos.com/health

# Authentication
curl -X POST https://api.healthos.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Phase 2 Genomics
curl https://api.healthos.com/api/genomics/profiles/123

# Phase 3 Therapeutic Design
curl https://api.healthos.com/api/therapeutic-design/projects/456

# Phase 4 Enterprise
curl https://api.healthos.com/api/organizations/tenant_123
```

### 2. Data Integrity Checks
```sql
-- Verify data consistency
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM patients;
SELECT COUNT(*) FROM genomic_profiles;
SELECT COUNT(*) FROM variants;
SELECT COUNT(*) FROM therapeutic_projects;
SELECT COUNT(*) FROM tenants;
```

### 3. Performance Verification
```bash
# Response time check
curl -w "@curl-format.txt" -o /dev/null -s https://api.healthos.com/health

# Database query performance
EXPLAIN ANALYZE SELECT * FROM variants WHERE genomic_profile_id = 1;

# Neo4j traversal performance
EXPLAIN MATCH (d:Disease)-[r:associated_with]->(s:Symptom) RETURN COUNT(*);
```

### 4. Integration Tests
- [ ] EHR sync functional (Epic, Cerner)
- [ ] FHIR server responding
- [ ] Population health metrics calculated
- [ ] Federated learning aggregation working
- [ ] CDS hooks triggering
- [ ] Email notifications sending

---

## Maintenance Plan

### Daily
- [ ] Monitor error rates and alerts
- [ ] Check database backup completion
- [ ] Verify API health endpoints
- [ ] Review authentication failures

### Weekly
- [ ] Performance trend analysis
- [ ] Security patch assessment
- [ ] Database statistics update
- [ ] Neo4j index optimization

### Monthly
- [ ] Full security audit
- [ ] Dependency vulnerability scan
- [ ] Database VACUUM and ANALYZE
- [ ] Backup restoration test
- [ ] Disaster recovery drill

### Quarterly
- [ ] Major version upgrades
- [ ] Architecture review
- [ ] Cost optimization
- [ ] HIPAA compliance audit
- [ ] Penetration testing

---

## Disaster Recovery

### Backup Strategy
- Daily automated backups (PostgreSQL)
- Weekly full snapshots (EBS volumes)
- Continuous replication (RDS Multi-AZ)
- Neo4j backup with point-in-time recovery

### Recovery Procedures
- RTO: 1 hour (max acceptable)
- RPO: 15 minutes (max data loss)

### Testing
- [ ] Monthly restore tests from backups
- [ ] Failover drills
- [ ] Cross-region failover verified

---

## Scaling Considerations

### Horizontal Scaling
- Kubernetes HPA for API
- Read replicas for PostgreSQL
- Redis cluster mode
- Neo4j causal cluster

### Vertical Scaling
- API memory: 2GB → 4GB
- Database: t3.xlarge → r5.2xlarge
- Neo4j heap: 31GB → 62GB

### Database Optimization
- Partition by patient/tenant
- Selective indexing
- Query optimization
- Connection pooling tuning

---

## Support & Operations

### Escalation Path
1. On-call engineer (alerts)
2. Backend team lead
3. DevOps lead
4. CTO

### Documentation
- [ ] Runbooks for common issues
- [ ] Architecture diagrams updated
- [ ] API documentation current
- [ ] Training materials prepared

---

**Last Updated**: 2024-05-21
**HealthOS Version**: 0.1.0
**Deployment Target**: AWS EKS Production
