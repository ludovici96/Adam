/**
 * EmotionalAnalyzer - Maps SNPs to MBTI personality dimensions
 *
 * Dimensions:
 * - E/I: Extraversion/Introversion (energy direction)
 * - S/N: Sensing/Intuition (information processing)
 * - T/F: Thinking/Feeling (decision making)
 * - J/P: Judging/Perceiving (lifestyle organization)
 *
 * Scientific basis from:
 * - OXTR rs53576: Empathy, prosocial behavior (PNAS, SNPedia)
 * - COMT rs4680: Warrior/Worrier cognitive styles (PubMed)
 * - DRD2 rs1800497: Extraversion associations
 * - BDNF rs6265: Introversion associations (Nature)
 * - 5-HTTLPR variants: Emotional flexibility
 */

const MBTI_TRAIT_DATABASE = {
  'E/I': {
    dimension: 'Energy',
    polarLabels: ['Introversion', 'Extraversion'],
    description: 'How you direct and receive energy',
    snps: [
      {
        rsid: 'rs53576',
        gene: 'OXTR',
        traitAllele: 'G',
        direction: 'E',
        weight: 0.8,
        reference: 'G allele linked to higher sociability and social seeking'
      },
      {
        rsid: 'rs4680',
        gene: 'COMT',
        traitAllele: 'A',
        direction: 'I',
        weight: 0.6,
        reference: 'Met (A) carriers associated with higher worry/introversion'
      },
      {
        rsid: 'rs1800497',
        gene: 'DRD2',
        traitAllele: 'A',
        direction: 'E',
        weight: 0.5,
        reference: 'Reward-seeking behavior linked to extraversion'
      },
      {
        rsid: 'rs6265',
        gene: 'BDNF',
        traitAllele: 'A',
        direction: 'I',
        weight: 1.0,
        reference: 'Met carriers tend toward introversion'
      },
      {
        rsid: 'rs1800955',
        gene: 'DRD4',
        traitAllele: 'T',
        direction: 'E',
        weight: 0.6,
        reference: 'Associated with social engagement'
      }
    ]
  },

  'S/N': {
    dimension: 'Information',
    polarLabels: ['Sensing', 'Intuition'],
    description: 'How you take in information',
    snps: [
      {
        rsid: 'rs4680',
        gene: 'COMT',
        traitAllele: 'A',
        direction: 'N',
        weight: 1.2,
        reference: 'Met/Met associated with deeper cognitive processing (Intuition)'
      },
      {
        rsid: 'rs17070145',
        gene: 'KIBRA',
        traitAllele: 'T',
        direction: 'N',
        weight: 0.7,
        reference: 'Enhanced memory and learning associations'
      }
    ]
  },

  'T/F': {
    dimension: 'Decisions',
    polarLabels: ['Thinking', 'Feeling'],
    description: 'How you make decisions',
    snps: [
      {
        rsid: 'rs53576',
        gene: 'OXTR',
        traitAllele: 'G',
        direction: 'F',
        weight: 1.5,
        reference: 'GG genotype strongly associated with higher empathy (Feeling)'
      },
      {
        rsid: 'rs2254298',
        gene: 'OXTR',
        traitAllele: 'A',
        direction: 'F',
        weight: 1.0,
        reference: 'Social cognition variant'
      },
      {
        rsid: 'rs1042778',
        gene: 'OXTR',
        traitAllele: 'G',
        direction: 'F',
        weight: 0.8,
        reference: 'Prosocial behavior associations'
      }
    ]
  },

  'J/P': {
    dimension: 'Lifestyle',
    polarLabels: ['Perceiving', 'Judging'],
    description: 'How you organize your world',
    snps: [
      {
        rsid: 'rs4680',
        gene: 'COMT',
        traitAllele: 'G',
        direction: 'J',
        weight: 1.0,
        reference: 'Val/Val warriors tend toward structure and resilience (Judging)'
      },
      {
        rsid: 'rs1800955',
        gene: 'DRD4',
        traitAllele: 'T',
        direction: 'P',
        weight: 1.2,
        reference: 'Novelty seeking is a core Perceiving trait'
      },
      {
        rsid: 'rs1800497',
        gene: 'DRD2',
        traitAllele: 'A',
        direction: 'P',
        weight: 0.8,
        reference: 'Impulsivity linked to Perceiving nature'
      },
      {
        rsid: 'rs25531',
        gene: '5-HTTLPR',
        traitAllele: 'A',
        direction: 'P',
        weight: 1.0,
        reference: 'Associated with flexibility and adaptability'
      },
      {
        rsid: 'rs6313',
        gene: 'HTR2A',
        traitAllele: 'T',
        direction: 'P',
        weight: 0.6,
        reference: 'Serotonin receptor flexibility associations'
      }
    ]
  }
};

