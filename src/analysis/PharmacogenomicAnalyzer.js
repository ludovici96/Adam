/**
 * PharmacogenomicAnalyzer
 * Maps SNPs to metabolic speeds and simulates neurochemical shifts.
 * Now includes Systemic Modulators (Ghost State) and Dosage Logic.
 */

export const PHARMA_DATABASE = {
    // --- STIMULANTS ---
    // --- STIMULANTS ---
    caffeine: {
        label: 'Caffeine',
        icon: '☕',
        gene: 'CYP1A2', // Primary Hero
        description: 'Kinetic Simulation: Clearance vs Sensitivity.',
        snps: [
            // --- METABOLISM (Clearance / k_el) ---
            {
                rsid: 'rs762551',
                gene: 'CYP1A2',
                alleles: {
                    'A': { effect: 'Fast', weight: 1.5, type: 'Metabolism' }, // 1.5x Clearance
                    'C': { effect: 'Slow', weight: 0.6, type: 'Metabolism' }  // Reduced clearance
                },
                reference: 'CYP1A2*1F (A) increases inducibility. C allele = Slow Metabolism (Risk).'
            },
            {
                rsid: 'rs2069514',
                gene: 'CYP1A2',
                alleles: {
                    'A': { effect: 'Slow', weight: 0.7, type: 'Metabolism' }, // ~30% reduction
                    'G': { effect: 'Normal', weight: 1.0, type: 'Metabolism' }
                },
                reference: 'CYP1A2*1C promoter variant. A allele reduces clearance.'
            },
            {
                rsid: 'rs6968865',
                gene: 'AHR',
                alleles: {
                    'T': { effect: 'Fast', weight: 1.2, type: 'Metabolism' }, // Induces CYP1A2
                    'C': { effect: 'Normal', weight: 1.0, type: 'Metabolism' }
                },
                reference: 'AHR T-allele induces CYP1A2 expression -> Faster clearance.'
            },
            {
                rsid: 'rs1481012',
                gene: 'ABCG2',
                alleles: {
                    'A': { effect: 'Slow', weight: 0.8, type: 'Metabolism' }, // Reduced efflux
                    'G': { effect: 'Normal', weight: 1.0, type: 'Metabolism' }
                },
                reference: 'ABCG2 A-allele reduces metabolite efflux, increasing AUC.'
            },
            // --- RECEPTORS (Sensitivity / S_cns) ---
            {
                rsid: 'rs5751876',
                gene: 'ADORA2A',
                alleles: {
                    'T': { effect: 'Sensitive', weight: 1.5, type: 'Receptor' }, // High Anxiety
                    'C': { effect: 'Normal', weight: 1.0, type: 'Receptor' }
                },
                reference: 'TT genotype linked to significantly higher anxiety/panic scores.'
            },
            {
                rsid: 'rs2298383',
                gene: 'ADORA2A',
                alleles: {
                    'C': { effect: 'Sensitive', weight: 1.4, type: 'Receptor' },
                    'T': { effect: 'Normal', weight: 1.0, type: 'Receptor' }
                },
                reference: 'C-allele increases anxiety response (replicated).'
            },
            {
                rsid: 'rs1800497',
                gene: 'ANKK1/DRD2',
                alleles: {
                    'A': { effect: 'Sensitive', weight: 1.3, type: 'Receptor' }, // Taq1A A1 - reduced D2 receptor density
                    'G': { effect: 'Normal', weight: 1.0, type: 'Receptor' }     // Taq1A A2 - normal D2 density
                },
                reference: 'Taq1A (A1 allele) reduces DRD2 density by ~30%, increasing sensitivity to dopaminergic stimulation from caffeine.'
            }
        ]
    },
    nicotine: {
        label: 'Nicotine',
        icon: '🚬',
        gene: 'CYP2A6',
        description: 'Focus driver or addiction trap?',
        snps: [
            {
                rsid: 'rs1801272', // CYP2A6*2
                gene: 'CYP2A6',
                alleles: {
                    'A': { effect: 'Slow', weight: -1 }, // Slow metabolizer
                    'T': { effect: 'Normal', weight: 0 }
                },
                reference: 'Slow metabolizers smoke less but have higher steady-state levels.'
            },
            {
                rsid: 'rs16969968',
                gene: 'CHRNA5',
                alleles: {
                    'A': { effect: 'Risk', weight: -2 }, // "No Stop Button"
                    'G': { effect: 'Normal', weight: 0 }
                },
                reference: 'D398N variant (A) removes the "nausea/stop" signal, increasing addiction risk.'
            }
        ]
    },

    // --- DEPRESSANTS / RELAXANTS ---
    alcohol: {
        label: 'Alcohol',
        icon: '🍷',
        gene: 'ADH1B',
        description: 'Kinetic: Clearance vs. Opioid Reward.',
        snps: [
            {
                rsid: 'rs1229984',
                gene: 'ADH1B',
                alleles: {
                    'G': { effect: 'Normal', weight: 0 },
                    'A': { effect: 'Fast', weight: 1 } // Super-active (Flush)
                },
                reference: 'Fast ADH1B causes rapid accumulation of acetaldehyde (Toxicity).'
            },
            {
                rsid: 'rs671',
                gene: 'ALDH2',
                alleles: {
                    'A': { effect: 'Inactive', weight: -2 }, // The Flush
                    'G': { effect: 'Active', weight: 0 }
                },
                reference: 'Inactive ALDH2 cannot clear toxins. "Asian Flush" variant.'
            },
            {
                rsid: 'rs1799971',
                gene: 'OPRM1',
                alleles: {
                    'G': { effect: 'HighReward', weight: 2 }, // Massive Euphoria
                    'A': { effect: 'Normal', weight: 0 }
                },
                reference: 'G-carriers get 3x dopamine/endorphin spike from alcohol.'
            }
        ]
    },
    cannabis: {
        label: 'Cannabis',
        icon: '🌿',
        gene: 'CYP2C9',
        description: 'Bliss or Paranoia?',
        snps: [
            {
                rsid: 'rs1799853',
                gene: 'CYP2C9',
                alleles: {
                    'T': { effect: 'Slow', weight: -1, type: 'Metabolism' }, // *2
                    'C': { effect: 'Normal', weight: 0 }
                },
                reference: 'CYP2C9*2 reduces THC clearance by ~70%.'
            },
            {
                rsid: 'rs1057910',
                gene: 'CYP2C9',
                alleles: {
                    'C': { effect: 'Slow', weight: -1, type: 'Metabolism' }, // *3
                    'A': { effect: 'Normal', weight: 0 }
                },
                reference: 'CYP2C9*3 (Loss of Function). Extreme slow metabolism.'
            },
            {
                rsid: 'rs2494732',
                gene: 'AKT1',
                alleles: {
                    'C': { effect: 'PsychosisRisk', weight: -5 },
                    'T': { effect: 'Normal', weight: 0 }
                },
                reference: 'C/C genotype significantly increases risk of THC-induced psychosis.'
            },
            {
                rsid: 'rs324420',
                gene: 'FAAH',
                alleles: {
                    'A': { effect: 'Anxious', weight: 1 },
                    'C': { effect: 'Bliss', weight: 0 }
                },
                reference: 'A-allele carriers (Low FAAH stability) may rely more on cannabis for anxiety relief.'
            }
        ]
    },

    // --- FOOD / REWARD ---
    sugar: {
        label: 'Sugar/Carbs',
        icon: '🍩',
        gene: 'FTO',
        description: 'Metabolic fuel or inflammation?',
        snps: [
            {
                rsid: 'rs9939609',
                gene: 'FTO',
                alleles: {
                    'A': { effect: 'Hungry', weight: -1 }, // Low Satiety
                    'T': { effect: 'Normal', weight: 0 }
                },
                reference: 'A-allele carriers have reduced post-prandial ghrelin suppression.'
            },
            {
                rsid: 'rs7903146',
                gene: 'TCF7L2',
                alleles: {
                    'T': { effect: 'InsulinRisk', weight: -1 },
                    'C': { effect: 'Normal', weight: 0 }
                },
                reference: 'TCF7L2 variant linked to impaired insulin secretion and Type 2 Diabetes risk.'
            },
            {
                rsid: 'rs12033832',
                gene: 'TAS1R2',
                alleles: {
                    'G': { effect: 'SweetTooth', weight: -1 },
                    'A': { effect: 'Normal', weight: 0 }
                },
                reference: 'G-carriers show ~30% higher habitual sucrose intake (High Reward).'
            }
        ]
    },

    // --- SUPPLEMENTS ---
    magnesium: {
        label: 'Magnesium',
        icon: '⚡',
        gene: 'TRPM6',
        description: 'Essential mineral for plasticity and calm.',
        snps: [
            {
                rsid: 'rs887829', // TRPM6 related (Proxy)
                gene: 'TRPM6',
                alleles: {
                    'G': { effect: 'LowAbsorption', weight: -1 },
                    'A': { effect: 'Normal', weight: 0 }
                },
                reference: 'G-allele carriers may have lower inherent magnesium absorption efficiency.'
            }
        ]
    },

    // --- SYSTEMIC MODULATORS (The "Operating System") ---
    systemic: {
        label: 'Systemic',
        icon: '🧬',
        gene: 'COMT',
        description: 'Baseline Neurochemistry Modifiers',
        snps: [
            {
                rsid: 'rs4680',
                gene: 'COMT',
                alleles: {
                    'A': { effect: 'Met', weight: -1 }, // Slow (Worrier)
                    'G': { effect: 'Val', weight: 1 }   // Fast (Warrior)
                },
                reference: 'Val158Met. Met (A) = High Dopamine/Anxiety. Val (G) = Low Dopamine/Resilience.'
            },
            {
                rsid: 'rs1801133',
                gene: 'MTHFR',
                alleles: {
                    'T': { effect: 'LowMeth', weight: -1 },
                    'C': { effect: 'Normal', weight: 0 }
                },
                reference: 'C677T. T/T reduces methylation efficiency by ~70%.'
            },
            {
                rsid: 'rs6265',
                gene: 'BDNF',
                alleles: {
                    'A': { effect: 'Met', weight: -1 }, // Poor plasticity
                    'G': { effect: 'Val', weight: 0 }
                },
                reference: 'Val66Met. Met carriers have reduced activity-dependent BDNF secretion.'
            },
            {
                rsid: 'rs1360780',
                gene: 'FKBP5',
                alleles: {
                    'T': { effect: 'HighCortisol', weight: -2 },
                    'C': { effect: 'Normal', weight: 0 }
                },
                reference: 'T-allele impairs Cortisol feedback loop. Stress response is prolonged and recovery is slower.'
            },
            {
                rsid: 'rs429358',
                gene: 'APOE',
                alleles: {
                    'C': { effect: 'Inflammation', weight: -2 }, // e4
                    'T': { effect: 'Normal', weight: 0 } // e3
                },
                reference: 'APOE e4 (C) carrier. Reduced neuro-repair and higher inflammatory baseline.'
            },
            {
                rsid: 'rs_kcnq1_g179s', // G179S
                gene: 'KCNQ1',
                alleles: {
                    'S': { effect: 'LongQT', weight: -2 },
                    'G': { effect: 'Normal', weight: 0 }
                },
                reference: 'G179S variant associated with LQT1. Caffeine significantly prolongs QT interval in carriers.'
            },
            {
                rsid: 'rs1006737',
                gene: 'CACNA1C',
                alleles: {
                    'A': { effect: 'Excite', weight: -1 },
                    'G': { effect: 'Normal', weight: 0 }
                },
                reference: 'A-allele increases calcium channel signaling. Linked to higher mood lability/excitability.'
            },
            {
                rsid: 'rs53576',
                gene: 'OXTR',
                alleles: {
                    'A': { effect: 'LowBond', weight: -1 },
                    'G': { effect: 'Bond', weight: 1 }
                },
                reference: 'A-carriers (rs53576) show reduced stress-buffering from social support.'
            }
        ]
    }
};

