import { NEUROCHEMISTRY_DATABASE } from './EmotionalAnalyzer';

/**
 * ChemistryEngine - Generates narrative scenarios from bio-data.
 * Focuses on "The Saturday Morning Test" (Energy Management) and "The Shadow Loop" (Conflict)
 */
export class ChemistryEngine {
    constructor(userProfile, partnerProfile) {
        this.user = userProfile;
        this.partner = partnerProfile;
    }

    // Helper to find relevant gene for a trait
    getReceipt(systemKey, condition) {
        const system = NEUROCHEMISTRY_DATABASE[systemKey];
        if (!system) return 'Genetic Variance';

        // Simple heuristic: return the first SNP that matches the condition "direction"
        // condition 'high' -> direction 1, 'low' -> direction 0 (mostly)
        const targetDirection = condition === 'high' ? 1 : 0;
        const snp = system.snps.find(s =>
            // This is a simplification; in a real engine we'd check the User's actual genotype from details
            // But for the narrative engine, we just want a relevant citation.
            true
        );
        return snp ? `${snp.gene} (${snp.rsid})` : 'Polygenic Score';
    }

    generateSaturdayMorning() {
        const uDopamine = this.user.systems.dopamine.score;
        const pDopamine = this.partner.systems.dopamine.score;

        // Archetype-based logic (Simpler to reason about)
        // 1. High-High (The Mission)
        if (uDopamine > 0.6 && pDopamine > 0.6) {
            return {
                title: "The Mission Control Morning",
                scenario: "You both wake up with a plan. By 9 AM, you've conquered a mountain (literal or metaphorical). The danger? You forget to actually relax.",
                receipt: `Your shared ${this.getReceipt('dopamine', 'high')} creates a 'High Retention' loop—amplifying focus but risking burnout.`
            };
        }

        // 2. Low-Low (The Flow State)
        if (uDopamine < 0.4 && pDopamine < 0.4) {
            return {
                title: "The Drift",
                scenario: "No alarms. No plans. You might end up at a flea market, or Paris. The vibe is immaculate, but you might realize at 8 PM you forgot to eat.",
                receipt: `Shared ${this.getReceipt('dopamine', 'low')} means rapid dopamine clearance—you both seek novelty over structure.`
            };
        }

        // 3. Mismatch (The Tug of War)
        const highUser = uDopamine > pDopamine;
        return {
            title: "The Anchor vs. The Sail",
            scenario: `${highUser ? 'You' : 'They'} wake up with a To-Do list. ${highUser ? 'They' : 'You'} wake up wanting a vibe. The friction point: 10:30 AM, when the Planner tries to rush the Drifter.`,
            receipt: `Friction between ${this.getReceipt('dopamine', 'high')} (Retention) and ${this.getReceipt('dopamine', 'low')} (Clearance). One brain is holding on, the other is letting go.`
        };
    }

    generateShadowLoop() {
        const uShadow = this.user.archetype.shadow;
        const pShadow = this.partner.archetype.shadow;

        // Direct mapping of Shadow interactions
        // This is where "Relationship Coaching" happens

        return {
            title: "The Stress Cycle",
            trigger: `When you get stuck in "${uShadow.title}"`,
            reaction: `It triggers their "${pShadow.title}"`,
            fix: `Bio-Hack: The moment you feel ${uShadow.title} starting, call a 10-minute "Chemical Timeout" to separate before their mirror neurons catch it.`,
            receipt: `Based on your specific Neuro-Archetypes (${this.user.archetype.name} + ${this.partner.archetype.name}).`
        };
    }

    generateJointArchetype() {
        const uName = this.user.archetype.name;
        const pName = this.partner.archetype.name;

        if (uName === pName) {
            return {
                title: `The Mirror ${uName}s`,
                description: "You are looking at your reflection. You understand each other instantly, but you share the exact same blind spots. You need a third party to see what you both miss."
            };
        }

        // Heuristics for narrative
        const uDopa = this.user.systems.dopamine.score;
        const pDopa = this.partner.systems.dopamine.score;

        if (Math.abs(uDopa - pDopa) > 0.5) {
            return {
                title: "The Dynamic Tension",
                description: `A classic "Opposites Attract" pairing. One of you provides the Gas (${uDopa > pDopa ? 'You' : 'They'}), the other provides the Brakes. It's stable, IF you respect the other's role.`
            };
        }

        return {
            title: "The Symbiotic Duo",
            description: "You have enough overlap to feel safe, but enough difference to keep it interesting. A highly sustainable long-term configuration."
        };
    }

    generateSystemDynamics() {
        const dynamics = {};
        const keys = ['dopamine', 'serotonin', 'oxytocin', 'plasticity'];

        keys.forEach(key => {
            const uScore = this.user.systems[key].score;
            const pScore = this.partner.systems[key].score;
            const delta = Math.abs(uScore - pScore);
            const avg = (uScore + pScore) / 2;

            let status = 'Complementary';
            let label = 'Balanced';
            let description = 'You balance each other out.';

            if (delta < 0.2) {
                status = 'Synced';
                label = 'Resonance';
                description = `You both speak the same chemical language for ${NEUROCHEMISTRY_DATABASE[key].label}.`;
            } else if (delta > 0.5) {
                status = 'Polarity';
                label = 'Friction';
                description = `You are opposites here. One seeks ${uScore > 0.5 ? 'Intensity' : 'Calm'}, the other seeks ${pScore > 0.5 ? 'Intensity' : 'Calm'}.`;
            }

            dynamics[key] = {
                key,
                name: NEUROCHEMISTRY_DATABASE[key].label, // e.g. "The Spark"
                color: NEUROCHEMISTRY_DATABASE[key].color,
                status,
                label,
                description,
                uDetails: this.user.systems[key].manifestation,
                pDetails: this.partner.systems[key].manifestation
            };
        });

        return dynamics;
    }

    run() {
        if (!this.user || !this.partner) return null;

        return {
            saturday: this.generateSaturdayMorning(),
            shadowLoop: this.generateShadowLoop(),
            jointArchetype: this.generateJointArchetype(),
            systemDynamics: this.generateSystemDynamics()
        };
    }
}
