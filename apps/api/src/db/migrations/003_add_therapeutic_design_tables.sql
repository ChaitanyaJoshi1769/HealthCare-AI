-- Phase 3: Therapeutic Design Tables

-- Therapeutic Projects
CREATE TABLE IF NOT EXISTS therapeutic_projects (
  id SERIAL PRIMARY KEY,
  patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  project_name VARCHAR(255) NOT NULL,
  therapeutic_type VARCHAR(100), -- 'mRNA', 'CRISPR', 'protein_engineering', 'delivery_vector'
  target_disease VARCHAR(255),
  status VARCHAR(50), -- 'design', 'optimization', 'validation', 'manufacturing', 'completed'
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completion_date TIMESTAMP,
  budget DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_therapeutic_projects_patient_id ON therapeutic_projects(patient_id);

-- mRNA Designs
CREATE TABLE IF NOT EXISTS mrna_designs (
  id SERIAL PRIMARY KEY,
  therapeutic_project_id INTEGER NOT NULL REFERENCES therapeutic_projects(id) ON DELETE CASCADE,
  protein_sequence TEXT,
  mrna_sequence TEXT,
  codon_optimization_score DECIMAL(3,2),
  gc_content DECIMAL(3,2),
  mfe_score DECIMAL(6,2),
  structure_stability VARCHAR(50),
  immunogenicity_score DECIMAL(3,2),
  modification_strategy VARCHAR(255),
  estimated_half_life DECIMAL(5,2), -- hours
  synthesis_protocol TEXT,
  qc_specifications JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mrna_designs_project_id ON mrna_designs(therapeutic_project_id);

-- CRISPR Designs
CREATE TABLE IF NOT EXISTS crispr_designs (
  id SERIAL PRIMARY KEY,
  therapeutic_project_id INTEGER NOT NULL REFERENCES therapeutic_projects(id) ON DELETE CASCADE,
  target_gene VARCHAR(100),
  target_sequence VARCHAR(500),
  cas_system VARCHAR(50), -- 'SpCas9', 'SaCas9', 'Cas12a'
  guide_rna_sequence VARCHAR(500),
  guide_rna_count INTEGER,
  specificity_score DECIMAL(3,2),
  off_target_count INTEGER,
  off_target_risk VARCHAR(50),
  delivery_vector VARCHAR(100),
  target_tissue VARCHAR(100),
  expected_efficiency DECIMAL(3,2),
  side_effect_risk DECIMAL(3,2),
  timeline_months INTEGER,
  estimated_cost DECIMAL(12,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crispr_designs_project_id ON crispr_designs(therapeutic_project_id);

-- Protein Engineering Projects
CREATE TABLE IF NOT EXISTS protein_engineering_projects (
  id SERIAL PRIMARY KEY,
  therapeutic_project_id INTEGER NOT NULL REFERENCES therapeutic_projects(id) ON DELETE CASCADE,
  protein_name VARCHAR(255),
  original_sequence TEXT,
  engineered_sequence TEXT,
  target_function VARCHAR(255),
  structure_plddt DECIMAL(3,2),
  structure_pae DECIMAL(5,2),
  thermal_stability_tm DECIMAL(5,1),
  solubility_score DECIMAL(3,2),
  aggregation_risk VARCHAR(50),
  suggested_mutations JSON,
  function_improvement_estimate DECIMAL(3,2),
  conservation_analysis JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_protein_engineering_project_id ON protein_engineering_projects(therapeutic_project_id);

-- Delivery Vector Engineering
CREATE TABLE IF NOT EXISTS delivery_vectors (
  id SERIAL PRIMARY KEY,
  therapeutic_project_id INTEGER NOT NULL REFERENCES therapeutic_projects(id) ON DELETE CASCADE,
  vector_type VARCHAR(100), -- 'AAV', 'lentiviral', 'lipid_nanoparticle', 'viral_like_particle'
  target_tissue VARCHAR(100),
  capsid_engineering VARCHAR(255),
  targeting_ligand VARCHAR(100),
  payload_capacity_bp BIGINT,
  transfection_efficiency DECIMAL(3,2),
  innate_immune_activation VARCHAR(50),
  adaptive_immune_risk VARCHAR(50),
  integration_risk DECIMAL(3,2),
  immunotoxicity_risk DECIMAL(3,2),
  repeat_administration_feasible BOOLEAN,
  gmp_compliant BOOLEAN DEFAULT FALSE,
  cost_per_dose DECIMAL(8,2),
  production_timeline_weeks INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_delivery_vectors_project_id ON delivery_vectors(therapeutic_project_id);
