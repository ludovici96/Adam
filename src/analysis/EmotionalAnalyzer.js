/**
 * EmotionalAnalyzer - Maps SNPs to "Bio-Essences" (Neurochemistry)
 * V5: Identity-First Architecture (Titles & Text)
 */

const NEUROCHEMISTRY_DATABASE = {
  dopamine: {
    label: 'The Spark',
    shortLabel: 'Spark',
    chemical: 'Dopamine',
    description: 'Your inner fire. Governs drive, focus, and how you process reward.',
    color: '#F43F5E', // Rose/Red (Passion/Fire)
    polarLabels: ['Rapid Clearance', 'High Retention'],
    vibes: {
      high: {
        title: "The Deep Diver",
        text: "Your brain holds onto dopamine, meaning when you find something you love, you can focus on it for hours (or days). You burn hot and bright, but you may struggle to let things go or switch gears quickly."
      },
      low: {
        title: "The Fire Starter",
        text: "Your brain clears dopamine fast, making you incredibly adaptable and hungry for the new. You thrive on novelty and change, but you might feel a constant 'itch' if forced into routine."
      }
    },
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
    vibes: {
      high: {
        title: "The Anchor",
        text: "Storms may rage around you, but you remain grounded. It takes a lot to rattle your cage, giving you a steady, calming presence that others rely on."
      },
      low: {
        title: "The Orchid",
        text: "You feel every shift in the atmosphere. Your sensitivity is a superpower that allows you to read the room instantly, but it means you need to protect your energy from harsh environments."
      }
    },
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
    vibes: {
      high: {
        title: "The Open Heart",
        text: "You dissolve barriers easily and make others feel seen and safe instantly. Connection is your default state; you likely feel 'at home' with people quickly."
      },
      low: {
        title: "The Sacred Circle",
        text: "You don't let just anyone in. Your trust is earned slowly, but once someone crosses the moat, your loyalty is absolute and unshakeable."
      }
    },
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
    vibes: {
      high: {
        title: "The Stream",
        text: "You adapt instantly to new information and flow around obstacles. You learn through intuition and quick associations rather than rigid study."
      },
      low: {
        title: "The Foundation",
        text: "You build mastery like a cathedral—block by block. You may not change direction quickly, but what you learn is etched in stone and lasts forever."
      }
    },
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

    const radarData = Object.values(systems).map(sys => ({
      axis: sys.shortLabel,
      value: sys.score,
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

        let deviation = traitAlleleCount - 1;
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

    let finalScore = 0.5;
    if (totalMaxWeight > 0) {
      const normalizedDeviation = weightedScoreSum / totalMaxWeight;
      finalScore = (normalizedDeviation + 1) / 2;
    }

    // New: Select the rich object {title, text}
    const manifest = finalScore > 0.5 ? data.vibes.high : data.vibes.low;

    return {
      key,
      label: data.label,
      shortLabel: data.shortLabel,
      chemical: data.chemical,
      description: data.description,
      manifestation: manifest, // Contains {title, text}
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

    // Helper to generate Rich Insight Objects
    const createInsight = (type, title, science, manifestation, hack) => ({
      type, // 'superpower', 'shadow', 'love'
      title,
      science,
      manifestation,
      hack
    });

    // Love Styles - SAME AS V3
    const getLoveStyle = () => {
      if (oxytocin > 0.6 && serotonin > 0.6) {
        return createInsight('love', 'The Secure Harbor',
          'High Oxytocin (Bonding) + High Serotonin (Stability) creates a chemical foundation for deep, drama-free attachment.',
          'You offer consistency and warmth. Partners feel instantly safe with you, but you may risk staying in "comfortable" mismatches too long.',
          'Practice "Active Disruption"—occasionally introduce novelty or challenge into relationships to keep the "Spark" alive alongside the safety.');
      }
      if (oxytocin > 0.6 && serotonin < 0.4) {
        return createInsight('love', 'The Passionate Soul',
          'High Oxytocin (Bonding) + Reduced Serotonin (Sensitivity) creates a "high-gain" emotional receiver.',
          'You love deeply and intensely. You merge quickly with others, but may struggle with emotional boundaries or taking on a partner\'s mood.',
          'Establish "Aloneness Rituals"—scheduled time to disconnect and reset your own emotional baseline separate from your partner.');
      }
      if (oxytocin < 0.4 && serotonin > 0.6) {
        return createInsight('love', 'The Independent Rock',
          'Selective Oxytocin receptors + High Serotonin resilience creates a devoted but autonomous bonding style.',
          'You show love through loyalty and acts of service, not constant reassurance. You need space to recharge and respect partners who have their own lives.',
          'Use "Verbal Bridges"—explicitly state your affection ("I love you") even when you assume your actions already show it.');
      }
      return createInsight('love', 'The Selective Devotee',
        'Your chemistry favors quality over quantity. You do not bond with just anyone.',
        'You are slow to warm up, but fiercely loyal once trust is earned. You abhor superficial connections.',
        'Practice "Micro-Vulnerability"—share one small, unpolished thought early in dating to signal openness without feeling exposed.');
    };

    // 1. The Architect
    if (dopamine > 0.6 && serotonin > 0.5) return {
      name: 'The Architect',
      description: 'You see the systems that others miss. Your "Spark" (Dopamine) is high-retention, giving you incredible focus, while your "Harmony" (Serotonin) shields you from distraction.',
      superpower: createInsight('superpower', 'Deep Vision',
        'High Dopamine Retention (COMT Met) allows you to hold complex abstract models in your mind for hours.',
        'You can "see around corners" and plan long-term strategies that others find exhausting to contemplate.',
        'Protect your "Deep Work" blocks. Your chemistry is expensive to boot up but powerful once running—don\'t let notifications interrupt the flow.'),
      shadow: createInsight('shadow', 'Perfectionism',
        'Your biology resists "task switching". Once focused, shifting gears feels physically painful.',
        'You may delay starting if you can\'t do it perfectly, or get stuck optimizing details that don\'t matter (Analysis Paralysis).',
        'Use the "B-Minus Rule"—deliberately aim for a B- grade on low-stakes tasks to train your brain to release.'),
      loveStyle: getLoveStyle()
    };

    // 2. The Sentinel
    if (dopamine > 0.6 && serotonin <= 0.5) return {
      name: 'The Sentinel',
      description: 'Nothing gets past you. You have the focus of a warrior, but the sensitivity of an artist. Since your "Harmony" is lower, you feel deeply, but your "Spark" keeps you sharp.',
      superpower: createInsight('superpower', 'Intuitive Radar',
        'High Dopamine (Focus) + High Sensitivity (HTR2A/Serotonin) creates a hyper-aware nervous system.',
        'You notice micro-expressions, tone shifts, and risks before anyone else. You are the "Canary in the Coal Mine".',
        'Trust your gut—it\'s not magic, it\'s biological pattern recognition. When you feel "off", stop and investigate why.'),
      shadow: createInsight('shadow', 'Over-Analysis',
        'Your brain physically struggles to "dump" dopamine/thought-loops, and your sensitivity amplifies the emotional weight of those loops.',
        'You replay conversations at night ("What did they mean by that?") and struggle to switch off work mode.',
        'Trigger "Physiological Sighs" (double inhale, long exhale) to manually activate the Vagus nerve and dump cortisol when looping starts.'),
      loveStyle: getLoveStyle()
    };

    // 3. The Explorer
    if (dopamine < 0.4) return {
      name: 'The Explorer',
      description: 'You are fueled by the new. Your "Spark" clears rapidly, meaning you are constantly seeking fresh inspiration. You thrive in "Flow" and movement.',
      superpower: createInsight('superpower', 'Unstoppable Curiosity',
        'Rapid Dopamine Clearance (COMT Val) means your brain is hungry for new inputs. You are functionally immune to "sunk cost fallacy".',
        'You adapt faster than anyone. While others are mourning the old way, you have already mapped the new territory.',
        'Structure your life around "Sprints", not "Marathons". Your biology rewards short, intense bursts of novelty.'),
      shadow: createInsight('shadow', 'Restlessness',
        'Your baseline dopamine drops quickly, creating a "chemical itch" if stuck in routine.',
        'You may abandon projects at 90% completion or struggle with "Shiny Object Syndrome".',
        'Pair "Boring" tasks with "Novelty" layers—listen to a new podcast while doing spreadsheets to keep the dopamine baseline up.'),
      loveStyle: getLoveStyle()
    };

    // 4. The Diplomat
    if (oxytocin > 0.6) return {
      name: 'The Diplomat',
      description: 'Your "Bond" pathway is wide open. You feel what others feel before they even speak. You are the heart of your circle.',
      superpower: createInsight('superpower', 'Emotional Telepathy',
        'High Oxytocin Receptor density (OXTR GG) gives you biological access to others\' emotional states.',
        'You can de-escalate conflicts and build trust instantly. You make people feel "seen" without trying.',
        'Use your gift intentionally—lead with vulnerability. Your biology creates a "safety field" that allows others to open up.'),
      shadow: createInsight('shadow', 'The Sponge Effect',
        'Your mirror neurons are permanently "on". You physically absorb the stress and sadness of those around you.',
        'You may feel exhausted after social events, confusing others\' emotions with your own.',
        'Physical water rituals (showers, hand washing) can serve as a psychological "reset" to wash off foreign emotions.'),
      loveStyle: getLoveStyle()
    };

    // 5. The Alchemist
    if (dopamine <= 0.6 && dopamine >= 0.4 && serotonin < 0.5) return {
      name: 'The Alchemist',
      description: 'You transmute intensity into action. You feel things powerfully but have the drive to do something about it.',
      superpower: createInsight('superpower', 'Kinetic Transformation',
        'A reactive serotonin system combined with balanced dopamine gives you "Crisis Competence".',
        'You don\'t freeze; you move. You are excellent at turning emotional energy into physical or creative output.',
        'Channel intensity into movement. Your body is your processing unit—dance, run, or build when you feel overwhelmed.'),
      shadow: createInsight('shadow', 'Intensity Spikes',
        'Your system has a "hair-trigger" for arousal. You can go from 0 to 100 instantly.',
        'You may be perceived as "too much" or reactive by slower-paced types.',
        'Practice "The Pause". Count to 5 before responding. Your initial chemical reaction is often wrong; your second thought is brilliant.'),
      loveStyle: getLoveStyle()
    };

    // Fallback: The Weaver
    return {
      name: 'The Weaver',
      description: 'You hold the center. Your chemistry is balanced, allowing you to weave together different perspectives and adapt to any energy in the room.',
      superpower: createInsight('superpower', 'Universal Translation',
        'Balanced neurochemistry means you speak everyone\'s language. You are not trapped in one mode.',
        'You can mediate between the "Sentinels" and "Explorers" because you understand both biological languages slightly.',
        'Lean into leadership roles that require synthesis. You are the glue that holds diverse teams together.'),
      shadow: createInsight('shadow', 'Chameleon Syndrome',
        'Because you adapt so well, you may lose track of your own strong preferences.',
        'You might agree to things just to keep the peace, suppressing your own needs until you resent it.',
        'Practice "Artificial Stiffening"—deliberately take a hard stance on a low-stakes issue (like where to eat) just to exercise your preference muscle.'),
      loveStyle: getLoveStyle()
    };
  }
}

export default EmotionalAnalyzer;
