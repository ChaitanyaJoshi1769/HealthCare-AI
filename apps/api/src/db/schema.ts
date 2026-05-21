import { query } from './index.js';

export async function initializeSchema(): Promise<void> {
  // Enable pgvector extension
  await query('CREATE EXTENSION IF NOT EXISTS vector');

  // Users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(255) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255),
      first_name VARCHAR(255) NOT NULL,
      last_name VARCHAR(255) NOT NULL,
      avatar_url TEXT,
      role VARCHAR(50) NOT NULL DEFAULT 'patient',
      status VARCHAR(50) NOT NULL DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Patients table
  await query(`
    CREATE TABLE IF NOT EXISTS patients (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL UNIQUE,
      date_of_birth DATE NOT NULL,
      gender VARCHAR(50),
      ethnicity VARCHAR(255),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  // Family history
  await query(`
    CREATE TABLE IF NOT EXISTS family_history (
      id VARCHAR(255) PRIMARY KEY,
      patient_id VARCHAR(255) NOT NULL,
      relation VARCHAR(255),
      condition VARCHAR(255),
      age_of_onset INT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `);

  // Medical history
  await query(`
    CREATE TABLE IF NOT EXISTS medical_history (
      id VARCHAR(255) PRIMARY KEY,
      patient_id VARCHAR(255) NOT NULL,
      condition VARCHAR(255) NOT NULL,
      icd_code VARCHAR(255),
      onset_date DATE,
      resolved_date DATE,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `);

  // Medications
  await query(`
    CREATE TABLE IF NOT EXISTS medications (
      id VARCHAR(255) PRIMARY KEY,
      patient_id VARCHAR(255) NOT NULL,
      name VARCHAR(255) NOT NULL,
      rxnorm_code VARCHAR(255),
      dosage VARCHAR(255),
      frequency VARCHAR(255),
      start_date DATE NOT NULL,
      end_date DATE,
      indication TEXT,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `);

  // Health metrics (wearables data)
  await query(`
    CREATE TABLE IF NOT EXISTS health_metrics (
      id VARCHAR(255) PRIMARY KEY,
      patient_id VARCHAR(255) NOT NULL,
      metric_type VARCHAR(255) NOT NULL,
      value DECIMAL(10, 2) NOT NULL,
      unit VARCHAR(50) NOT NULL,
      source VARCHAR(255),
      recorded_at TIMESTAMP NOT NULL,
      confidence DECIMAL(3, 2),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_health_metrics_patient_type
    ON health_metrics(patient_id, metric_type, recorded_at DESC);
  `);

  // Wearable integrations
  await query(`
    CREATE TABLE IF NOT EXISTS wearable_integrations (
      id VARCHAR(255) PRIMARY KEY,
      patient_id VARCHAR(255) NOT NULL,
      provider VARCHAR(255) NOT NULL,
      access_token TEXT NOT NULL,
      refresh_token TEXT,
      last_sync_at TIMESTAMP,
      status VARCHAR(50) DEFAULT 'connected',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `);

  // Genomic profiles
  await query(`
    CREATE TABLE IF NOT EXISTS genomic_profiles (
      id VARCHAR(255) PRIMARY KEY,
      patient_id VARCHAR(255) NOT NULL,
      filename VARCHAR(255),
      file_type VARCHAR(50),
      uploaded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      processed_at TIMESTAMP,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `);

  // Genomic variants
  await query(`
    CREATE TABLE IF NOT EXISTS variants (
      id VARCHAR(255) PRIMARY KEY,
      genomic_profile_id VARCHAR(255) NOT NULL,
      chromosome VARCHAR(50),
      position BIGINT,
      ref VARCHAR(255),
      alt VARCHAR(255),
      clinvar_id VARCHAR(255),
      pathogenicity VARCHAR(50),
      allele_frequency DECIMAL(5, 4),
      consequence TEXT,
      affected_genes TEXT[],
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (genomic_profile_id) REFERENCES genomic_profiles(id) ON DELETE CASCADE
    )
  `);

  // AI Insights
  await query(`
    CREATE TABLE IF NOT EXISTS ai_insights (
      id VARCHAR(255) PRIMARY KEY,
      patient_id VARCHAR(255) NOT NULL,
      type VARCHAR(255) NOT NULL,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      risk_score DECIMAL(5, 2),
      confidence DECIMAL(3, 2),
      recommendation TEXT,
      evidence JSONB,
      action_items JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_ai_insights_patient_type
    ON ai_insights(patient_id, type, created_at DESC);
  `);

  // Risk scores
  await query(`
    CREATE TABLE IF NOT EXISTS risk_scores (
      id VARCHAR(255) PRIMARY KEY,
      patient_id VARCHAR(255) NOT NULL,
      model_name VARCHAR(255) NOT NULL,
      condition VARCHAR(255),
      score DECIMAL(5, 2),
      percentile DECIMAL(5, 2),
      risk_level VARCHAR(50),
      factors JSONB,
      calculated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      valid_until TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `);

  // AI Agent conversations
  await query(`
    CREATE TABLE IF NOT EXISTS agent_conversations (
      id VARCHAR(255) PRIMARY KEY,
      patient_id VARCHAR(255) NOT NULL,
      agent_type VARCHAR(255) NOT NULL,
      messages JSONB NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `);

  // Clinical trials
  await query(`
    CREATE TABLE IF NOT EXISTS clinical_trials (
      id VARCHAR(255) PRIMARY KEY,
      nct_id VARCHAR(255) UNIQUE,
      title VARCHAR(255) NOT NULL,
      status VARCHAR(50),
      condition VARCHAR(255),
      sponsor VARCHAR(255),
      location VARCHAR(255),
      phase VARCHAR(50),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Research articles
  await query(`
    CREATE TABLE IF NOT EXISTS research_articles (
      id VARCHAR(255) PRIMARY KEY,
      pmid VARCHAR(255) UNIQUE,
      title VARCHAR(255) NOT NULL,
      authors TEXT[],
      published_at TIMESTAMP,
      abstract TEXT,
      doi VARCHAR(255),
      embedding vector(1536),
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_articles_embedding
    ON research_articles USING ivfflat (embedding vector_cosine_ops);
  `);

  // Audit logs
  await query(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id VARCHAR(255) PRIMARY KEY,
      user_id VARCHAR(255),
      patient_id VARCHAR(255),
      action VARCHAR(255) NOT NULL,
      resource_type VARCHAR(255),
      resource_id VARCHAR(255),
      changes JSONB,
      ip_address VARCHAR(45),
      user_agent TEXT,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_audit_logs_patient
    ON audit_logs(patient_id, created_at DESC);
  `);

  // Consent records
  await query(`
    CREATE TABLE IF NOT EXISTS consent_records (
      id VARCHAR(255) PRIMARY KEY,
      patient_id VARCHAR(255) NOT NULL,
      type VARCHAR(255) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      consented_at TIMESTAMP,
      withdrawn_at TIMESTAMP,
      metadata JSONB,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
    )
  `);
}