export class PharmacogenomicAnalyzer {
    constructor() {
        this.database = PHARMA_DATABASE;
    }

    /**
     * Analyzes user DNA matches to build a "Pharma Profile"
     */
    analyze(matches) {
        if (!matches || matches.length === 0) return null;

        const matchMap = new Map();
        matches.forEach(m => {
            const rsid = (m.rsid || '').toLowerCase();
            if (rsid) matchMap.set(rsid, m);
        });

        const results = {};

        // 1. Module Analysis
        for (const [key, module] of Object.entries(this.database)) {
            let traits = [];
            let score = 0;

            module.snps.forEach(snp => {
                const match = matchMap.get(snp.rsid.toLowerCase());
                if (match) {
                    const genotype = (match.userGenotype || match.genotype || '').toUpperCase();
                    // Simple check: if genotype contains the effect allele
                    for (const [allele, def] of Object.entries(snp.alleles)) {
                        if (genotype.includes(allele)) {
                            // If homozygous for effect, double weight?
                            // Let's keep it simple: presence triggers effect logic
                            if (def.effect !== 'Normal') {
                                traits.push({
                                    gene: snp.gene,
                                    effect: def.effect,
                                    desc: snp.reference
                                });
                            }
                            score += def.weight;
                        }
                    }
                }
            });

            results[key] = {
                traits,
                score,
                profile: this.deriveProfile(key, score, traits, results.systemic)
            };
        }



        // 2. Synthesize High-Level Profiles
        // COMT Logic
        const comt = results.systemic?.traits.find(t => t.gene === 'COMT');
        results.profile = {
            comt: comt?.effect === 'Met' ? 'Worrier' : (comt?.effect === 'Val' ? 'Warrior' : 'Balanced'),
            methylation: results.systemic?.traits.some(t => t.gene === 'MTHFR' && t.effect === 'LowMeth') ? 'Impaired' : 'Normal',
            plasticity: results.systemic?.traits.some(t => t.gene === 'BDNF' && t.effect === 'Met') ? 'Rigid' : 'Plastic'
        };

        return results;
    }

