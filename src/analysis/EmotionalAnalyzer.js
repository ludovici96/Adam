/**
 * EmotionalAnalyzer - Maps SNPs to Neurochemical Tones
 *
 * Systems:
 * - Dopamine: Drive, Focus, Reward Prediction Error (COMT, DRD2, DRD4)
 * - Serotonin: Mood Stability, Flexibility (5-HTTLPR, HTR2A)
 * - Oxytocin: Social Bonding, Empathy, Trust (OXTR)
 * - Plasticity: Neuroplasticity, Learning, Adaptation (BDNF, KIBRA)
 */

const NEUROCHEMISTRY_DATABASE = {
  dopamine: {
    label: 'Dopaminergic Tone',
    shortLabel: 'Dopamine',
    description: 'Drive, Focus, & Reward Processing',
    color: '#0EA5E9', // Sky Blue
    polarLabels: ['Rapid Clearance (Warrior)', 'High Retention (Worrier)'],
    snps: [
      {
        rsid: 'rs4680',
        gene: 'COMT',
        traitAllele: 'A', // Met
        effect: 'Higher Dopamine Levels',
        weight: 1.5,
        direction: 1, // Towards High Retention
        reference: 'Met allele (Worrier) leads to lower enzymatic activity and higher synaptic dopamine.'
      },
      {
        rsid: 'rs1800497',
        gene: 'DRD2',
        traitAllele: 'A', // A1
        effect: 'Reduced Receptor Density',
        weight: 1.0,
        direction: 0, // Towards Seeking/Rapid turnover behavior
        reference: 'A1 allele associated with reward deficiency and impulsive seeking.'
      },
      {
        rsid: 'rs1800955',
        gene: 'DRD4',
        traitAllele: 'T', // -521 T
        effect: 'Lower Transcriptional Activity',
        weight: 0.8,
        direction: 0, // Towards Novelty Seeking
        reference: 'Associated with novelty seeking and exploratory behavior.'
      }
    ]
  },
  serotonin: {
    label: 'Serotonergic Tone',
    shortLabel: 'Serotonin',
    description: 'Mood Stability & Flexibility',
    color: '#F59E0B', // Amber
    polarLabels: ['Resilient', 'Sensitive'],
    snps: [
      {
        rsid: 'rs25531',
        gene: '5-HTTLPR', // SLC6A4
        traitAllele: 'A', // Long/A
        effect: 'Higher Transporter Expression',
        weight: 1.2,
        direction: 0, // Towards Resilient
        reference: 'Long allele linked to efficient serotonin recycling and emotional resilience.'
      },
      {
        rsid: 'rs6313',
        gene: 'HTR2A',
        traitAllele: 'T',
        effect: 'Altered Receptor Signaling',
        weight: 0.8,
        direction: 1, // Towards Sensitive
        reference: 'Associated with heightened emotional sensitivity and arousal.'
      }
    ]
  },
  oxytocin: {
    label: 'Oxytocinergic Tone',
    shortLabel: 'Oxytocin',
    description: 'Social Bonding & Empathy',
    color: '#EC4899', // Pink
    polarLabels: ['Selective', 'Permeable'],
    snps: [
      {
        rsid: 'rs53576',
        gene: 'OXTR',
        traitAllele: 'G',
        effect: 'Higher Receptor Sensitivity',
        weight: 1.5,
        direction: 1, // Towards Permeable (High Empathy)
        reference: 'GG genotype strongly associated with higher empathy and sociality.'
      },
      {
        rsid: 'rs2254298',
        gene: 'OXTR',
        traitAllele: 'A',
        effect: 'Receptor Variation',
        weight: 1.0,
        direction: 1, // Towards Permeable
        reference: 'Associated with social cognition and maternal detachment (if G).'
      }
    ]
  },
  plasticity: {
    label: 'Neuroplasticity',
    shortLabel: 'Plasticity',
    description: 'Learning & Adaptation',
    color: '#10B981', // Emerald
    polarLabels: ['Structured', 'Fluid'],
    snps: [
      {
        rsid: 'rs6265',
        gene: 'BDNF',
        traitAllele: 'A', // Met
        effect: 'Reduced Secretion',
        weight: 1.2,
        direction: 0, // Towards Structured (Lower Plasticity)
        reference: 'Met allele associated with more rigid neural pathways and structured learning.'
      },
      {
        rsid: 'rs17070145',
        gene: 'KIBRA',
        traitAllele: 'T',
        effect: 'Enhanced Memory',
        weight: 0.8,
        direction: 1, // Towards Fluid
        reference: 'Associated with enhanced episodic memory and cognitive flexibility.'
      }
    ]
  }
};

export class EmotionalAnalyzer {
  constructor() {
    this.database = NEUROCHEMISTRY_DATABASE;
  }

