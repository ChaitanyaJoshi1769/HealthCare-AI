-- Phase 4: Enterprise Tables

-- Tenants (Multi-tenancy)
CREATE TABLE IF NOT EXISTS tenants (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100), -- 'health_system', 'clinic', 'research_institution', 'pharmaceutical'
  status VARCHAR(50), -- 'active', 'inactive', 'suspended'
  features JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_tenant_id ON tenants(tenant_id);

-- Tenant Configurations
CREATE TABLE IF NOT EXISTS tenant_configurations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  config_key VARCHAR(255),
  config_value JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenant_configs_tenant_id ON tenant_configurations(tenant_id);

-- Organization Integrations
CREATE TABLE IF NOT EXISTS organization_integrations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  integration_type VARCHAR(100), -- 'epic', 'cerner', 'athenahealth', 'fhir', 'custom'
  endpoint VARCHAR(500),
  credentials_encrypted TEXT,
  enabled BOOLEAN DEFAULT TRUE,
  last_sync TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_org_integrations_tenant_id ON organization_integrations(tenant_id);

-- EHR Sync Logs
CREATE TABLE IF NOT EXISTS ehr_sync_logs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id INTEGER REFERENCES patients(id),
  integration_id INTEGER REFERENCES organization_integrations(id),
  sync_type VARCHAR(100), -- 'full', 'incremental', 'on-demand'
  status VARCHAR(50), -- 'success', 'partial', 'failed'
  records_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ehr_sync_tenant_id ON ehr_sync_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ehr_sync_patient_id ON ehr_sync_logs(patient_id);

-- FHIR Resources
CREATE TABLE IF NOT EXISTS fhir_resources (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  resource_type VARCHAR(100), -- 'Patient', 'Encounter', 'Condition', etc.
  resource_id VARCHAR(255),
  fhir_version VARCHAR(10), -- 'R4', 'STU3'
  resource_data JSON,
  external_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fhir_resources_tenant_id ON fhir_resources(tenant_id);
CREATE INDEX IF NOT EXISTS idx_fhir_resources_type_id ON fhir_resources(resource_type, resource_id);

-- Population Health Cohorts
CREATE TABLE IF NOT EXISTS population_cohorts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  cohort_name VARCHAR(255) NOT NULL,
  cohort_definition JSON,
  size INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cohorts_tenant_id ON population_cohorts(tenant_id);

-- Population Health Metrics
CREATE TABLE IF NOT EXISTS population_metrics (
  id SERIAL PRIMARY KEY,
  cohort_id INTEGER NOT NULL REFERENCES population_cohorts(id) ON DELETE CASCADE,
  metric_name VARCHAR(255),
  metric_value DECIMAL(10,4),
  metric_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_metrics_cohort_id ON population_metrics(cohort_id);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON population_metrics(metric_date);

-- Federated Learning Models
CREATE TABLE IF NOT EXISTS federated_learning_models (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  model_name VARCHAR(255) NOT NULL,
  model_version VARCHAR(50),
  training_strategy VARCHAR(100), -- 'horizontal', 'vertical', 'federated_transfer'
  aggregation_method VARCHAR(100), -- 'fedavg', 'weighted', 'secure_aggregation'
  participant_count INTEGER,
  privacy_epsilon DECIMAL(5,2),
  privacy_delta DECIMAL(10,6),
  model_accuracy DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fl_models_tenant_id ON federated_learning_models(tenant_id);

-- Federated Learning Rounds
CREATE TABLE IF NOT EXISTS federated_learning_rounds (
  id SERIAL PRIMARY KEY,
  model_id INTEGER NOT NULL REFERENCES federated_learning_models(id) ON DELETE CASCADE,
  round_number INTEGER,
  status VARCHAR(50), -- 'initializing', 'training', 'aggregating', 'completed'
  participant_count INTEGER,
  aggregated_weights BYTEA,
  metrics JSON,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fl_rounds_model_id ON federated_learning_rounds(model_id);

-- Clinical Decision Support Rules
CREATE TABLE IF NOT EXISTS cds_rules (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  rule_name VARCHAR(255),
  hook_type VARCHAR(100), -- 'patient-view', 'order-review', 'order-select', 'medication-prescribe'
  rule_logic JSON,
  severity_level VARCHAR(50), -- 'info', 'warning', 'critical'
  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cds_rules_tenant_id ON cds_rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cds_rules_hook ON cds_rules(hook_type);

-- Clinical Decision Support Decisions
CREATE TABLE IF NOT EXISTS cds_decisions (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id INTEGER REFERENCES patients(id),
  rule_id INTEGER REFERENCES cds_rules(id),
  decision_type VARCHAR(100),
  suggestion_json JSON,
  user_action VARCHAR(100), -- 'accepted', 'overridden', 'deferred'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cds_decisions_tenant_id ON cds_decisions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cds_decisions_patient_id ON cds_decisions(patient_id);
