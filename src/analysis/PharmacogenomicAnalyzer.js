/**
 * PharmacogenomicAnalyzer
 * Maps SNPs to metabolic speeds and simulates neurochemical shifts.
 */

export const PHARMA_DATABASE = {
    caffeine: {
        label: 'Caffeine',
        icon: '☕',
        gene: 'CYP1A2',
        description: 'The world\'s most popular psychoactive.',
        snps: [
            {
                rsid: 'rs762551',
                gene: 'CYP1A2',
                alleles: {
                    'A': { effect: 'Fast', weight: 1 },
                    'C': { effect: 'Slow', weight: -1 }
                },
                reference: 'A allele carriers are "Fast Metabolizers" (rapid clearance). C allele carriers are "Slow Metabolizers" (prolonged effect, higher anxiety risk).'
            }
        ],
        impactVectors: {
            Fast: {
                dopamine: 0.2, // Boosts focus
                serotonin: -0.1, // Slight edge
                oxytocin: 0,
                plasticity: 0.1,
                insight: "Fast Metabolizer: Caffeine gives you a clean boost with minimal jitters. It clears your system quickly, so it won't wreck your sleep if taken before 2 PM."
            },
            Slow: {
                dopamine: 0.2, // Boosts focus
                serotonin: -0.4, // SPRIKES Anxiety significantly
                oxytocin: -0.1, // Slightly less social
                plasticity: 0,
                insight: "Slow Metabolizer (Risk): Caffeine lingers in your system for 10+ hours. While it boosts focus, it likely spikes anxiety and disrupts deep sleep. Use caution."
            }
        }
    },
    cannabis: {
        label: 'Cannabis',
        icon: '🌿',
        gene: 'FAAH / AKT1',
        description: 'THC processing and psychoactive risk.',
        snps: [
            {
                rsid: 'rs324420',
                gene: 'FAAH',
                alleles: {
                    'C': { effect: 'Normal', weight: 0 },
                    'A': { effect: 'Risk', weight: -1 } // The "Craving" / Anxious allele
                },
                reference: 'A allele reduced FAAH activity, linked to higher anxiety/dependence risk.'
            },
            {
                rsid: 'rs2494732',
                gene: 'AKT1',
                alleles: {
                    'C': { effect: 'Risk', weight: -1 }, // Psychosis risk
                    'T': { effect: 'Normal', weight: 0 }
                },
                reference: 'C/C genotype associated with higher risk of paranoia/psychosis from THC.'
            }
        ],
        impactVectors: {
            Normal: {
                dopamine: 0.1, // Mild euphoria
                serotonin: 0.2, // Relaxation
                oxytocin: 0.1,
                plasticity: 0.3, // Enhanced divergent thinking
                insight: "Standard Response: You likely experience the typical relaxation and sensory enhancement. Moderate use is unlikely to trigger severe adverse effects."
            },
            Risk: {
                dopamine: -0.2, // Scattered focus
                serotonin: -0.5, // PARANOIA / Anxiety
                oxytocin: -0.2, // Social withdrawal
                plasticity: 0.4, // Too much divergant thinking (confusion)
                insight: "High Risk (Paranoia): Your genetics (AKT1/FAAH) suggest a predisposition to THC-induced anxiety or paranoia. The 'Chill' drug is likely the opposite for you."
            }
        }
    },
    magnesium: {
        label: 'Magnesium',
        icon: '💧',
        gene: 'TRPM6',
        description: 'The "Chill" Mineral.',
        snps: [
            {
                rsid: 'rs3740449', // Placeholder / Proxy for absorption efficiency
                gene: 'TRPM6',
                alleles: {
                    'G': { effect: 'Normal', weight: 0 },
                    'A': { effect: 'Low', weight: -1 }
                },
                reference: 'Variations affect Magnesium absorption efficiency.'
            }
        ],
        impactVectors: {
            Normal: {
                dopamine: 0,
                serotonin: 0.15, // Mild harmony boost
                oxytocin: 0,
                plasticity: 0,
                insight: "Optimization: Magnesium supports your baseline harmony. Useful for buffering stress."
            },
            Low: {
                dopamine: 0,
                serotonin: 0.3, // HUGE benefit because they are deficient
                oxytocin: 0.1,
                plasticity: 0.1,
                insight: "Critical Optimization: You likely absorb Magnesium poorly. Supplementation could drastically improve your stress resilience (Harmony) and sleep quality."
            }
        }
    },
    alcohol: {
        label: 'Alcohol',
        icon: '🍷',
        gene: 'ADH1B',
        description: 'Social lubricant or depressant?',
        snps: [
            {
                rsid: 'rs1229984',
                gene: 'ADH1B',
                alleles: {
                    'G': { effect: 'Normal', weight: 0 },
                    'A': { effect: 'Fast', weight: 1 } // The "Flush" variant (protective against alcoholism, but unpleasant)
                },
                reference: 'A allele converts alcohol to acetaldehyde rapidly (Flush reaction).'
            }
        ],
        impactVectors: {
            Normal: {
                dopamine: 0.1,
                serotonin: 0.1, // Temporary boost
                oxytocin: 0.3, // "Liquid Courage"
                plasticity: -0.2, // Brain fog
                insight: "Social Lubricant: You metabolize alcohol normally. It boosts social bonding (Oxytocin) but reduces cognitive sharpness."
            },
            Fast: {
                dopamine: -0.1,
                serotonin: -0.3, // Sick/Anxious
                oxytocin: -0.1,
                plasticity: -0.3,
                insight: "The Flush: You convert alcohol to toxins closely. Drinking likely makes you feel flushed/nauseous (a 'natural antabuse') rather than euphoric."
            }
        }
    }
};

