/**
 * Pharmacogenomics Analyzer
 * Identifies drug-gene interactions for personalized medicine insights.
 * Based on PharmGKB and CPIC guidelines.
 */

// Drug-gene interaction database
// Based on FDA pharmacogenomic biomarkers and CPIC guidelines
const DRUG_GENE_INTERACTIONS = {
  CYP2D6: {
    description: 'Cytochrome P450 2D6 - metabolizes ~25% of all medications',
    snps: [
      { rsid: 'rs3892097', normalAllele: 'G', variantAllele: 'A', effect: 'non-functional' }, // *4
      { rsid: 'rs5030655', normalAllele: 'G', variantAllele: 'T', effect: 'non-functional' }, // *6
      { rsid: 'rs1065852', normalAllele: 'G', variantAllele: 'A', effect: 'reduced' }, // *10
      { rsid: 'rs16947', normalAllele: 'G', variantAllele: 'A', effect: 'reduced' }, // *2
      { rsid: 'rs1135840', normalAllele: 'G', variantAllele: 'C', effect: 'normal' },
    ],
    drugs: [
      { name: 'Codeine', class: 'Opioid Analgesic', severity: 'high', notes: 'Requires CYP2D6 for activation. Poor metabolizers have no pain relief; ultrarapid metabolizers risk toxicity.' },
      { name: 'Tramadol', class: 'Opioid Analgesic', severity: 'high', notes: 'Similar to codeine; metabolism affects pain relief and side effects.' },
      { name: 'Tamoxifen', class: 'Anticancer', severity: 'high', notes: 'Converted to active endoxifen by CYP2D6. Poor metabolizers may have reduced efficacy.' },
      { name: 'Fluoxetine', class: 'Antidepressant', severity: 'moderate', notes: 'Poor metabolizers may need dose reduction.' },
      { name: 'Paroxetine', class: 'Antidepressant', severity: 'moderate', notes: 'Consider alternative for poor metabolizers.' },
      { name: 'Ondansetron', class: 'Antiemetic', severity: 'moderate', notes: 'Ultrarapid metabolizers may have reduced antiemetic effect.' },
    ]
  },
  CYP2C19: {
    description: 'Cytochrome P450 2C19 - critical for clopidogrel and PPIs',
    snps: [
      { rsid: 'rs4244285', normalAllele: 'G', variantAllele: 'A', effect: 'non-functional' }, // *2
      { rsid: 'rs4986893', normalAllele: 'G', variantAllele: 'A', effect: 'non-functional' }, // *3
      { rsid: 'rs12248560', normalAllele: 'C', variantAllele: 'T', effect: 'increased' }, // *17
    ],
    drugs: [
      { name: 'Clopidogrel (Plavix)', class: 'Antiplatelet', severity: 'high', notes: 'Poor metabolizers have significantly increased cardiovascular risk. Alternative therapy recommended.' },
      { name: 'Omeprazole', class: 'Proton Pump Inhibitor', severity: 'moderate', notes: 'Ultrarapid metabolizers may need higher doses.' },
      { name: 'Citalopram', class: 'Antidepressant', severity: 'moderate', notes: 'Poor metabolizers at increased risk of QT prolongation.' },
      { name: 'Escitalopram', class: 'Antidepressant', severity: 'moderate', notes: 'Dose reduction needed for poor metabolizers.' },
      { name: 'Voriconazole', class: 'Antifungal', severity: 'high', notes: 'Significant dosing implications based on metabolizer status.' },
    ]
  },
  CYP2C9: {
    description: 'Cytochrome P450 2C9 - metabolizes warfarin and NSAIDs',
    snps: [
      { rsid: 'rs1799853', normalAllele: 'C', variantAllele: 'T', effect: 'reduced' }, // *2
      { rsid: 'rs1057910', normalAllele: 'A', variantAllele: 'C', effect: 'reduced' }, // *3
    ],
    drugs: [
      { name: 'Warfarin', class: 'Anticoagulant', severity: 'high', notes: 'Poor metabolizers require significantly lower doses. High bleeding risk without dose adjustment.' },
      { name: 'Phenytoin', class: 'Antiepileptic', severity: 'high', notes: 'Poor metabolizers at risk of toxicity; dose reduction needed.' },
      { name: 'Celecoxib', class: 'NSAID', severity: 'moderate', notes: 'Consider dose reduction in poor metabolizers.' },
    ]
  },
  VKORC1: {
    description: 'Vitamin K epoxide reductase - warfarin target',
    snps: [
      { rsid: 'rs9923231', normalAllele: 'G', variantAllele: 'A', effect: 'sensitive' }, // -1639G>A
    ],
    drugs: [
      { name: 'Warfarin', class: 'Anticoagulant', severity: 'high', notes: 'A allele carriers require lower warfarin doses. Combined with CYP2C9 for optimal dosing.' },
    ]
  },
  SLCO1B1: {
    description: 'Solute carrier organic anion transporter 1B1 - statin transport',
    snps: [
      { rsid: 'rs4149056', normalAllele: 'T', variantAllele: 'C', effect: 'reduced' }, // *5
    ],
    drugs: [
      { name: 'Simvastatin', class: 'Statin', severity: 'high', notes: 'C allele carriers have 4-17x higher risk of myopathy. Consider lower dose or alternative statin.' },
      { name: 'Atorvastatin', class: 'Statin', severity: 'moderate', notes: 'Increased exposure in variant carriers; monitor for side effects.' },
      { name: 'Rosuvastatin', class: 'Statin', severity: 'moderate', notes: 'Consider dose reduction in variant carriers.' },
    ]
  },
  TPMT: {
    description: 'Thiopurine methyltransferase - critical for thiopurine drugs',
    snps: [
      { rsid: 'rs1800462', normalAllele: 'C', variantAllele: 'G', effect: 'non-functional' }, // *2
      { rsid: 'rs1800460', normalAllele: 'C', variantAllele: 'T', effect: 'non-functional' }, // *3B
      { rsid: 'rs1142345', normalAllele: 'T', variantAllele: 'C', effect: 'non-functional' }, // *3C
    ],
    drugs: [
      { name: 'Azathioprine', class: 'Immunosuppressant', severity: 'high', notes: 'Poor metabolizers at severe risk of myelosuppression. Requires significant dose reduction or alternative.' },
      { name: '6-Mercaptopurine', class: 'Antileukemic', severity: 'high', notes: 'Life-threatening toxicity in poor metabolizers. Mandatory testing before use.' },
    ]
  },
  DPYD: {
    description: 'Dihydropyrimidine dehydrogenase - fluoropyrimidine metabolism',
    snps: [
      { rsid: 'rs3918290', normalAllele: 'C', variantAllele: 'T', effect: 'non-functional' }, // *2A
      { rsid: 'rs55886062', normalAllele: 'A', variantAllele: 'C', effect: 'reduced' }, // *13
    ],
    drugs: [
      { name: '5-Fluorouracil', class: 'Anticancer', severity: 'high', notes: 'Variant carriers at severe risk of life-threatening toxicity. Pre-treatment testing recommended.' },
      { name: 'Capecitabine', class: 'Anticancer', severity: 'high', notes: 'Same concerns as 5-FU. Dose reduction or alternative required for variant carriers.' },
    ]
  },
  HLA_B_5701: {
    description: 'Human Leukocyte Antigen B*57:01 - abacavir hypersensitivity',
    snps: [
      { rsid: 'rs2395029', normalAllele: 'T', variantAllele: 'G', effect: 'risk' },
    ],
    drugs: [
      { name: 'Abacavir', class: 'Antiretroviral', severity: 'high', notes: 'HLA-B*5701 carriers should NEVER receive abacavir due to risk of severe hypersensitivity reaction.' },
    ]
  },
  CYP3A5: {
    description: 'Cytochrome P450 3A5 - tacrolimus metabolism',
    snps: [
      { rsid: 'rs776746', normalAllele: 'C', variantAllele: 'T', effect: 'reduced' }, // *3
    ],
    drugs: [
      { name: 'Tacrolimus', class: 'Immunosuppressant', severity: 'high', notes: 'CYP3A5 expressers (C allele) require higher doses to achieve therapeutic levels.' },
    ]
  }
};