    /**
     * Derive a 1-word profile string (Risk, Fast, Slow) for a specific module
     */
    deriveProfile(key, score, traits, systemic) {
        if (traits.length === 0 && (!systemic || key !== 'cannabis')) return 'Normal';

        // Priority Checks
        if (key === 'cannabis') {
            if (traits.some(t => t.effect === 'PsychosisRisk')) return 'Psychosis';
            // COMT Interaction (Val/Met both implicate risk contextually, but Val/Val is Warrior, Met/Met is Worrier)
            // Bio-hazard triggers on COMT presence. Let's align.
            if (systemic?.traits.some(t => t.gene === 'COMT')) return 'Psychosis';
            if (traits.some(t => t.effect === 'Slow')) return 'Slow';
        }
        if (key === 'alcohol') {
            if (traits.some(t => t.effect === 'Inactive')) return 'Flush';
            if (traits.some(t => t.effect === 'HighReward')) return 'HighReward';
            if (traits.some(t => t.effect === 'Fast')) return 'Active';
        }
        if (key === 'caffeine') {
            if (traits.some(t => t.effect === 'Slow')) return 'Slow';
            if (traits.some(t => t.effect === 'Fast')) return 'Fast';
        }
        if (key === 'nicotine') {
            if (traits.some(t => t.effect === 'Risk')) return 'Risk';
        }

        // Fallback to score
        if (score < -1) return 'Risk';
        if (score > 1) return 'Active';
        return 'Variant';
    }

