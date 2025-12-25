/**
 * Health Risk Calculator
 * Calculates polygenic risk scores for various health conditions
 * based on matched SNPs from user's genetic data.
 */

// Known risk-associated SNPs for common conditions
// Based on published GWAS studies and SNPedia data
const CONDITION_SNPS = {
  'Type 2 Diabetes': {
    baselineRisk: 0.10, // 10% lifetime risk
    snps: [
      { rsid: 'rs7903146', gene: 'TCF7L2', riskAllele: 'T', odds: 1.37 },
      { rsid: 'rs1801282', gene: 'PPARG', riskAllele: 'C', odds: 1.14 },
      { rsid: 'rs5219', gene: 'KCNJ11', riskAllele: 'T', odds: 1.15 },
      { rsid: 'rs13266634', gene: 'SLC30A8', riskAllele: 'C', odds: 1.12 },
      { rsid: 'rs4402960', gene: 'IGF2BP2', riskAllele: 'T', odds: 1.14 },
      { rsid: 'rs10811661', gene: 'CDKN2A/B', riskAllele: 'T', odds: 1.20 },
      { rsid: 'rs8050136', gene: 'FTO', riskAllele: 'A', odds: 1.17 },
    ]
  },
  'Coronary Artery Disease': {
    baselineRisk: 0.08,
    snps: [
      { rsid: 'rs1333049', gene: '9p21.3', riskAllele: 'C', odds: 1.29 },
      { rsid: 'rs4977574', gene: '9p21.3', riskAllele: 'G', odds: 1.25 },
      { rsid: 'rs6725887', gene: 'WDR12', riskAllele: 'C', odds: 1.14 },
      { rsid: 'rs9982601', gene: '6p24', riskAllele: 'T', odds: 1.13 },
      { rsid: 'rs12526453', gene: 'PHACTR1', riskAllele: 'C', odds: 1.12 },
    ]
  },
  'Age-Related Macular Degeneration': {
    baselineRisk: 0.02,
    snps: [
      { rsid: 'rs1061170', gene: 'CFH', riskAllele: 'C', odds: 2.45 },
      { rsid: 'rs10490924', gene: 'ARMS2', riskAllele: 'T', odds: 2.69 },
      { rsid: 'rs2230199', gene: 'C3', riskAllele: 'G', odds: 1.42 },
    ]
  },
  "Alzheimer's Disease": {
    baselineRisk: 0.10,
    snps: [
      { rsid: 'rs429358', gene: 'APOE', riskAllele: 'C', odds: 3.68 }, // APOE ε4
      { rsid: 'rs7412', gene: 'APOE', riskAllele: 'C', odds: 0.56 }, // APOE ε2 (protective)
      { rsid: 'rs3764650', gene: 'ABCA7', riskAllele: 'G', odds: 1.23 },
      { rsid: 'rs744373', gene: 'BIN1', riskAllele: 'G', odds: 1.17 },
    ]
  },
  'Atrial Fibrillation': {
    baselineRisk: 0.04,
    snps: [
      { rsid: 'rs2200733', gene: '4q25', riskAllele: 'T', odds: 1.72 },
      { rsid: 'rs10033464', gene: '4q25', riskAllele: 'T', odds: 1.39 },
      { rsid: 'rs7193343', gene: 'ZFHX3', riskAllele: 'T', odds: 1.25 },
    ]
  },
  'Celiac Disease': {
    baselineRisk: 0.01,
    snps: [
      { rsid: 'rs2187668', gene: 'HLA-DQ2.5', riskAllele: 'T', odds: 6.23 },
      { rsid: 'rs7454108', gene: 'HLA-DQ8', riskAllele: 'C', odds: 4.00 },
    ]
  },
  'Rheumatoid Arthritis': {
    baselineRisk: 0.01,
    snps: [
      { rsid: 'rs6679677', gene: 'PTPN22', riskAllele: 'A', odds: 1.94 },
      { rsid: 'rs3890745', gene: 'PADI4', riskAllele: 'C', odds: 1.14 },
      { rsid: 'rs2476601', gene: 'PTPN22', riskAllele: 'A', odds: 1.89 },
    ]
  },
  'Prostate Cancer': {
    baselineRisk: 0.12,
    snps: [
      { rsid: 'rs1447295', gene: '8q24', riskAllele: 'A', odds: 1.60 },
      { rsid: 'rs16901979', gene: '8q24', riskAllele: 'A', odds: 1.79 },
      { rsid: 'rs6983267', gene: '8q24', riskAllele: 'G', odds: 1.26 },
      { rsid: 'rs10993994', gene: 'MSMB', riskAllele: 'T', odds: 1.25 },
    ]
  },
  'Breast Cancer': {
    baselineRisk: 0.12,
    snps: [
      { rsid: 'rs2981582', gene: 'FGFR2', riskAllele: 'T', odds: 1.26 },
      { rsid: 'rs3803662', gene: 'TOX3', riskAllele: 'T', odds: 1.20 },
      { rsid: 'rs889312', gene: 'MAP3K1', riskAllele: 'C', odds: 1.13 },
      { rsid: 'rs13281615', gene: '8q24', riskAllele: 'G', odds: 1.08 },
    ]
  }
};

export class RiskCalculator {
  constructor() {
    this.conditions = CONDITION_SNPS;
  }