// Phenotype classifications
const PHENOTYPE_CLASSIFICATIONS = {
  'ultrarapid': { label: 'Ultrarapid Metabolizer', color: '#FF9500', icon: '⚡' },
  'normal': { label: 'Normal Metabolizer', color: '#34C759', icon: '✓' },
  'intermediate': { label: 'Intermediate Metabolizer', color: '#FFCC00', icon: '⚠' },
  'poor': { label: 'Poor Metabolizer', color: '#FF3B30', icon: '✗' }
};

export class PharmaAnalyzer {
  constructor() {
    this.genes = DRUG_GENE_INTERACTIONS;
    this.phenotypes = PHENOTYPE_CLASSIFICATIONS;
  }

  /**
   * Analyze pharmacogenomics based on matched SNPs
   * @param {Array} matches - Array of matched SNPs
   * @returns {Object} Complete pharmacogenomic analysis
   */
  analyze(matches) {
    const matchMap = new Map(matches.map(m => [m.rsid.toLowerCase(), m]));
    const geneResults = {};
    const drugRecommendations = {
      actionable: [],
      informative: [],
      normal: []
    };

    for (const [gene, data] of Object.entries(this.genes)) {
      const geneAnalysis = this.analyzeGene(gene, data, matchMap);

      if (geneAnalysis.coverage > 0) {
        geneResults[gene] = geneAnalysis;

        // Categorize drug recommendations based on phenotype
        for (const drugInfo of data.drugs) {
          const recommendation = this.getDrugRecommendation(
            drugInfo,
            geneAnalysis.phenotype,
            gene
          );

          if (recommendation.actionRequired) {
            drugRecommendations.actionable.push(recommendation);
          } else if (recommendation.informational) {
            drugRecommendations.informative.push(recommendation);
          } else {
            drugRecommendations.normal.push(recommendation);
          }
        }
      }
    }

    // Sort actionable by severity
    drugRecommendations.actionable.sort((a, b) => {
      const severityOrder = { high: 0, moderate: 1, low: 2 };
      return (severityOrder[a.severity] || 2) - (severityOrder[b.severity] || 2);
    });

    return {
      genes: geneResults,
      drugs: drugRecommendations,
      summary: this.generateSummary(geneResults, drugRecommendations),
      totalGenesAnalyzed: Object.keys(geneResults).length,
      actionableCount: drugRecommendations.actionable.length
    };
  }

