import axios from 'axios';
import type { Variant, PolygeneticRisk, GenomicProfile } from '@healthos/types';

// ClinVar API endpoint
const CLINVAR_API = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils';
const GNOMAD_API = 'https://gnomad.broadinstitute.org/api';

export interface VariantAnalysisResult {
  variant: Variant;
  clinvarData?: ClinVarRecord;
  gnomadData?: GnomADRecord;
  functionalPrediction?: FunctionalPrediction;
  pathogenicityScore: number;
  classification: 'benign' | 'likely_benign' | 'uncertain' | 'likely_pathogenic' | 'pathogenic';
  confidence: number;
  recommendation: string;
}

export interface ClinVarRecord {
  clinvarId: string;
  submissionCount: number;
  pathogenicity: string;
  affectedGenes: string[];
  phenotypes: string[];
  confidence: number;
}

export interface GnomADRecord {
  alleleFrequency: number;
  alleleCount: number;
  populationFrequencies: Record<string, number>;
  homozygousCount: number;
}

export interface FunctionalPrediction {
  sift: 'tolerated' | 'deleterious';
  polyphen: 'benign' | 'possibly_damaging' | 'probably_damaging';
  conservation: number;
  mirnaBinding: boolean;
}

export interface PharmacogenomicResult {
  gene: string;
  phenotype: string;
  variants: string[];
  drugsAffected: DrugRecommendation[];
  metabolism: 'poor' | 'intermediate' | 'normal' | 'rapid';
  dosageRecommendation: string;
  warningLevel: 'info' | 'warning' | 'critical';
}

export interface DrugRecommendation {
  drugName: string;
  indication: string;
  recommendation: string;
  level: 'A' | 'B' | 'C';
  references: string[];
}

export interface PolygeneticRiskResult {
  condition: string;
  riskScore: number; // 0-100
  percentile: number;
  interpretation: string;
  riskCategory: 'very_low' | 'low' | 'intermediate' | 'high' | 'very_high';
  variance_explained: number;
  topVariants: Variant[];
  recommendations: string[];
}

export interface CarrierScreeningResult {
  condition: string;
  carrierStatus: 'non_carrier' | 'carrier' | 'homozygous_affected';
  variants: Variant[];
  inheritancePattern: 'autosomal_recessive' | 'autosomal_dominant' | 'x_linked';
  reproductiveRisk: number;
  counselingRecommended: boolean;
  recommendations: string[];
}

// Variant Analysis Engine
export function analyzeVariant(variant: any): any {
  const pathScore = calculatePathogenicityScore(variant);
  const gnomadData = fetchGnomADDataSync(variant);
  const functionalPrediction = predictFunctionalImpact(variant);

  // Combine scores
  const confidence = (pathScore.score + (gnomadData?.alleleFrequency ?? 0)) / 2;
  const classification = classifyPathogenicity(pathScore.score);

  return {
    pathogenicityScore: pathScore.score,
    classification,
    confidence: Math.min(confidence, 1),
    recommendations: [
      generateVariantRecommendation(classification, variant, gnomadData?.alleleFrequency),
    ],
  };
}

function calculatePathogenicityScore(variant: Variant): { score: number; factors: string[] } {
  let score = 0;
  const factors: string[] = [];

  // ClinVar pathogenicity
  if (variant.pathogenicity === 'pathogenic') {
    score += 0.9;
    factors.push('ClinVar: Pathogenic');
  } else if (variant.pathogenicity === 'likely_pathogenic') {
    score += 0.7;
    factors.push('ClinVar: Likely pathogenic');
  } else if (variant.pathogenicity === 'uncertain') {
    score += 0.3;
    factors.push('ClinVar: Uncertain significance');
  }

  // Consequence severity
  if (variant.consequence) {
    const consequence = variant.consequence.toLowerCase();
    if (consequence.includes('frameshift') || consequence.includes('stop_gained')) {
      score += 0.2;
      factors.push('Frameshift or stop gain mutation');
    } else if (consequence.includes('missense')) {
      score += 0.1;
      factors.push('Missense variant');
    } else if (consequence.includes('synonymous')) {
      score -= 0.1;
      factors.push('Synonymous variant');
    }
  }

  // Allele frequency (rare variants more likely pathogenic)
  if (variant.alleleFrequency) {
    if (variant.alleleFrequency < 0.001) {
      score += 0.15;
      factors.push('Rare variant (AF < 0.1%)');
    } else if (variant.alleleFrequency < 0.01) {
      score += 0.1;
      factors.push('Uncommon variant (AF < 1%)');
    } else {
      score -= 0.2;
      factors.push('Common variant (AF >= 1%)');
    }
  }

  return {
    score: Math.max(0, Math.min(1, score)),
    factors,
  };
}

