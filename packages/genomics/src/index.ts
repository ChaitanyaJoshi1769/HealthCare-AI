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
export async function analyzeVariant(variant: Variant): Promise<VariantAnalysisResult> {
  const pathScore = calculatePathogenicityScore(variant);

  let clinvarData: ClinVarRecord | undefined;
  let gnomadData: GnomADRecord | undefined;
  let functionalPrediction: FunctionalPrediction | undefined;

  try {
    // Fetch ClinVar data
    if (variant.clinvarId) {
      clinvarData = await fetchClinVarData(variant.clinvarId);
    }

    // Fetch gnomAD frequency data
    gnomadData = await fetchGnomADData(
      variant.chromosome,
      variant.position,
      variant.ref,
      variant.alt
    );

    // Calculate functional predictions
    functionalPrediction = predictFunctionalImpact(variant);
  } catch (error) {
    console.error('Error fetching variant data:', error);
  }

  // Combine scores
  const confidence = (pathScore.score + (gnomadData?.alleleFrequency ?? 0)) / 2;
  const classification = classifyPathogenicity(pathScore.score);

  return {
    variant,
    clinvarData,
    gnomadData,
    functionalPrediction,
    pathogenicityScore: pathScore.score,
    classification,
    confidence: Math.min(confidence, 1),
    recommendation: generateVariantRecommendation(
      classification,
      variant,
      gnomadData?.alleleFrequency
    ),
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

async function fetchGnomADData(
  chromosome: string,
  position: number,
  ref: string,
  alt: string
): Promise<GnomADRecord> {
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
export async function calculatePolygeneticRisk(
  variants: Variant[],
  condition: string,
  ancestry?: string
): Promise<PolygeneticRiskResult> {
  // Load PRS weights (in production, from database or external API)
  const weights = getPRSWeights(condition, ancestry);

  if (!weights) {
    throw new Error(`No PRS weights available for ${condition}`);
  }

  let totalScore = 0;
  const topVariants: Variant[] = [];
  let varianceExplained = 0;

  for (const variant of variants) {
    const weight = weights[`${variant.chromosome}:${variant.position}`];
    if (weight) {
      totalScore += weight.beta;
      varianceExplained += weight.variance;
      topVariants.push(variant);
    }
  }

  // Normalize to 0-100 scale
  const normalizedScore = Math.min(100, Math.max(0, (totalScore / weights.max) * 100));

  // Calculate population percentile (mock)
  const percentile = estimatePercentile(normalizedScore);
  const riskCategory = categorizeRisk(percentile);

  return {
    condition,
    riskScore: Math.round(normalizedScore),
    percentile: Math.round(percentile),
    interpretation: generateRiskInterpretation(condition, percentile),
    riskCategory,
    variance_explained: Math.round(varianceExplained * 100) / 100,
    topVariants: topVariants.slice(0, 5),
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

function categorizeRisk(percentile: number): 'very_low' | 'low' | 'intermediate' | 'high' | 'very_high' {
  if (percentile >= 95) return 'very_high';
  if (percentile >= 75) return 'high';
  if (percentile >= 50) return 'intermediate';
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
  const recommendations: Record<string, string[]> = {
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
  return recommendations[condKey]?.[riskCategory as keyof typeof recommendations[string]] || [
    'Discuss results with healthcare provider',
  ];
}

// Pharmacogenomics
export async function analyzePharmacogenomics(
  variants: Variant[],
  medications?: string[]
): Promise<PharmacogenomicResult[]> {
  const results: PharmacogenomicResult[] = [];
  const pgxGenes = new Set<string>();

  // Map variants to PGx genes
  for (const variant of variants) {
    if (variant.affectedGenes) {
      for (const gene of variant.affectedGenes) {
        if (isPGxGene(gene)) {
          pgxGenes.add(gene);
        }
      }
    }
  }

  // Analyze each PGx gene
  for (const gene of pgxGenes) {
    const geneVariants = variants.filter(
      (v) => v.affectedGenes && v.affectedGenes.includes(gene)
    );

    const result = analyzePGxGene(gene, geneVariants, medications);
    if (result) results.push(result);
  }

  return results;
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
export async function performCarrierScreening(
  variants: Variant[],
  conditions?: string[]
): Promise<CarrierScreeningResult[]> {
  const results: CarrierScreeningResult[] = [];

  // Define carrier screening conditions
  const carrierConditions = [
    'Cystic Fibrosis',
    'Sickle Cell Disease',
    'Thalassemia',
    'Fragile X Syndrome',
    'Spinal Muscular Atrophy',
  ];

  for (const condition of conditions || carrierConditions) {
    const conditionVariants = findCarrierVariants(variants, condition);
    if (conditionVariants.length > 0) {
      const result = assessCarrierStatus(condition, conditionVariants);
      results.push(result);
    }
  }

  return results;
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

  return {
    condition,
    carrierStatus: carrierStatus as 'non_carrier' | 'carrier' | 'homozygous_affected',
    variants,
    inheritancePattern: 'autosomal_recessive',
    reproductiveRisk: carrierStatus === 'homozygous_affected' ? 1.0 : 0.25,
    counselingRecommended: carrierStatus !== 'non_carrier',
    recommendations: [
      `Genetic counseling recommended for ${condition}`,
      'Partner testing may be beneficial for family planning',
      'Annual monitoring if applicable',
    ],
  };
}

// Rare Disease Analysis
export async function analyzeRareDisease(
  variants: Variant[],
  symptoms?: string[]
): Promise<{ disease: string; confidence: number; variants: Variant[] }[]> {
  const results: { disease: string; confidence: number; variants: Variant[] }[] = [];

  // Rare disease genes and associations
  const rareDiseaseGenes: Record<string, string[]> = {
    'CFTR': ['Cystic Fibrosis'],
    'HTT': ['Huntington Disease'],
    'FMRP': ['Fragile X Syndrome'],
    'SMN1': ['Spinal Muscular Atrophy'],
    'HEXA': ['Tay-Sachs Disease'],
  };

  for (const variant of variants) {
    if (variant.affectedGenes) {
      for (const gene of variant.affectedGenes) {
        const diseases = rareDiseaseGenes[gene];
        if (diseases && variant.pathogenicity === 'pathogenic') {
          for (const disease of diseases) {
            results.push({
              disease,
              confidence: 0.85,
              variants: [variant],
            });
          }
        }
      }
    }
  }

  return results;
}