const MBTI_TYPE_PROFILES = {
  'INTJ': {
    name: 'The Architect',
    description: 'Strategic, independent thinkers who enjoy complex problem-solving',
    strengths: ['Strategic thinking', 'Independence', 'Determination']
  },
  'INTP': {
    name: 'The Logician',
    description: 'Innovative inventors with a thirst for knowledge',
    strengths: ['Analytical', 'Original', 'Open-minded']
  },
  'ENTJ': {
    name: 'The Commander',
    description: 'Bold, imaginative leaders who find a way',
    strengths: ['Efficient', 'Confident', 'Strong-willed']
  },
  'ENTP': {
    name: 'The Debater',
    description: 'Smart and curious thinkers who thrive on challenge',
    strengths: ['Quick thinking', 'Charismatic', 'Energetic']
  },
  'INFJ': {
    name: 'The Advocate',
    description: 'Quiet and mystical, yet inspiring idealists',
    strengths: ['Insightful', 'Principled', 'Passionate']
  },
  'INFP': {
    name: 'The Mediator',
    description: 'Poetic, kind, and altruistic people',
    strengths: ['Empathetic', 'Creative', 'Idealistic']
  },
  'ENFJ': {
    name: 'The Protagonist',
    description: 'Charismatic and inspiring leaders',
    strengths: ['Tolerant', 'Reliable', 'Natural leaders']
  },
  'ENFP': {
    name: 'The Campaigner',
    description: 'Enthusiastic, creative, and free spirits',
    strengths: ['Curious', 'Energetic', 'Enthusiastic']
  },
  'ISTJ': {
    name: 'The Logistician',
    description: 'Practical and fact-minded individuals',
    strengths: ['Honest', 'Dutiful', 'Responsible']
  },
  'ISFJ': {
    name: 'The Defender',
    description: 'Dedicated and warm protectors',
    strengths: ['Supportive', 'Reliable', 'Patient']
  },
  'ESTJ': {
    name: 'The Executive',
    description: 'Excellent administrators and managers',
    strengths: ['Organized', 'Dedicated', 'Strong-willed']
  },
  'ESFJ': {
    name: 'The Consul',
    description: 'Caring, social, and community-minded',
    strengths: ['Caring', 'Loyal', 'Sensitive']
  },
  'ISTP': {
    name: 'The Virtuoso',
    description: 'Bold and practical experimenters',
    strengths: ['Optimistic', 'Creative', 'Practical']
  },
  'ISFP': {
    name: 'The Adventurer',
    description: 'Flexible and charming artists',
    strengths: ['Charming', 'Artistic', 'Imaginative']
  },
  'ESTP': {
    name: 'The Entrepreneur',
    description: 'Smart, energetic, and perceptive people',
    strengths: ['Bold', 'Direct', 'Sociable']
  },
  'ESFP': {
    name: 'The Entertainer',
    description: 'Spontaneous, energetic, and fun-loving',
    strengths: ['Bold', 'Original', 'Observant']
  }
};

export class EmotionalAnalyzer {
  constructor() {
    this.traitDatabase = MBTI_TRAIT_DATABASE;
    this.typeProfiles = MBTI_TYPE_PROFILES;
  }

  analyze(matches) {
    if (!matches || matches.length === 0) {
      return null;
    }

    // Create lookup map by rsid
    const matchMap = new Map();
    matches.forEach(m => {
      const rsid = (m.rsid || '').toLowerCase();
      if (rsid) matchMap.set(rsid, m);
    });

    const dimensions = {};
    let totalSnpsFound = 0;
    let totalSnpsPossible = 0;

    // Analyze each dimension
    for (const [dimKey, dimData] of Object.entries(this.traitDatabase)) {
      const result = this.analyzeDimension(dimKey, dimData, matchMap);
      dimensions[dimKey] = result;
      totalSnpsFound += result.snpsFound;
      totalSnpsPossible += result.totalSnps;
    }

    // Derive MBTI type code
    const mbtiType =
      dimensions['E/I'].letter +
      dimensions['S/N'].letter +
      dimensions['T/F'].letter +
      dimensions['J/P'].letter;

    // Build radar data for visualization (normalized 0-1 scale)
    const radarData = this.buildRadarData(dimensions);

    const coverage = totalSnpsPossible > 0 ? totalSnpsFound / totalSnpsPossible : 0;

    return {
      dimensions,
      mbtiType,
      typeProfile: this.typeProfiles[mbtiType] || {
        name: 'Unique Profile',
        description: 'A distinctive combination of traits',
        strengths: ['Adaptable', 'Complex', 'Individual']
      },
      radarData,
      overallConfidence: this.determineConfidence(coverage),
      coverage,
      totalSnpsAnalyzed: totalSnpsFound
    };
  }

