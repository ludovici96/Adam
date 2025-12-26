/**
 * EmotionalAnalyzer - Maps SNPs to "Bio-Essences" (Neurochemistry)
 *
 * Essences:
 * - Spark (Dopamine): Drive, Focus, Reward - The Fire
 * - Harmony (Serotonin): Mood Stability, Resilience - The Earth
 * - Bond (Oxytocin): Connection, Empathy - The Water
 * - Flow (Plasticity): Adaptability, Growth - The Air
 */

const NEUROCHEMISTRY_DATABASE = {
  dopamine: {
    label: 'The Spark',
    shortLabel: 'Spark',
    chemical: 'Dopamine',
    description: 'Your inner fire. Governs drive, focus, and how you process reward.',
    color: '#F43F5E', // Rose/Red (Passion/Fire)
    polarLabels: ['Rapid Clearance', 'High Retention'],
    snps: [
      {
        rsid: 'rs4680',
        gene: 'COMT',
        traitAllele: 'A', // Met
        effect: 'Higher Dopamine Levels',
        weight: 1.5,
        direction: 1,
        reference: 'Met allele leads to "High Retention" (deep focus), while Val leads to "Rapid Clearance" (resilience under pressure).'
      },
      {
        rsid: 'rs1800497',
        gene: 'DRD2',
        traitAllele: 'A', // A1
        effect: 'Reduced Receptor Density',
        weight: 1.0,
        direction: 0,
        reference: 'A1 allele associated with seeking intense experiences to feel the "Spark".'
      },
      {
        rsid: 'rs1800955',
        gene: 'DRD4',
        traitAllele: 'T', // -521 T
        effect: 'Lower Transcriptional Activity',
        weight: 0.8,
        direction: 0,
        reference: 'Linked to novelty seeking and exploratory drive.'
      }
    ]
  },
  serotonin: {
    label: 'Harmony',
    shortLabel: 'Harmony',
    chemical: 'Serotonin',
    description: 'Your emotional anchor. Governs mood stability and sensitivity to the environment.',
    color: '#F59E0B', // Amber/Gold (Warmth/Earth)
    polarLabels: ['Resilient', 'Sensitive'],
    snps: [
      {
        rsid: 'rs25531',
        gene: '5-HTTLPR', // SLC6A4
        traitAllele: 'A', // Long/A
        effect: 'Higher Transporter Expression',
        weight: 1.2,
        direction: 0,
        reference: 'Long allele linked to emotional resilience and "thick skin".'
      },
      {
        rsid: 'rs6313',
        gene: 'HTR2A',
        traitAllele: 'T',
        effect: 'Altered Receptor Signaling',
        weight: 0.8,
        direction: 1,
        reference: 'Associated with heightened emotional sensitivity and deep feeling.'
      }
    ]
  },
  oxytocin: {
    label: 'The Bond',
    shortLabel: 'Bond',
    chemical: 'Oxytocin',
    description: 'Your heart connection. Governs empathy, trust, and how you bond with others.',
    color: '#D946EF', // Fuchsia/Magenta (Love/Heart)
    polarLabels: ['Selective', 'Empathic'],
    snps: [
      {
        rsid: 'rs53576',
        gene: 'OXTR',
        traitAllele: 'G',
        effect: 'Higher Receptor Sensitivity',
        weight: 1.5,
        direction: 1,
        reference: 'GG genotype ("The Empath Gene") is strongly associated with intuitive social bonding.'
      },
      {
        rsid: 'rs2254298',
        gene: 'OXTR',
        traitAllele: 'A',
        effect: 'Receptor Variation',
        weight: 1.0,
        direction: 1,
        reference: 'Influences social memory and attachment style.'
      }
    ]
  },
  plasticity: {
    label: 'Flow',
    shortLabel: 'Flow',
    chemical: 'Plasticity',
    description: 'Your capacity for growth. Governs learning, memory, and adaptability.',
    color: '#10B981', // Emerald/Jade (Growth/Nature)
    polarLabels: ['Structured', 'Fluid'],
    snps: [
      {
        rsid: 'rs6265',
        gene: 'BDNF',
        traitAllele: 'A', // Met
        effect: 'Reduced Secretion',
        weight: 1.2,
        direction: 0,
        reference: 'Met allele favors structured, expert-level mastery over rapid adaptation.'
      },
      {
        rsid: 'rs17070145',
        gene: 'KIBRA',
        traitAllele: 'T',
        effect: 'Enhanced Memory',
        weight: 0.8,
        direction: 1,
        reference: 'Associated with cognitive flexibility and quick learning ("Fluid Mind").'
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
          userImpact: deviation > 0 ? 'Increases' : (deviation < 0 ? 'Decreases' : 'Neutral'),
          reference: snp.reference
        });
      }
    }

    // Normalize result to 0-1 range
    let finalScore = 0.5;
    if (totalMaxWeight > 0) {
      const normalizedDeviation = weightedScoreSum / totalMaxWeight;
      finalScore = (normalizedDeviation + 1) / 2;
    }

    return {
      key,
      label: data.label,
      shortLabel: data.shortLabel,
      chemical: data.chemical,
      description: data.description,
      polarLabels: data.polarLabels,
      color: data.color,
      score: Math.max(0.05, Math.min(0.95, finalScore)),
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
    const dopamine = systems.dopamine ? systems.dopamine.score : 0.5;
    const serotonin = systems.serotonin ? systems.serotonin.score : 0.5;
    const oxytocin = systems.oxytocin ? systems.oxytocin.score : 0.5;

    // Helper for "Love Language"
    // High Oxytocin -> "Deep Bonding"
    // Low Oxytocin -> "Selective/Loyal"
    // High Serotonin -> "Steady/Rock"
    // Low Serotonin -> "Passionate/Intense"
    const getLoveStyle = () => {
      if (oxytocin > 0.6 && serotonin > 0.6) return "The Secure Harbor (Deep & Steady)";
      if (oxytocin > 0.6 && serotonin < 0.4) return "The Passionate Soul (Intense & Bonding)";
      if (oxytocin < 0.4 && serotonin > 0.6) return "The Independent Rock (Loyal & Space-Giving)";
      return "The Selective Devotee (Quality over Quantity)";
    };

    // 1. The Architect (High Dopamine, High Serotonin)
    // Deep focus, stable mood.
    if (dopamine > 0.6 && serotonin > 0.5) return {
      name: 'The Architect',
      superpower: 'Deep Vision',
      shadow: 'Perfectionism',
      loveStyle: getLoveStyle(),
      description: 'You see the systems that others miss. Your "Spark" (Dopamine) is high-retention, giving you incredible focus, while your "Harmony" (Serotonin) shields you from distraction.'
    };

    // 2. The Sentinel (High Dopamine, Low Serotonin)
    // Focused but sensitive. Vigilant.
    if (dopamine > 0.6 && serotonin <= 0.5) return {
      name: 'The Sentinel',
      superpower: 'Intuitive Radar',
      shadow: 'Over-Analysis',
      loveStyle: getLoveStyle(),
      description: 'Nothing gets past you. You have the focus of a warrior, but the sensitivity of an artist. Since your "Harmony" is lower, you feel deeply, but your "Spark" keeps you sharp.'
    };

    // 3. The Explorer (Low Dopamine)
    // Seeks novelty, adaptive.
    if (dopamine < 0.4) return {
      name: 'The Explorer',
      superpower: 'Unstoppable Curiosity',
      shadow: 'Restlessness',
      loveStyle: getLoveStyle(),
      description: 'You are fueled by the new. Your "Spark" clears rapidly, meaning you are constantly seeking fresh inspiration. You thrive in "Flow" and movement.'
    };

    // 4. The Diplomat (High Oxytocin)
    if (oxytocin > 0.6) return {
      name: 'The Diplomat',
      superpower: 'Emotional Telepathy',
      shadow: 'Taking on Others\' Pain',
      loveStyle: getLoveStyle(),
      description: 'Your "Bond" pathway is wide open. You feel what others feel before they even speak. You are the heart of your circle.'
    };

    // 5. The Operator (Balanced Dopamine, Low Serotonin)
    if (dopamine <= 0.6 && dopamine >= 0.4 && serotonin < 0.5) return {
      name: 'The Alchemist', // Renamed from Operator for female audience
      superpower: 'Transformation',
      shadow: 'Intensity',
      loveStyle: getLoveStyle(),
      description: 'You transmute intensity into action. You feel things powerfully but have the drive to do something about it.'
    };

    // Fallback
    return {
      name: 'The Weaver', // Renamed from Balancer
      superpower: 'Adaptability',
      shadow: 'Indecision',
      loveStyle: getLoveStyle(),
      description: 'You hold the center. Your chemistry is balanced, allowing you to weave together different perspectives and adapt to any energy in the room.'
    };
  }
}

export default EmotionalAnalyzer;
