-- Phase 2: Genomics & Intelligence Tables

-- Genomic Profiles
CREATE TABLE IF NOT EXISTS genomic_profiles (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  profile_name VARCHAR(255) NOT NULL,
  file_hash VARCHAR(255) UNIQUE,
  file_size BIGINT,
  source VARCHAR(100), -- 'exome', 'genome', 'panel', 'wgs'
  sequencing_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id)
);

CREATE INDEX IF NOT EXISTS idx_genomic_profiles_patient_id ON genomic_profiles(patient_id);

-- Variants
CREATE TABLE IF NOT EXISTS variants (
  id SERIAL PRIMARY KEY,
  genomic_profile_id INTEGER NOT NULL REFERENCES genomic_profiles(id) ON DELETE CASCADE,
  chromosome VARCHAR(2),
  position BIGINT,
  reference_allele VARCHAR(1000),
  alternate_allele VARCHAR(1000),
  variant_type VARCHAR(50), -- 'SNP', 'INDEL', 'SV'
  rsid VARCHAR(100),
  clinvar_significance VARCHAR(255),
  pathogenicity_score DECIMAL(3,2),
  functional_impact VARCHAR(100),
  maf_gnomad DECIMAL(5,4),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_variants_profile_id ON variants(genomic_profile_id);
CREATE INDEX IF NOT EXISTS idx_variants_chromosome_position ON variants(chromosome, position);

-- Polygenic Risk Scores
CREATE TABLE IF NOT EXISTS polygenic_risk_scores (
  id SERIAL PRIMARY KEY,
  genomic_profile_id INTEGER NOT NULL REFERENCES genomic_profiles(id) ON DELETE CASCADE,
  condition_name VARCHAR(255),
  ancestry VARCHAR(100),
  risk_score DECIMAL(5,4),
  risk_percentile INTEGER,
  risk_category VARCHAR(50), -- 'very_low', 'low', 'average', 'high', 'very_high'
  relative_risk DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_prs_profile_id ON polygenic_risk_scores(genomic_profile_id);
CREATE INDEX IF NOT EXISTS idx_prs_condition ON polygenic_risk_scores(condition_name);

-- Pharmacogenomics
CREATE TABLE IF NOT EXISTS pharmacogenomics (
  id SERIAL PRIMARY KEY,
  genomic_profile_id INTEGER NOT NULL REFERENCES genomic_profiles(id) ON DELETE CASCADE,
  gene VARCHAR(100),
  phenotype VARCHAR(100), -- 'ultra-rapid', 'rapid', 'normal', 'intermediate', 'poor'
  enzyme_activity DECIMAL(3,2),
  medication_name VARCHAR(255),
  recommended_dosage VARCHAR(255),
  monitoring_needed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pgx_profile_id ON pharmacogenomics(genomic_profile_id);
CREATE INDEX IF NOT EXISTS idx_pgx_gene ON pharmacogenomics(gene);

-- Carrier Screening
CREATE TABLE IF NOT EXISTS carrier_screening (
  id SERIAL PRIMARY KEY,
  genomic_profile_id INTEGER NOT NULL REFERENCES genomic_profiles(id) ON DELETE CASCADE,
  disease_name VARCHAR(255),
  gene_involved VARCHAR(100),
  inheritance_pattern VARCHAR(100),
  carrier_status VARCHAR(100), -- 'non_carrier', 'heterozygous', 'homozygous'
  reproductive_risk DECIMAL(3,2),
  counseling_recommended BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_carrier_profile_id ON carrier_screening(genomic_profile_id);