  analyze(matches) {
    if (!matches || matches.length === 0) {
      return null;
    }

    const matchMap = new Map();
    matches.forEach(m => {
      const rsid = (m.rsid || '').toLowerCase();
      if (rsid) matchMap.set(rsid, m);
    });

    const systems = {};
    let totalSnpsFound = 0;
    let totalSnpsPossible = 0;

    for (const [key, systemData] of Object.entries(this.database)) {
      const result = this.analyzeSystem(key, systemData, matchMap);
      systems[key] = result;
      totalSnpsFound += result.snpsFound;
      totalSnpsPossible += result.totalSnps;
    }

    const coverage = totalSnpsPossible > 0 ? totalSnpsFound / totalSnpsPossible : 0;

    // Normalize scores for radar chart (0-1)
    const radarData = Object.values(systems).map(sys => ({
      axis: sys.shortLabel,
      value: sys.score, // 0-1
      fullLabel: sys.label,
      color: sys.color
    }));

    return {
      systems,
      radarData,
      overallConfidence: this.determineConfidence(coverage),
      coverage,
      totalSnpsAnalyzed: totalSnpsFound,
      // Derive a "Archetype" just for fun/summary
      archetype: this.deriveArchetype(systems)
    };
  }

  analyzeSystem(key, data, matchMap) {
    let weightedScoreSum = 0;
    let totalMaxWeight = 0;
    let snpsFound = 0;
    const details = [];

    for (const snp of data.snps) {
      const match = matchMap.get(snp.rsid.toLowerCase());
      if (match) {
        snpsFound++;
        const genotype = match.userGenotype || match.genotype || '';
        const traitAlleleCount = this.countAlleles(genotype, snp.traitAllele);

        // Algorithm V2: Weighted Average Deviation
        // 0 copies -> -1 (Opposite direction)
        // 1 copy   ->  0 (Neutral/Intermediate)
        // 2 copies -> +1 (Trait direction)

        // Calculate raw deviation (-1 to 1) based on allele count
        let deviation = traitAlleleCount - 1;

        // Flip if the trait allele is meant to push towards 0 (Left/Down)
        if (snp.direction === 0) {
          deviation = -deviation;
        }

        weightedScoreSum += (deviation * snp.weight);
        totalMaxWeight += snp.weight;

        details.push({
          rsid: snp.rsid,
          gene: snp.gene,
          genotype,
          effect: snp.effect,
          traitAllele: snp.traitAllele,
          // userImpact logic for UI display
          userImpact: deviation > 0 ? 'Increases' : (deviation < 0 ? 'Decreases' : 'Neutral'),
          reference: snp.reference
        });
      }
    }

    // Normalize result to 0-1 range
    // weightedScoreSum is between [-totalMaxWeight, +totalMaxWeight]
    // We map this to [0, 1]
    let finalScore = 0.5;
    if (totalMaxWeight > 0) {
      const normalizedDeviation = weightedScoreSum / totalMaxWeight; // -1 to 1
      finalScore = (normalizedDeviation + 1) / 2; // 0 to 1
    }

    return {
      key,
      label: data.label,
      shortLabel: data.shortLabel,
      description: data.description,
      polarLabels: data.polarLabels,
      color: data.color,
      score: Math.max(0.05, Math.min(0.95, finalScore)), // Clamp slightly to prevent edge clipping
      snpsFound,
      totalSnps: data.snps.length,
      details
    };
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

  deriveArchetype(systems) {
    const dopamine = systems.dopamine.score;
    const serotonin = systems.serotonin.score;
    const oxytocin = systems.oxytocin.score;
    const plasticity = systems.plasticity.score;

    // Define thresholds - slightly relaxed to catch "leanings"
    const isHigh = (score) => score >= 0.55;
    const isLow = (score) => score <= 0.45;

    // 1. The Architect (High Dopamine Retention + High Serotonin/Stable)
    // Deep focus, stable mood, systemic thinker.
    if (dopamine > 0.6 && serotonin > 0.5) return {
      name: 'The Architect',
      description: 'Defined by high dopamine retention and serotonin stability. You likely excel at deep, systemic modeling and long-term strategy.'
    };

    // 2. The Sentinel (High Dopamine Retention + Low Serotonin/Sensitive)
    // Alert, focused, but chemically sensitive. Vigilant.
    if (dopamine > 0.6 && serotonin <= 0.5) return {
      name: 'The Sentinel',
      description: 'High dopamine retention combined with high sensitivity. You are likely vigilant, detail-oriented, and deeply attuned to risks.'
    };

    // 3. The Explorer (Low Dopamine/Rapid Clearance + High Plasticity)
    // Seeks novelty (Dopamine low), highly adaptive.
    if (dopamine < 0.4) return {
      name: 'The Explorer',
      description: 'Rapid dopamine clearance drives a need for novelty and exploration. You likely thrive in fast-paced, changing environments.'
    };

    // 4. The Diplomat (High Oxytocin)
    if (oxytocin > 0.6) return {
      name: 'The Diplomat',
      description: 'Your profile is dominated by high oxytocinergic tone, suggesting natural empathy, social bonding, and a community-first mindset.'
    };

    // 5. The Operator (Balanced/Action oriented)
    if (dopamine <= 0.6 && dopamine >= 0.4 && serotonin < 0.5) return {
      name: 'The Operator',
      description: 'Action-oriented and chemically reactive. You prioritize immediate feedback and tangible results.'
    };

    // Fallback
    return {
      name: 'The Balancer',
      description: 'Your neurochemistry shows a striking equilibrium. You likely adapt your cognitive style to the needs of the moment rather than having a fixed default.'
    };
  }
}

export default EmotionalAnalyzer;