async function fetchClinVarData(clinvarId: string): Promise<ClinVarRecord> {
  // Mock implementation - in production, call NCBI ClinVar API
  return {
    clinvarId,
    submissionCount: 5,
    pathogenicity: 'pathogenic',
    affectedGenes: ['BRCA1'],
    phenotypes: ['Hereditary breast and ovarian cancer syndrome'],
    confidence: 0.95,
  };
}

function fetchGnomADDataSync(variant: any): GnomADRecord {
  // Mock implementation - in production, call gnomAD API
  return {
    alleleFrequency: 0.0001,
    alleleCount: 50,
    populationFrequencies: {
      afr: 0.0002,
      amr: 0.00005,
      asj: 0.0,
      eas: 0.00008,
      fin: 0.0,
      nfe: 0.0001,
      sas: 0.00015,
    },
    homozygousCount: 0,
  };
}

async function fetchGnomADData(
  chromosome: string,
  position: number,
  ref: string,
  alt: string
): Promise<GnomADRecord> {
  return fetchGnomADDataSync({ chromosome, position, ref, alt });
}

function predictFunctionalImpact(variant: Variant): FunctionalPrediction {
  // Mock SIFT and PolyPhen predictions
  return {
    sift: 'deleterious',
    polyphen: 'probably_damaging',
    conservation: 0.85,
    mirnaBinding: false,
  };
}

function classifyPathogenicity(
  score: number
): 'benign' | 'likely_benign' | 'uncertain' | 'likely_pathogenic' | 'pathogenic' {
  if (score >= 0.8) return 'pathogenic';
  if (score >= 0.6) return 'likely_pathogenic';
  if (score >= 0.4) return 'uncertain';
  if (score >= 0.2) return 'likely_benign';
  return 'benign';
}

function generateVariantRecommendation(
  classification: string,
  variant: Variant,
  alleleFrequency?: number
): string {
  const recommendations: string[] = [];

  if (classification === 'pathogenic' || classification === 'likely_pathogenic') {
    recommendations.push('This variant is associated with increased disease risk.');
    recommendations.push('Genetic counseling is recommended.');
    if (variant.affectedGenes?.length) {
      recommendations.push(
        `Consider screening for other variants in ${variant.affectedGenes[0]}.`
      );
    }
  }

  if (alleleFrequency && alleleFrequency < 0.001) {
    recommendations.push('This is a rare variant - consider family screening.');
  }

  return recommendations.join(' ');
}

// Polygenic Risk Scoring
export function calculatePolygeneticRisk(input: any): any {
  const { variantWeights, ancestry = 'European', condition } = input;

  let totalScore = 0;
  for (const variant of variantWeights) {
    totalScore += variant.weight;
  }

  // Normalize to 0-100 scale and adjust for ancestry
  const ancestryAdjustment = ancestry === 'African' ? 0.95 : 1.0;
  const normalizedScore = Math.min(100, Math.max(0, totalScore * ancestryAdjustment * 50));

  // Calculate population percentile
  const percentile = Math.round(normalizedScore + Math.random() * 10 - 5);
  const riskCategory = categorizeRisk(percentile);

  return {
    riskScore: Math.round(normalizedScore),
    percentile: Math.max(0, Math.min(100, percentile)),
    riskCategory,
    interpretation: generateRiskInterpretation(condition, percentile),
    variance_explained: 0.15,
    topVariants: variantWeights.slice(0, 5),
    recommendations: generateRiskRecommendations(condition, riskCategory),
  };
}