  analyzeDimension(dimKey, dimData, matchMap) {
    let polarScore = 0.5; // Start neutral
    let weightSum = 0;
    let snpsFound = 0;
    const details = [];

    const firstLetter = dimKey[0]; // E, S, T, J
    const secondLetter = dimKey[2]; // I, N, F, P

    for (const snp of dimData.snps) {
      const match = matchMap.get(snp.rsid.toLowerCase());

      if (match) {
        snpsFound++;
        const genotype = match.userGenotype || match.genotype || '';
        const traitAlleleCount = this.countAlleles(genotype, snp.traitAllele);

        // Calculate contribution: 0, 1, or 2 copies of trait allele
        // Each copy contributes weight * 0.15 to move score from neutral
        const contribution = (traitAlleleCount / 2) * snp.weight * 0.15;

        if (snp.direction === firstLetter) {
          polarScore += contribution;
        } else {
          polarScore -= contribution;
        }

        weightSum += snp.weight;
        details.push({
          rsid: snp.rsid,
          gene: snp.gene,
          genotype,
          traitAllele: snp.traitAllele,
          traitAlleleCount,
          contribution: snp.direction === firstLetter ? contribution : -contribution,
          direction: snp.direction,
          reference: snp.reference
        });
      }
    }

    // Clamp to 0-1 range
    polarScore = Math.max(0, Math.min(1, polarScore));

    // Determine letter based on threshold
    const letter = polarScore >= 0.5 ? firstLetter : secondLetter;

    // Calculate confidence based on coverage
    const coverage = snpsFound / dimData.snps.length;
    const confidence = this.determineConfidence(coverage);

    return {
      score: polarScore,
      letter,
      confidence,
      snpsFound,
      totalSnps: dimData.snps.length,
      dimension: dimData.dimension,
      polarLabels: dimData.polarLabels,
      description: dimData.description,
      details
    };
  }

  buildRadarData(dimensions) {
    // For each dimension, calculate the strength of the preference
    // Score of 0.5 = neutral, further from 0.5 = stronger preference
    return [
      {
        axis: dimensions['E/I'].letter === 'E' ? 'Extraversion' : 'Introversion',
        value: this.normalizeStrength(dimensions['E/I'].score),
        dimension: 'E/I'
      },
      {
        axis: dimensions['S/N'].letter === 'N' ? 'Intuition' : 'Sensing',
        value: this.normalizeStrength(dimensions['S/N'].score),
        dimension: 'S/N'
      },
      {
        axis: dimensions['T/F'].letter === 'F' ? 'Feeling' : 'Thinking',
        value: this.normalizeStrength(dimensions['T/F'].score),
        dimension: 'T/F'
      },
      {
        axis: dimensions['J/P'].letter === 'J' ? 'Judging' : 'Perceiving',
        value: this.normalizeStrength(dimensions['J/P'].score),
        dimension: 'J/P'
      }
    ];
  }

  normalizeStrength(score) {
    // Convert 0-1 polar score to 0-1 strength
    // 0.5 = 0.5 strength (neutral)
    // 0 or 1 = 1.0 strength (maximum)
    const deviation = Math.abs(score - 0.5);
    return 0.5 + deviation;
  }

  countAlleles(genotype, targetAllele) {
    if (!genotype || !targetAllele) return 0;
    const upper = genotype.toUpperCase();
    const target = targetAllele.toUpperCase();
    let count = 0;
    for (const char of upper) {
      if (char === target) count++;
    }
    return count;
  }

  determineConfidence(coverage) {
    if (coverage >= 0.75) return 'high';
    if (coverage >= 0.5) return 'moderate';
    if (coverage >= 0.25) return 'low';
    return 'insufficient';
  }
}

export default EmotionalAnalyzer;