    /**
     * THE GHOST ENGINE
     * Calculates the neurochemical shift based on Baseline + dosage + genetics.
     * 
     * @param {Array} baseRadarData - Current user radar [{axis: 'Dopamine', value: 0.5}, ...]
     * @param {Object} activeSubstances - { caffeine: 'High', alcohol: 2, cannabis: 'Micro' }
     * @param {Object} pharmaResults - Output from analyze()
     */
    calculateGhostState(baseRadarData, activeSubstances, pharmaResults) {
        if (!baseRadarData || !pharmaResults) return { ghostData: baseRadarData, insights: [] };

        // Deep copy base data
        let ghostData = baseRadarData.map(d => ({ ...d, originalValue: d.value, isGhost: true }));
        const insights = [];

        // Helper to modify axis
        const mod = (axis, amount) => {
            const idx = ghostData.findIndex(d => d.axis.toLowerCase().includes(axis.toLowerCase()) ||
                (axis === 'dopamine' && d.axis === 'Spark') ||
                (axis === 'serotonin' && d.axis === 'Harmony') ||
                (axis === 'oxytocin' && d.axis === 'Bond') ||
                (axis === 'gaba' && d.axis === 'Chill') || // Assuming 'Chill' is GABA/Relaxation
                (axis === 'cortisol' && d.axis === 'Stress')); // Assuming 'Stress' exists, or mapped
            if (idx >= 0) {
                ghostData[idx].value += amount;
            }
        };

        // --- 1. SYSTEMIC BASELINE MODIFIERS ---
        // COMT Met/Met (Worrier) -> Higher Baseline Dopamine, Lower Stress Threshold
        if (pharmaResults.profile.comt === 'Worrier') {
            // Already factored into baseline? Maybe. 
            // But in simulation, they react HARDER to stimulants.
        }

        // --- 2. SUBSTANCE LOOPS ---

        // CAFFEINE Logic (Kinetic Engine)
        if (activeSubstances.caffeine && activeSubstances.caffeine !== 'None') {
            const intensity = activeSubstances.caffeine === 'High' ? 1.5 : (activeSubstances.caffeine === 'Low' ? 0.5 : 1.0);
            const traits = pharmaResults.caffeine?.traits || [];

            // 1. Calculate Kinetic Modifiers
            let k_el = 1.0; // Elimination Constant (Metabolism)
            let S_cns = 1.0; // CNS Sensitivity (Receptors)

            traits.forEach(t => {
                // If weight is mapped directly to effect magnitude
                // We use the 'type' field we added to differentiation
                // Note: In analyze(), we only pushed genes with non-Normal types to traits.
                // We need to look up weight from database if strictly needed, or estimate based on effect labels.

                // Fallback heuristic if weight isn't passed clearly (we can refine analyze() later)
                if (t.gene === 'CYP1A2' || t.gene === 'AHR' || t.gene === 'ABCG2') {
                    if (t.effect === 'Fast') k_el *= 1.4;
                    if (t.effect === 'Slow') k_el *= 0.6;
                }

                if (t.gene === 'ADORA2A') {
                    if (t.effect === 'Sensitive') S_cns *= 1.5;
                }
            });

            // 2. Apply Effects
            // Dopamine: Driven by Peak Concentration (roughly similar, but fast metabolizers crash faster)
            // For this snapshot, we assume peak.
            mod('dopamine', 0.15 * intensity * S_cns); // Sensitivity boosts the "Hit"

            // Cortisol (Stress): Driven by AUC (Area Under Curve) -> Inversely proportional to k_el
            // Low k_el (Slow) = High AUC = High Cortisol Impact
            const auc_factor = 1.0 / k_el;
            mod('cortisol', 0.1 * intensity * auc_factor);

            // GABA (Anxiety): Driven by Sensitivity (S_cns)
            if (S_cns > 1.2) {
                mod('gaba', -0.2 * intensity * S_cns); // Jitters/Anxiety
                insights.push(`Your ADORA2A genotype suggests **High Receptor Sensitivity**. While caffeine blocks adenosine (sleepiness), your receptors over-fire in response, flipping the "fight or flight" switch. Expect jitters and anxiety to dominate over clean focus.`);
            }

            // Narrative Synthesis based on Kinetic Profile
            const halfLife = Math.round(5 / k_el); // Benchmark ~5hrs, adjusted by k_el

            // Time Calculator Helper
            const getActiveTime = (hl) => {
                const totalHours = 12 + hl;
                const h = totalHours % 24;
                const ampm = h < 12 ? 'AM' : 'PM';
                const dispH = h === 0 ? 12 : (h > 12 ? h - 12 : h);
                return `${dispH}:00 ${ampm}`;
            };

            if (k_el < 0.8) {
                insights.push(`**Metabolic Warning:** Your liver produces less CYP1A2 enzyme than average. Caffeine has an estimated **biological half-life of ${halfLife} hours** in your system (vs ~5h norm). A cup consumed at noon will still be ~50% active at **${getActiveTime(halfLife)}**, significantly spiking evening Cortisol and crushing deep sleep architecture.`);
            } else if (k_el > 1.2) {
                mod('plasticity', 0.1 * intensity); // Clean utility
                insights.push(`**Optimized Metabolism:** Your liver expresses high levels of CYP1A2. You clear caffeine rapidly (Half-life ~${halfLife} hours), allowing you to harness the dopamine boost for acute focus with minimal risk of insomnia or lingering anxiety.`);
            } else {
                insights.push(`**Standard Response:** Your metabolism clears caffeine at a normal rate (Half-life ~5 hours). Moderate dosage provides a stable dopamine lift, but avoid intake within 8 hours of sleep to preserve circadian rhythm.`);
            }
        }

        // ALCOHOL Logic (Kinetic Engine)
        if (activeSubstances.alcohol > 0) {
            const drinks = activeSubstances.alcohol;
            const traits = pharmaResults.alcohol?.traits || [];

            // 1. Kinetic Modifiers (Clearance & Toxicity)
            let k_el = 1.0; // Clearance (ADH)
            let toxicity_factor = 1.0; // Acetaldehyde buildup (ALDH2)
            let reward_sensitivity = 1.0; // OPRM1

            traits.forEach(t => {
                if (t.gene === 'ADH1B' && t.effect === 'Fast') k_el *= 1.5; // Rapid conversion to toxin
                if (t.gene === 'ALDH2' && t.effect === 'Inactive') {
                    k_el *= 0.8; // Slow clearance of toxin
                    toxicity_factor *= 3.0; // The Flush
                }
                if (t.gene === 'OPRM1' && t.effect === 'HighReward') reward_sensitivity *= 2.0;
            });

            // 2. Apply Effects
            mod('gaba', 0.1 * drinks * k_el); // Sedation (short lived if high k_el)
            mod('dopamine', 0.05 * drinks * reward_sensitivity); // Euphoria

            // Toxicity creates Cortisol spike (Hangover simulation)
            const hangover_risk = (drinks * toxicity_factor) / k_el;
            if (hangover_risk > 1.5) {
                mod('cortisol', 0.2 * hangover_risk);
                mod('serotonin', -0.1 * hangover_risk); // Depressive rebound
            }

            // Narrative
            if (toxicity_factor > 1.5) {
                insights.push(`**The Flush Response:** Your ALDH2 deficiency means toxic acetaldehyde accumulates 3x faster than normal. Alcohol provides brief sedation followed by rapid inflammation, heart racing, and nausea. Avoiding alcohol is biologically recommended.`);
            } else if (reward_sensitivity > 1.5) {
                insights.push(`**High Reward (OPRM1):** Your opioid receptors trigger a generic "Mega-Euphoria" response. This feels amazing but indicates a **genetic susceptibility to addiction**. Monitor frequency carefully.`);
            } else {
                insights.push(`**Standard Tolerance:** Your metabolic hardware is efficient (Normal ADH1B/ALDH2). You lack the protective "Flush" mechanism, meaning you can physiologically tolerate higher quantities without immediate toxicity. **Note:** High tolerance is a prerequisite for habit formation.`);
            }

            // Cross-Talk: CHRNA5 (Satiety)
            // Only show this here if Nicotine is NOT active (prevent duplicate warnings)
            const nicotineActive = activeSubstances.nicotine && activeSubstances.nicotine !== 'None';
            const nicotineTraits = pharmaResults.nicotine?.traits || [];
            if (!nicotineActive && nicotineTraits.some(t => t.gene === 'CHRNA5' && t.effect === 'Risk')) {
                insights.push(`**Satiety Cross-Link (CHRNA5):** Your "Stop Button" variant (CHRNA5) is not specific to nicotine. It may impair your ability to sense "enough" alcohol, delaying the nausea signal that prevents over-consumption.`);
            }
        }

        // CANNABIS Logic (Kinetic Engine)
        if (activeSubstances.cannabis && activeSubstances.cannabis !== 'None') {
            const intensity = activeSubstances.cannabis === 'High' ? 1.5 : (activeSubstances.cannabis === 'Low' ? 0.5 : 1.0);
            const traits = pharmaResults.cannabis?.traits || [];

            let k_el = 1.0;
            let psychosis_risk = 1.0;

            traits.forEach(t => {
                if (t.gene === 'CYP2C9') k_el *= 0.3; // *2 and *3 variants drastically reduce clearance
                if (t.gene === 'AKT1' && t.effect === 'PsychosisRisk') psychosis_risk *= 3.0;
                if (t.gene === 'FAAH' && t.effect === 'Anxious') psychosis_risk *= 1.5;
            });

            // Base Effects
            mod('gaba', 0.2 * intensity);
            mod('dopamine', 0.1 * intensity);

            // Calculation
            const halfLife = Math.round(24 / k_el); // Normal THC half-life ~24h (fat soluble)

            if (k_el < 0.5) {
                insights.push(`**Slow Clearance (CYP2C9):** You metabolize THC extremely slowly. Biological half-life is extended to **~${halfLife} hours**. Effects may persist into the next day ("stoneover") and drug testing will remain positive significantly longer.`);
            }

            if (pharmaResults.profile.comt === 'Worrier' && psychosis_risk > 1) {
                mod('dopamine', -0.5 * intensity); // Crash
                mod('serotonin', -0.4 * intensity); // Paranoia
                insights.push(`**RED FLAG (COMT + AKT1):** You carry a Multi-Hit Risk. Your COMT "Worrier" baseline combined with AKT1 variants makes high-THC strains a **strong trigger for paranoia and psychosis**. High CBD ratios are mandatory for safety.`);
            } else if (psychosis_risk > 1.5) {
                insights.push(`**AKT1 Warning:** You carry the "C" risk allele. Daily cannabis use increases the statistical probability of psychotic symptoms by ~7x compared to non-carriers.`);
            } else {
                insights.push(`**Standard Response:** You do not carry the specific COMT/AKT1 risk factors for acute psychosis. However, standard THC warnings regarding cognition and memory still apply.`);
            }
        }

        // NICOTINE Logic (Kinetic Engine)
        if (activeSubstances.nicotine && activeSubstances.nicotine !== 'None') {
            // Granular Scaling
            const intensity = activeSubstances.nicotine === 'High' ? 1.5 : (activeSubstances.nicotine === 'Low' ? 0.5 : 1.0);
            const traits = pharmaResults.nicotine?.traits || [];

            let k_el = 1.0;
            let addiction_risk = 1.0;

            traits.forEach(t => {
                if (t.gene === 'CYP2A6' && t.effect === 'Slow') k_el *= 0.5; // Stays in system 2x longer
                if (t.gene === 'CHRNA5' && t.effect === 'Risk') addiction_risk *= 2.5;
            });

            mod('dopamine', 0.2 * intensity);
            mod('cortisol', 0.1 * intensity);

            if (k_el < 0.7) {
                insights.push(`**Slow Metabolizer (CYP2A6):** You clear nicotine slowly. While you may smoke/vape less often, plasma levels remain steady, creating a constant background stimulant effect that may interfere with sleep quality purely through accumulation.`);
            }

            if (addiction_risk > 2.0) {
                insights.push(`**High Addiction Risk (CHRNA5):** Your receptors fail to signal "stop" at high doses ("Mr. Big" variant). Biological brake is broken. Addiction risk is significantly higher.`);
            } else {
                insights.push(`**Standard Risk:** Your CHRNA5 variant is normal. Your biological "stop button" (nausea at high doses) is intact, providing a natural brake on consumption.`);
            }
        }

        // SUGAR Logic (Kinetic Engine)
        if (activeSubstances.sugar && activeSubstances.sugar !== 'None') {
            const traits = pharmaResults.sugar?.traits || [];
            let crash_risk = 1.0;

            traits.forEach(t => {
                if (t.gene === 'TCF7L2' && t.effect === 'InsulinRisk') crash_risk *= 2.0;
                if (t.gene === 'TAS1R2' && t.effect === 'SweetTooth') mod('dopamine', 0.2); // Extra reward
            });

            mod('dopamine', 0.15); // Initial hit

            // The Crash (Reactive Hypoglycemia simulation)
            if (crash_risk > 1.5) {
                mod('dopamine', -0.3);
                mod('cortisol', 0.2);
                insights.push(`**Metabolic Crash Warning (TCF7L2):** Your insulin response is genetically sluggish. Expect a steeper blood sugar spike followed by a reactive hypoglycemia crash (Brain fog/Irritability) ~90 mins after ingestion.`);
            } else {
                insights.push(`**Standard Glycemic Response:** Your TCF7L2 variant is normal. You likely maintain steady energy levels without the extreme reactive hypoglycemia (crash) seen in risk carriers.`);
            }

            if (traits.some(t => t.gene === 'FTO' && t.effect === 'Hungry')) {
                insights.push(`**Satiety Failure (FTO):** Sugar fails to trigger your "I'm full" ghrelin signal. You are strictly reliant on willpower, as your hardware will not tell you to stop.`);
            }
        }

        // MAGNESIUM Logic (Ensure single instance)
        // (Already above, so we just close the function here if duplicates are removed)

        // MAGNESIUM Logic
        if (activeSubstances.magnesium) {
            mod('gaba', 0.15);
            mod('plasticity', 0.1);

            const traits = pharmaResults.magnesium?.traits || [];
            if (traits.some(t => t.gene === 'TRPM6' && t.effect === 'LowAbsorption')) {
                insights.push(`**TRPM6 Low Absorption:** Inefficient transport channels. Use Magnesium Glycinate/Threonate.`);
            } else {
                insights.push(`**Magnesium Optimized:** Supporting neuroplasticity.`);
            }
        }

        // --- 3. SYSTEMIC MODULATORS (The Global "Operating System" Modifiers) ---

        // FKBP5: The Cortisol "Brake"
        const fkbp5 = pharmaResults.systemic?.traits.find(t => t.gene === 'FKBP5');
        if (fkbp5?.effect === 'HighCortisol') {
            const stressIdx = ghostData.findIndex(d => d.axis === 'Stress' || d.axis === 'cortisol');
            if (stressIdx >= 0 && ghostData[stressIdx].value > ghostData[stressIdx].originalValue) {
                ghostData[stressIdx].value += 0.15;
                insights.push(`**Systemic Drag (FKBP5):** Impaired cortisol feedback loop. Stress spikes will linger significantly longer.`);
            }
        }

        // MTHFR: Methylation Efficiency
        const mthfr = pharmaResults.systemic?.traits.find(t => t.gene === 'MTHFR');
        if (mthfr?.effect === 'LowMeth') {
            // Lower baseline for serotonin/dopamine synthesis regeneration
            mod('serotonin', -0.05);
            mod('dopamine', -0.05);
            insights.push(`**Methylation Drag (MTHFR):** Reduced methylation efficiency limits rate of neurotransmitter synthesis. Recovery from depletion will be slower.`);
        }

        // BDNF: Plasticity
        const bdnf = pharmaResults.systemic?.traits.find(t => t.gene === 'BDNF');
        if (bdnf?.effect === 'Met') {
            mod('plasticity', -0.15);
            insights.push(`**Reduced Plasticity (BDNF):** Met carrier. Activity-dependent neuroplasticity is impaired. Learning new coping mechanisms requires more repetition.`);
        }

        // CACNA1C: Excitability / Mood Lability
        const cacna1c = pharmaResults.systemic?.traits.find(t => t.gene === 'CACNA1C');
        if (cacna1c?.effect === 'Excite') {
            // Amplifies existing movements away from baseline
            ghostData.forEach(d => {
                const delta = d.value - d.originalValue;
                if (Math.abs(delta) > 0.1) {
                    d.value += delta * 0.2; // 20% amplification of shifts
                }
            });
            insights.push(`**Neural Excitability (CACNA1C):** increased calcium channel signaling amplifies mood shifts. Highs are higher, lows are lower.`);
        }

        // OXTR: Social Buffering
        const oxtr = pharmaResults.systemic?.traits.find(t => t.gene === 'OXTR');
        if (oxtr?.effect === 'LowBond') {
            mod('oxytocin', -0.1);
            insights.push(`**Social Buffering Risk (OXTR):** Reduced receptor sensitivity. Social interaction provides less stress-buffering effect than standard.`);
        }

        // APOE: The Inflammation Cost
        const apoe = pharmaResults.systemic?.traits.find(t => t.gene === 'APOE');
        if (apoe?.effect === 'Inflammation' && (activeSubstances.alcohol > 0 || activeSubstances.sugar !== 'None')) {
            mod('plasticity', -0.3);
            insights.push(`**Neuro-Optimization (APOE4):** Pro-inflammatory baseline. Alcohol/Sugar carry a "double cost" to neuroplasticity.`);
        }

        // --- 4. BLOCK D: RED FLAG HEALTH WARNINGS ---

        // 1. Caffeine + Long QT (KCNQ1)
        const kcnq1 = pharmaResults.systemic?.traits.find(t => t.gene === 'KCNQ1');
        if (activeSubstances.caffeine && activeSubstances.caffeine !== 'None' && kcnq1?.effect === 'LongQT') {
            mod('cortisol', 0.5);
            mod('flow', -0.5);
            insights.unshift(`⚠️ **CARDIAC WARNING (KCNQ1):** Long QT Variant detected. Caffeine may cause palpitations. **Limit intake.**`);
        }

        // 2. Cannabis + COMT Met/Met
        const comt = pharmaResults.profile.comt;
        if (activeSubstances.cannabis && activeSubstances.cannabis === 'High' && comt === 'Worrier') {
            mod('serotonin', -0.6);
            mod('flow', -0.6);
            insights.unshift(`**MEDICAL RED FLAG:** High THC + COMT Met/Met. Acute paranoia risk. **Stability Crash Simulated.**`);
        }

        // 3. Alcohol + APOE4
        if (activeSubstances.alcohol > 2 && apoe?.effect === 'Inflammation') {
            mod('plasticity', -0.6);
            mod('oxytocin', -0.3);
            insights.unshift(`**NEURO-TOXICITY WARNING:** Heavy Alcohol + APOE4. Oxidative stress is damaging cognitive reserve.`);
        }

        // --- 5. CLAMPING & CLEANUP ---
        ghostData = ghostData.map(d => ({
            ...d,
            value: Math.max(0.05, Math.min(1.0, d.value))
        }));

        return { ghostData, insights };
    }
}


export default PharmacogenomicAnalyzer;