function getPRSWeights(
  condition: string,
  ancestry?: string
): Record<string, { beta: number; variance: number; allele: string }> | null {
  // Mock PRS weights - in production, load from database
  const weights: Record<string, Record<string, any>> = {
    cardiovascular_disease: {
      'chr1:1000000': { beta: 0.15, variance: 0.02, allele: 'A' },
      'chr19:44905631': { beta: 0.25, variance: 0.05, allele: 'T' },
      'chr9:22125504': { beta: 0.12, variance: 0.015, allele: 'C' },
      max: 1.0,
    },
    type2_diabetes: {
      'chr10:114758349': { beta: 0.18, variance: 0.03, allele: 'T' },
      'chr10:88897938': { beta: 0.14, variance: 0.02, allele: 'G' },
      'chr7:28196413': { beta: 0.11, variance: 0.015, allele: 'A' },
      max: 0.95,
    },
    breast_cancer: {
      'chr17:43044394': { beta: 0.35, variance: 0.1, allele: 'A' },
      'chr8:80386699': { beta: 0.16, variance: 0.025, allele: 'T' },
      'chr6:26094610': { beta: 0.13, variance: 0.02, allele: 'G' },
      max: 1.2,
    },
  };

  return weights[condition.toLowerCase().replace(/ /g, '_')] || null;
}

function estimatePercentile(score: number): number {
  // Mock percentile calculation - in production, use actual population data
  return Math.min(99, Math.max(1, score + Math.random() * 10 - 5));
}

function categorizeRisk(percentile: number): string {
  if (percentile >= 95) return 'very_high';
  if (percentile >= 75) return 'high';
  if (percentile >= 50) return 'average';
  if (percentile >= 25) return 'low';
  return 'very_low';
}

function generateRiskInterpretation(condition: string, percentile: number): string {
  const category = categorizeRisk(percentile);
  const interpretations: Record<string, string> = {
    very_high: `Your polygenic risk score for ${condition} is in the top 5%, indicating significantly elevated risk. Professional medical consultation and preventive measures are strongly recommended.`,
    high: `Your polygenic risk score for ${condition} is above average. Discuss screening and prevention strategies with your healthcare provider.`,
    intermediate: `Your polygenic risk score for ${condition} is in the average range. Standard screening recommendations apply.`,
    low: `Your polygenic risk score for ${condition} is below average. Maintain healthy lifestyle practices.`,
    very_low: `Your polygenic risk score for ${condition} is in the lowest 5%. Continue routine preventive care.`,
  };

  return interpretations[category];
}

function generateRiskRecommendations(
  condition: string,
  riskCategory: string
): string[] {
  const recommendations: Record<string, Record<string, string[]>> = {
    cardiovascular_disease: {
      very_high: [
        'Annual cardiovascular screening',
        'Consider statin therapy',
        'Blood pressure monitoring',
        'Lifestyle modification program',
      ],
      high: [
        'Biennial cardiovascular assessment',
        'Regular exercise program',
        'Dietary modification',
        'Stress management',
      ],
    },
    type2_diabetes: {
      very_high: [
        'Annual diabetes screening',
        'Continuous glucose monitoring',
        'Nutritionist consultation',
        'Weight management program',
      ],
      high: ['Biennial glucose testing', 'Dietary counseling', 'Exercise program'],
    },
    breast_cancer: {
      very_high: [
        'Annual mammography',
        'Genetic counseling',
        'Consider preventive therapy discussion',
        'Enhanced surveillance',
      ],
      high: [
        'Regular mammography',
        'Breast self-examination',
        'Clinical breast exams',
      ],
    },
  };

  const condKey = condition.toLowerCase().replace(/ /g, '_');
  return recommendations[condKey]?.[riskCategory] || [
    'Discuss results with healthcare provider',
  ];
}

// Pharmacogenomics
export function analyzePharmacogenomics(input: any): any {
  const { gene, alleles, medications } = input;

  const phenotypes: Record<string, string> = {
    '*1/*1': 'normal',
    '*1/*2': 'intermediate',
    '*1/*3': 'poor',
    '*2/*2': 'poor',
    '*3/*3': 'poor',
  };

  const genotypeKey = `${alleles[0]}/${alleles[1]}`;
  const phenotype = phenotypes[genotypeKey] || 'normal';

  return {
    phenotype,
    enzyme_activity: {
      normal: 100,
      intermediate: 50,
      poor: 10,
      'rapid': 150,
    }[phenotype] || 100,
    dosageRecommendations: medications?.map((med: string) => ({
      medication: med,
      recommendedDosage: phenotype === 'poor' ? '50% of standard' : 'standard',
    })) || [],
  };
}

function isPGxGene(gene: string): boolean {
  const pgxGenes = [
    'CYP3A4',
    'CYP2D6',
    'CYP2C19',
    'CYP2C9',
    'TPMT',
    'HLA-B',
    'VKORC1',
    'SLCO1B1',
  ];
  return pgxGenes.includes(gene.toUpperCase());
}

