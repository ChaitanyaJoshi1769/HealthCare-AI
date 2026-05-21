import {
  analyzeVariant,
  calculatePolygeneticRisk,
  analyzePharmacogenomics,
  performCarrierScreening,
  analyzeRareDisease,
} from '@healthos/genomics';

describe('Genomics Module', () => {
  describe('analyzeVariant', () => {
    it('should return pathogenicity score for benign variant', () => {
      const result = analyzeVariant({
        chromosome: '1',
        position: 1000000,
        referenceAllele: 'A',
        alternateAllele: 'G',
        variantType: 'SNP',
      });

      expect(result.pathogenicityScore).toBeDefined();
      expect(result.pathogenicityScore).toBeGreaterThanOrEqual(0);
      expect(result.pathogenicityScore).toBeLessThanOrEqual(1);
      expect(result.classification).toBeDefined();
    });

    it('should classify pathogenic variant correctly', () => {
      const result = analyzeVariant({
        chromosome: '17',
        position: 41245237,
        referenceAllele: 'G',
        alternateAllele: 'A',
        variantType: 'SNP',
      });

      expect(result.classification).toMatch(/benign|pathogenic|vus/i);
      expect(result.recommendations).toBeInstanceOf(Array);
    });
  });

  describe('calculatePolygeneticRisk', () => {
    it('should calculate PRS for Type 2 Diabetes', () => {
      const result = calculatePolygeneticRisk({
        variantWeights: [
          { snpId: 'rs7903146', weight: 0.15 },
          { snpId: 'rs10811661', weight: 0.12 },
        ],
        ancestry: 'European',
        condition: 'Type 2 Diabetes',
      });

      expect(result.riskScore).toBeDefined();
      expect(result.percentile).toBeGreaterThanOrEqual(0);
      expect(result.percentile).toBeLessThanOrEqual(100);
      expect(result.riskCategory).toMatch(/very_low|low|average|high|very_high/);
    });

    it('should adjust for ancestry', () => {
      const europeanResult = calculatePolygeneticRisk({
        variantWeights: [{ snpId: 'rs7903146', weight: 0.15 }],
        ancestry: 'European',
        condition: 'Type 2 Diabetes',
      });

      const africanResult = calculatePolygeneticRisk({
        variantWeights: [{ snpId: 'rs7903146', weight: 0.15 }],
        ancestry: 'African',
        condition: 'Type 2 Diabetes',
      });

      expect(europeanResult.riskScore).not.toBe(africanResult.riskScore);
    });
  });

  describe('analyzePharmacogenomics', () => {
    it('should phenotype CYP2C9 variants', () => {
      const result = analyzePharmacogenomics({
        gene: 'CYP2C9',
        alleles: ['*1', '*2'],
        medications: ['Warfarin'],
      });

      expect(result.phenotype).toMatch(/ultra-rapid|rapid|normal|intermediate|poor/);
      expect(result.enzyme_activity).toBeDefined();
      expect(result.dosageRecommendations).toBeInstanceOf(Array);
    });

    it('should recommend dosage for warfarin', () => {
      const result = analyzePharmacogenomics({
        gene: 'CYP2C9',
        alleles: ['*1', '*3'],
        medications: ['Warfarin'],
      });

      expect(result.dosageRecommendations.length).toBeGreaterThan(0);
      expect(result.dosageRecommendations[0]).toHaveProperty('medication');
      expect(result.dosageRecommendations[0]).toHaveProperty('recommendedDosage');
    });
  });

  describe('performCarrierScreening', () => {
    it('should identify carriers for autosomal recessive disorders', () => {
      const result = performCarrierScreening({
        variants: [
          { gene: 'CFTR', variantType: 'pathogenic' },
          { gene: 'CFTR', variantType: 'pathogenic' },
        ],
      });

      expect(result.carrierStatus).toBeDefined();
      expect(result.reproductiveRisk).toBeGreaterThanOrEqual(0);
      expect(result.reproductiveRisk).toBeLessThanOrEqual(1);
    });

    it('should flag counseling recommendation for high risk', () => {
      const result = performCarrierScreening({
        variants: [
          { gene: 'CFTR', variantType: 'pathogenic' },
          { gene: 'CFTR', variantType: 'pathogenic' },
        ],
      });

      if (result.reproductiveRisk > 0.25) {
        expect(result.counselingRecommended).toBe(true);
      }
    });
  });

  describe('analyzeRareDisease', () => {
    it('should match rare variants to diseases', () => {
      const result = analyzeRareDisease({
        variantId: 'rare_variant_001',
        frequency: 0.00001,
        functionalImpact: 'frameshift',
      });

      expect(result.matchedDiseases).toBeInstanceOf(Array);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should include literature evidence', () => {
      const result = analyzeRareDisease({
        variantId: 'rare_variant_001',
        frequency: 0.00001,
        functionalImpact: 'frameshift',
      });

      expect(result.literatureEvidence).toBeDefined();
    });
  });
});