export class PharmacogenomicAnalyzer {
    constructor() {
        this.database = PHARMA_DATABASE;
    }

    analyze(matches) {
        if (!matches || matches.length === 0) return null;

        const matchMap = new Map();
        matches.forEach(m => {
            const rsid = (m.rsid || '').toLowerCase();
            if (rsid) matchMap.set(rsid, m);
        });

        const results = {};

        for (const [key, substance] of Object.entries(this.database)) {
            let score = 0;
            let relevantSnps = 0;

            substance.snps.forEach(snp => {
                const match = matchMap.get(snp.rsid.toLowerCase());
                if (match) {
                    relevantSnps++;
                    const genotype = (match.userGenotype || match.genotype || '').toUpperCase();
                    // Check for risk alleles
                    // Simplified logic: If any allele matches a non-Zero weight definition
                    for (const [allele, def] of Object.entries(snp.alleles)) {
                        if (genotype.includes(allele)) {
                            score += def.weight;
                        }
                    }
                }
            });

            // Determine Profile
            let profile = 'Normal';
            if (key === 'caffeine') profile = score < 0 ? 'Slow' : 'Fast'; // Default to Fast if 0? Actually usually Normal/Fast are lumped. Let's say <0 is Slow.
            if (key === 'cannabis') profile = score < 0 ? 'Risk' : 'Normal';
            if (key === 'alcohol') profile = score > 0 ? 'Fast' : 'Normal'; // ADH1B Fast is the anomaly
            if (key === 'magnesium') profile = score < 0 ? 'Low' : 'Normal';

            results[key] = {
                profile,
                impact: substance.impactVectors[profile]
            };
        }

        return results;
    }

    /**
     * Generates the "Ghost" Radar Data
     */
    simulate(baseRadarData, simulationKey, pharmaResults) {
        if (!baseRadarData || !simulationKey || !pharmaResults || !pharmaResults[simulationKey]) {
            return null;
        }

        const impact = pharmaResults[simulationKey].impact;
        const impactInsight = impact.insight;

        // Apply Deltas to Base Data
        // baseRadarData is array: [{ axis: 'Spark', value: 0.8, ... }, ...]
        // We need to map 'Spark' -> 'dopamine', 'Harmony' -> 'serotonin', etc.
        // Or relying on the order/keys from EmotionalAnalyzer.

        const keyMap = {
            'Spark': 'dopamine',
            'Harmony': 'serotonin',
            'Bond': 'oxytocin',
            'Flow': 'plasticity'
        };

        const ghostData = baseRadarData.map(item => {
            const chemicalKey = keyMap[item.axis];
            if (!chemicalKey) return item;

            const delta = impact[chemicalKey] || 0;
            let newValue = item.value + delta;

            // Clamp 0-1
            newValue = Math.max(0.1, Math.min(1.0, newValue));

            return {
                ...item,
                value: newValue,
                originalValue: item.value,
                isGhost: true
            };
        });

        return {
            ghostData,
            insight: impactInsight,
            profile: pharmaResults[simulationKey].profile
        };
    }
}

export default PharmacogenomicAnalyzer;