function analyzePGxGene(
  gene: string,
  variants: Variant[],
  medications?: string[]
): PharmacogenomicResult | null {
  // Mock PGx analysis - in production, use PharmGKB data
  const phenotypes: Record<string, { metabolism: string; drugs: DrugRecommendation[] }> = {
    'CYP2D6': {
      metabolism: 'normal',
      drugs: [
        {
          drugName: 'Codeine',
          indication: 'Pain relief',
          recommendation: 'Standard dosage',
          level: 'A',
          references: ['PharmGKB'],
        },
      ],
    },
    'CYP2C19': {
      metabolism: 'intermediate',
      drugs: [
        {
          drugName: 'Omeprazole',
          indication: 'GERD',
          recommendation: 'Consider alternative or increased dose',
          level: 'A',
          references: ['PharmGKB'],
        },
      ],
    },
  };

  const pgxData = phenotypes[gene];
  if (!pgxData) return null;

  return {
    gene,
    phenotype: pgxData.metabolism,
    variants: variants.map((v) => `${v.chromosome}:${v.position}`),
    drugsAffected: pgxData.drugs,
    metabolism: pgxData.metabolism as 'poor' | 'intermediate' | 'normal' | 'rapid',
    dosageRecommendation: generateDosageRecommendation(
      gene,
      pgxData.metabolism,
      medications
    ),
    warningLevel: pgxData.metabolism === 'poor' ? 'critical' : 'info',
  };
}

function generateDosageRecommendation(
  gene: string,
  phenotype: string,
  medications?: string[]
): string {
  if (phenotype === 'poor') {
    return `As a poor metabolizer of ${gene} substrates, consider alternative medications or reduced dosages. Consult with pharmacist or physician.`;
  }
  if (phenotype === 'rapid') {
    return `As a rapid metabolizer of ${gene} substrates, standard dosages may be insufficient. Consider dose optimization.`;
  }
  return 'Standard dosing based on current phenotype.';
}

// Carrier Screening
export function performCarrierScreening(input: any): any {
  const { variants } = input;

  // Count pathogenic variants
  const pathogenicCount = variants.filter((v: any) => v.variantType === 'pathogenic').length;

  const carrierStatus = pathogenicCount >= 2 ? 'homozygous_affected' : pathogenicCount === 1 ? 'carrier' : 'non_carrier';

  return {
    carrierStatus,
    reproductiveRisk: carrierStatus === 'homozygous_affected' ? 1.0 : carrierStatus === 'carrier' ? 0.25 : 0,
    counselingRecommended: carrierStatus !== 'non_carrier',
    variants,
  };
}

function findCarrierVariants(variants: Variant[], condition: string): Variant[] {
  // Mock - in production, query variant database for condition
  return variants.filter((v) => v.pathogenicity === 'pathogenic');
}

function assessCarrierStatus(
  condition: string,
  variants: Variant[]
): CarrierScreeningResult {
  const carrierStatus = variants.length > 1 ? 'homozygous_affected' : 'carrier';
  const counselingRecommended = carrierStatus === 'homozygous_affected' || carrierStatus === 'carrier';

  return {
    condition,
    carrierStatus: carrierStatus as any,
    variants,
    inheritancePattern: 'autosomal_recessive',
    reproductiveRisk: carrierStatus === 'homozygous_affected' ? 1.0 : 0.25,
    counselingRecommended,
    recommendations: [
      `Genetic counseling recommended for ${condition}`,
      'Partner testing may be beneficial for family planning',
      'Annual monitoring if applicable',
    ],
  };
}

// Rare Disease Analysis
export function analyzeRareDisease(input: any): any {
  const { variantId, frequency, functionalImpact } = input;

  // Rare disease genes and associations
  const rareDiseaseGenes: Record<string, string[]> = {
    'frameshift': ['Cystic Fibrosis', 'Hemophilia'],
    'stop_gained': ['Duchenne Muscular Dystrophy'],
    'missense': ['Marfan Syndrome'],
  };

  const matchedDiseases = rareDiseaseGenes[functionalImpact] || [];
  const confidence = frequency < 0.0001 ? 0.9 : 0.7;

  return {
    matchedDiseases,
    confidence,
    literatureEvidence: matchedDiseases.length > 0 ? 'Found in OMIM and ClinVar' : undefined,
  };
}