  /**
   * Analyze a specific gene
   */
  analyzeGene(geneName, geneData, matchMap) {
    let functionalAlleles = 0;
    let reducedAlleles = 0;
    let nonFunctionalAlleles = 0;
    let increasedAlleles = 0;
    let snpsFound = 0;
    const snpDetails = [];

    for (const snp of geneData.snps) {
      const match = matchMap.get(snp.rsid.toLowerCase());

      if (match) {
        snpsFound++;
        const genotype = (match.userGenotype || match.genotype || '').toUpperCase();
        const variantCount = this.countAlleles(genotype, snp.variantAllele);
        const normalCount = this.countAlleles(genotype, snp.normalAllele);

        snpDetails.push({
          rsid: snp.rsid,
          genotype,
          effect: snp.effect,
          variantCount,
          normalCount
        });

        // Tally allele effects
        if (snp.effect === 'non-functional') {
          nonFunctionalAlleles += variantCount;
        } else if (snp.effect === 'reduced') {
          reducedAlleles += variantCount;
        } else if (snp.effect === 'increased') {
          increasedAlleles += variantCount;
        }
        functionalAlleles += normalCount;
      }
    }

    const coverage = snpsFound / geneData.snps.length;
    const phenotype = this.determinePhenotype(
      functionalAlleles,
      reducedAlleles,
      nonFunctionalAlleles,
      increasedAlleles
    );

    return {
      gene: geneName,
      description: geneData.description,
      phenotype,
      phenotypeInfo: this.phenotypes[phenotype] || this.phenotypes.normal,
      coverage: Math.round(coverage * 100) / 100,
      snpsFound,
      totalSnps: geneData.snps.length,
      details: snpDetails,
      alleleBreakdown: {
        functional: functionalAlleles,
        reduced: reducedAlleles,
        nonFunctional: nonFunctionalAlleles,
        increased: increasedAlleles
      }
    };
  }

