// User & Authentication
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'patient' | 'clinician' | 'researcher' | 'admin';

export interface AuthSession {
  userId: string;
  token: string;
  expiresAt: Date;
  refreshToken?: string;
}

// Patient Data
export interface Patient {
  id: string;
  userId: string;
  dateOfBirth: Date;
  gender: 'male' | 'female' | 'other';
  ethnicity?: string;
  familyHistory?: FamilyHistory[];
  medicalHistory?: MedicalHistory[];
  medications?: Medication[];
  allergies?: Allergy[];
  lifestyle?: LifestyleData;
  createdAt: Date;
  updatedAt: Date;
}

export interface FamilyHistory {
  id: string;
  relation: string;
  condition: string;
  ageOfOnset?: number;
}

export interface MedicalHistory {
  id: string;
  condition: string;
  icdCode: string;
  onsetDate: Date;
  resolvedDate?: Date;
  status: 'active' | 'resolved' | 'unknown';
}

export interface Medication {
  id: string;
  name: string;
  rxnormCode?: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  indication?: string;
  status: 'active' | 'inactive';
}

export interface Allergy {
  id: string;
  substance: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  onsetDate: Date;
}

// Wearables & Health Data
export interface HealthMetric {
  id: string;
  patientId: string;
  type: HealthMetricType;
  value: number;
  unit: string;
  source: string; // 'apple_health', 'fitbit', 'oura', etc.
  recordedAt: Date;
  confidence?: number;
}

export type HealthMetricType =
  | 'heart_rate'
  | 'blood_pressure'
  | 'blood_glucose'
  | 'weight'
  | 'sleep_duration'
  | 'steps'
  | 'calories'
  | 'hrv'
  | 'temperature'
  | 'respiratory_rate';

export interface WearableIntegration {
  id: string;
  patientId: string;
  provider: 'apple_health' | 'fitbit' | 'garmin' | 'oura' | 'whoop' | 'dexcom';
  accessToken: string;
  refreshToken?: string;
  lastSyncAt?: Date;
  status: 'connected' | 'disconnected' | 'error';
}

export interface LifestyleData {
  sleepQuality?: 'poor' | 'fair' | 'good' | 'excellent';
  exerciseFrequency?: 'sedentary' | 'light' | 'moderate' | 'vigorous';
  dietType?: string;
  stressLevel?: number; // 1-10
  alcohol?: 'none' | 'moderate' | 'heavy';
  smoking?: boolean;
  lastUpdated?: Date;
}

// Genomics
export interface GenomicProfile {
  id: string;
  patientId: string;
  filename: string;
  fileType: 'vcf' | 'fastq' | 'bam' | '23andme' | 'ancestry';
  uploadedAt: Date;
  processedAt?: Date;
  status: 'pending' | 'processing' | 'completed' | 'error';
  variants?: Variant[];
  polygeneticRisks?: PolygeneticRisk[];
}

export interface Variant {
  id: string;
  genomicProfileId: string;
  chromosome: string;
  position: number;
  ref: string;
  alt: string;
  clinvarId?: string;
  pathogenicity: 'benign' | 'likely_benign' | 'uncertain' | 'likely_pathogenic' | 'pathogenic';
  alleleFrequency?: number;
  consequence?: string;
  affectedGenes?: string[];
}

export interface PolygeneticRisk {
  id: string;
  genomicProfileId: string;
  condition: string;
  riskScore: number;
  percentile: number;
  interpretation: string;
}

// AI Insights & Risk Scores
export interface AIInsight {
  id: string;
  patientId: string;
  type: InsightType;
  title: string;
  description: string;
  riskScore?: number;
  confidence: number;
  evidence: Evidence[];
  recommendation?: string;
  actionItems?: ActionItem[];
  createdAt: Date;
  expiresAt?: Date;
}

export type InsightType =
  | 'disease_risk'
  | 'preventive_care'
  | 'medication_interaction'
  | 'lifestyle_recommendation'
  | 'genomic_finding'
  | 'clinical_research_match';

export interface Evidence {
  source: 'wearable' | 'lab' | 'medical_history' | 'genomic' | 'research' | 'guideline';
  description: string;
  strength: 'weak' | 'moderate' | 'strong';
  citation?: string;
}

export interface ActionItem {
  id: string;
  action: string;
  category: 'appointment' | 'lab_test' | 'lifestyle' | 'medication' | 'monitoring';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  completed?: boolean;
}

// AI Agents
export interface AgentMessage {
  id: string;
  agentType: AgentType;
  role: 'user' | 'assistant';
  content: string;
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
  timestamp: Date;
}

export type AgentType =
  | 'diagnostic'
  | 'genomics'
  | 'longevity'
  | 'wearables'
  | 'research'
  | 'preventive'
  | 'medication';

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  content: string;
  isError: boolean;
}

// Clinical Knowledge Graph
export interface GraphNode {
  id: string;
  type: 'disease' | 'biomarker' | 'gene' | 'treatment' | 'symptom' | 'lifestyle' | 'study' | 'variant';
  name: string;
  snomedCode?: string;
  icdCode?: string;
  metadata?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'associated_with' | 'caused_by' | 'treated_by' | 'researched_in' | 'contraindicated';
  weight: number;
  evidence?: string;
}

// Clinical Trial & Research
export interface ClinicalTrial {
  id: string;
  nctId: string;
  title: string;
  status: 'recruiting' | 'active' | 'completed' | 'terminated';
  condition: string;
  sponsor: string;
  location?: string;
  phase?: string;
  matchScore?: number;
}

export interface ResearchArticle {
  id: string;
  pmid: string;
  title: string;
  authors: string[];
  publishedAt: Date;
  abstract: string;
  doi?: string;
  relevanceScore?: number;
}

// Risk Prediction Models
export interface RiskScore {
  id: string;
  patientId: string;
  modelName: string;
  condition: string;
  score: number; // 0-100
  percentile: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'very_high';
  calculatedAt: Date;
  validUntil?: Date;
  factors?: RiskFactor[];
}

export interface RiskFactor {
  name: string;
  value: string | number;
  weight: number;
  direction: 'increases' | 'decreases';
}

// Digital Health Twin
export interface HealthTwin {
  id: string;
  patientId: string;
  model: 'baseline' | 'intervention' | 'projection';
  timeFrame: number; // days
  projections?: HealthProjection[];
  interventions?: TwinIntervention[];
  createdAt: Date;
}

export interface HealthProjection {
  date: Date;
  metricType: HealthMetricType;
  projectedValue: number;
  confidence: number;
  factors: string[];
}

export interface TwinIntervention {
  type: 'medication' | 'lifestyle' | 'procedure' | 'supplement';
  description: string;
  expectedImpact: string;
  timeToEffect?: number; // days
}

// Therapeutic Design (Future)
export interface TherapeuticDesignProject {
  id: string;
  type: 'mrna' | 'crispr' | 'protein' | 'delivery_vector';
  name: string;
  description: string;
  targetGene?: string;
  status: 'draft' | 'active' | 'review' | 'archived';
  collaborators: string[];
  createdAt: Date;
  updatedAt: Date;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNextPage: boolean;
}

// Audit & Compliance
export interface AuditLog {
  id: string;
  userId: string;
  patientId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface ConsentRecord {
  id: string;
  patientId: string;
  type: 'research' | 'data_sharing' | 'marketing' | 'telehealth';
  status: 'pending' | 'consented' | 'withdrawn';
  consentedAt?: Date;
  withdrawnAt?: Date;
  metadata?: Record<string, unknown>;
}