  /**
   * Calculate risk scores for all conditions based on matches
   * @param {Array} matches - Array of matched SNPs with genotype info
   * @returns {Array} Array of risk score objects
   */
  calculateAllRiskScores(matches) {
    const scores = [];
    const matchMap = new Map(matches.map(m => [m.rsid.toLowerCase(), m]));

    for (const [condition, data] of Object.entries(this.conditions)) {
      const score = this.calculateConditionRisk(condition, data, matchMap);
      if (score.coverage > 0) {
        scores.push(score);
      }
    }

    // Sort by relative risk (descending)
    return scores.sort((a, b) => b.relativeRisk - a.relativeRisk);
  }

  /**
   * Calculate risk for a specific condition
   */
  calculateConditionRisk(conditionName, conditionData, matchMap) {
    const { baselineRisk, snps } = conditionData;
    let logOddsSum = 0;
    let snpsFound = 0;
    const snpDetails = [];

    for (const snpDef of snps) {
      const match = matchMap.get(snpDef.rsid.toLowerCase());

      if (match) {
        snpsFound++;
        const genotype = match.userGenotype || match.genotype || '';
        const riskAlleleCount = this.countRiskAlleles(genotype, snpDef.riskAllele);

        // Calculate log odds contribution
        const logOdds = Math.log(snpDef.odds);
        const contribution = logOdds * riskAlleleCount;
        logOddsSum += contribution;

        snpDetails.push({
          rsid: snpDef.rsid,
          gene: snpDef.gene,
          genotype,
          riskAllele: snpDef.riskAllele,
          riskAlleleCount,
          odds: snpDef.odds,
          impact: riskAlleleCount === 2 ? 'high' : riskAlleleCount === 1 ? 'moderate' : 'none'
        });
      }
    }

    const coverage = snpsFound / snps.length;
    const relativeRisk = Math.exp(logOddsSum);
    const absoluteRisk = Math.min(baselineRisk * relativeRisk, 0.99);

    // Calculate confidence based on coverage and number of SNPs
    let confidence = 'insufficient';
    if (coverage >= 0.8) confidence = 'high';
    else if (coverage >= 0.5) confidence = 'moderate';
    else if (coverage >= 0.25) confidence = 'low';

    // Determine risk category
    let riskCategory = 'average';
    if (relativeRisk >= 2.0) riskCategory = 'elevated';
    else if (relativeRisk >= 1.5) riskCategory = 'above-average';
    else if (relativeRisk <= 0.7) riskCategory = 'reduced';
    else if (relativeRisk <= 0.5) riskCategory = 'below-average';

    return {
      condition: conditionName,
      baselineRisk,
      relativeRisk: Math.round(relativeRisk * 100) / 100,
      absoluteRisk: Math.round(absoluteRisk * 1000) / 10, // as percentage
      coverage: Math.round(coverage * 100) / 100,
      confidence,
      riskCategory,
      snpsFound,
      totalSnps: snps.length,
      details: snpDetails,
      interpretation: this.generateInterpretation(conditionName, relativeRisk, confidence)
    };
  }

  /**
   * Count how many copies of the risk allele are present
   */
  countRiskAlleles(genotype, riskAllele) {
    if (!genotype) return 0;
    const upper = genotype.toUpperCase();
    const riskUpper = riskAllele.toUpperCase();
    let count = 0;
    for (const char of upper) {
      if (char === riskUpper) count++;
    }
    return count;
  }

  /**
   * Generate human-readable interpretation
   */
  generateInterpretation(condition, relativeRisk, confidence) {
    if (confidence === 'insufficient') {
      return `Insufficient genetic data to assess ${condition} risk.`;
    }

    let riskLevel = '';
    if (relativeRisk >= 2.0) {
      riskLevel = 'significantly elevated';
    } else if (relativeRisk >= 1.5) {
      riskLevel = 'moderately elevated';
    } else if (relativeRisk >= 1.2) {
      riskLevel = 'slightly elevated';
    } else if (relativeRisk >= 0.8) {
      riskLevel = 'about average';
    } else if (relativeRisk >= 0.5) {
      riskLevel = 'below average';
    } else {
      riskLevel = 'significantly reduced';
    }

    const confidenceNote = confidence === 'high'
      ? 'This assessment is based on a comprehensive panel of genetic markers.'
      : confidence === 'moderate'
      ? 'This assessment is based on a partial panel of genetic markers.'
      : 'This assessment is based on limited genetic data and should be interpreted with caution.';

    return `Your genetic risk for ${condition} appears to be ${riskLevel} ` +
           `(${Math.round(relativeRisk * 100)}% of average population risk). ${confidenceNote}`;
  }

  /**
   * Get top risk conditions (highest relative risk)
   */
  getTopRisks(matches, limit = 5) {
    const scores = this.calculateAllRiskScores(matches);
    return scores
      .filter(s => s.confidence !== 'insufficient' && s.relativeRisk > 1.0)
      .slice(0, limit);
  }

  /**
   * Get protective factors (lowest relative risk)
   */
  getProtectiveFactors(matches, limit = 5) {
    const scores = this.calculateAllRiskScores(matches);
    return scores
      .filter(s => s.confidence !== 'insufficient' && s.relativeRisk < 1.0)
      .sort((a, b) => a.relativeRisk - b.relativeRisk)
      .slice(0, limit);
  }
}

export default RiskCalculator;