  /**
   * Count occurrences of an allele in a genotype
   */
  countAlleles(genotype, allele) {
    if (!genotype || !allele) return 0;
    const upper = genotype.toUpperCase();
    const alleleUpper = allele.toUpperCase();
    let count = 0;
    for (const char of upper) {
      if (char === alleleUpper) count++;
    }
    return count;
  }

  /**
   * Determine metabolizer phenotype based on allele counts
   */
  determinePhenotype(functional, reduced, nonFunctional, increased) {
    // Simplified phenotype determination
    if (increased >= 2 || (increased >= 1 && nonFunctional === 0 && reduced === 0)) {
      return 'ultrarapid';
    }
    if (nonFunctional >= 2) {
      return 'poor';
    }
    if (nonFunctional >= 1 || reduced >= 2) {
      return 'intermediate';
    }
    return 'normal';
  }

  /**
   * Get drug-specific recommendation
   */
  getDrugRecommendation(drugInfo, phenotype, gene) {
    const isActionable = (
      (phenotype === 'poor' && drugInfo.severity === 'high') ||
      (phenotype === 'ultrarapid' && drugInfo.severity === 'high')
    );

    const isInformational = (
      phenotype !== 'normal' &&
      (drugInfo.severity === 'moderate' || drugInfo.severity === 'high')
    );

    let recommendation = '';
    if (phenotype === 'poor') {
      recommendation = `Reduced or absent ${gene} function may significantly affect ${drugInfo.name} metabolism. ` +
        `Consider alternative medication or dose adjustment.`;
    } else if (phenotype === 'ultrarapid') {
      recommendation = `Increased ${gene} activity may reduce ${drugInfo.name} effectiveness or increase toxicity risk.`;
    } else if (phenotype === 'intermediate') {
      recommendation = `Moderately reduced ${gene} function. Monitor for altered response to ${drugInfo.name}.`;
    } else {
      recommendation = `Normal ${gene} function expected. Standard ${drugInfo.name} dosing typically appropriate.`;
    }

    return {
      drug: drugInfo.name,
      drugClass: drugInfo.class,
      gene,
      phenotype,
      severity: drugInfo.severity,
      notes: drugInfo.notes,
      recommendation,
      actionRequired: isActionable,
      informational: isInformational
    };
  }

  /**
   * Generate summary text
   */
  generateSummary(geneResults, drugRecommendations) {
    const geneCount = Object.keys(geneResults).length;
    const actionableCount = drugRecommendations.actionable.length;

    if (geneCount === 0) {
      return {
        headline: 'Limited Pharmacogenomic Data',
        text: 'Your genetic data did not contain sufficient information for pharmacogenomic analysis.',
        severity: 'neutral'
      };
    }

    if (actionableCount === 0) {
      return {
        headline: 'No Urgent Drug Interactions Found',
        text: `Analysis of ${geneCount} drug-metabolizing genes found no high-priority interactions. ` +
          `Your drug metabolism appears typical for most medications.`,
        severity: 'good'
      };
    }

    const topDrug = drugRecommendations.actionable[0];
    return {
      headline: `${actionableCount} Drug Interaction${actionableCount > 1 ? 's' : ''} Requiring Attention`,
      text: `Your genetic profile indicates altered metabolism for ${actionableCount} medication${actionableCount > 1 ? 's' : ''}. ` +
        `Most notably: ${topDrug.drug} may require dose adjustment or alternative therapy due to ${topDrug.phenotype} ${topDrug.gene} status.`,
      severity: 'warning'
    };
  }

  /**
   * Get high-priority drug interactions only
   */
  getActionableDrugs(matches) {
    const analysis = this.analyze(matches);
    return analysis.drugs.actionable;
  }

  /**
   * Get gene summary for a specific gene
   */
  getGeneSummary(geneName, matches) {
    if (!this.genes[geneName]) return null;

    const matchMap = new Map(matches.map(m => [m.rsid.toLowerCase(), m]));
    return this.analyzeGene(geneName, this.genes[geneName], matchMap);
  }
}

export default PharmaAnalyzer;
