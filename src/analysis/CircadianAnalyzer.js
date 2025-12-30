/**
 * CircadianAnalyzer - Maps CLOCK/PER3 genes to Chronotype & Daily Schedule
 * Maps "Time" to "Essence" (Neurochemistry)
 */

export const CIRCADIAN_DATABASE = {
    clock: {
        gene: 'CLOCK',
        rsid: 'rs1801260',
        traitAlleles: {
            'C': { effect: 'Evening', weight: 1 }, // CT/CC -> Late
            'T': { effect: 'Morning', weight: -1 } // TT -> Early
        },
        reference: 'CLOCK 3111T/C polymorphism associated with evening preference.'
    },
    per3: {
        gene: 'PER3',
        rsid: 'rs57875989', // VNTR (often not in VCF, need fallback behavior)
        traitAlleles: {
            '5R': { effect: 'Morning', weight: -2 },
            '4R': { effect: 'Evening', weight: 2 }
        },
        reference: 'PER3 VNTR length polymorphism. Longer (5R) linked to Morningness.'
    },
    // Proxies for PER3 if VNTR is missing
    per3_snp: {
        gene: 'PER3',
        rsid: 'rs228697',
        traitAlleles: {
            'C': { effect: 'Evening', weight: 1 },
            'G': { effect: 'Morning', weight: -1 }
        }
    },
    arntl: {
        gene: 'ARNTL', // BMAL1
        rsid: 'rs900147', // Proxy
        traitAlleles: {
            'G': { effect: 'Protection', weight: 0 },
            'A': { effect: 'Risk', weight: 0 }
        }
    }
};

export class CircadianAnalyzer {
    constructor(matches) {
        this.matches = matches || [];
        this.matchMap = new Map();
        this.matches.forEach(m => {
            if (m.rsid) this.matchMap.set(m.rsid.toLowerCase(), m);
        });
    }

    getGenotype(rsid) {
        const match = this.matchMap.get(rsid.toLowerCase());
        return match ? (match.userGenotype || match.genotype) : null;
    }

    determineChronotype() {
        let score = 0; // Negative = Morning, Positive = Evening
        let findings = [];

        // Check CLOCK
        const clockGeno = this.getGenotype(CIRCADIAN_DATABASE.clock.rsid);
        if (clockGeno) {
            if (clockGeno.includes('C')) {
                score += 1;
                findings.push({ gene: 'CLOCK', type: 'Eveningness', ref: 'C allele' });
            } else {
                score -= 1;
                findings.push({ gene: 'CLOCK', type: 'Morningness', ref: 'TT Genotype' });
            }
        }

        // Check PER3 Proxy (since VNTR is rare in VCFs)
        const per3Geno = this.getGenotype(CIRCADIAN_DATABASE.per3_snp.rsid);
        if (per3Geno) {
            if (per3Geno.includes('C')) {
                score += 1;
                findings.push({ gene: 'PER3', type: 'Eveningness', ref: 'C allele' });
            } else {
                score -= 1;
                findings.push({ gene: 'PER3', type: 'Morningness', ref: 'G allele' });
            }
        }

        // Classification
        let type = 'Bear'; // Default Mid-Day
        let label = 'The Solar Bear';
        let description = 'Your biology follows the sun. You have a steady energy curve that peaks in the late morning and early afternoon.';

        // Thresholds
        if (score >= 2) {
            type = 'Wolf';
            label = 'The Lunar Wolf';
            description = 'You are chemically wired for the night. Your cortisol peaks later, meaning your "Deep Focus" window doesn\'t open until others are winding down.';
        } else if (score <= -2) {
            type = 'Lion';
            label = 'The Rising Lion';
            description = 'You wake up ready. Your cognitive peak hits before lunch, but you crash early. You must protect your mornings at all costs.';
        } else if (Math.abs(score) < 1 && findings.length === 0) {
            // No data case -> Bear
        } else if (score === 0) {
            type = 'Bear'; // Balanced
        }

        // If "Dolphin" (Insomnia risk) - usually different genes (CLOCK/ARNTL interactions), keep simple for now.

        return {
            type,
            label,
            description,
            score,
            findings
        };
    }

    generateSchedule(chronotype, archetype) {
        // Basic Schedule Archetypes
        // now we define the key 'anchors' and fill the rest
        const schedules = {
            'Lion': {
                wake: 6,
                windows: [
                    { type: 'focus', start: 8, end: 12, label: 'Peak Focus', subLabel: 'Deep Work' },
                    { type: 'social', start: 13, end: 16, label: 'Social Sync', subLabel: 'Connection' },
                    { type: 'recovery', start: 21, end: 6, label: 'Recharge', subLabel: 'Sleep' }
                ]
            },
            'Bear': {
                wake: 7,
                windows: [
                    { type: 'focus', start: 10, end: 14, label: 'Peak Focus', subLabel: 'Deep Work' },
                    { type: 'social', start: 15, end: 18, label: 'Social Sync', subLabel: 'Connection' },
                    { type: 'recovery', start: 23, end: 7, label: 'Recharge', subLabel: 'Sleep' }
                ]
            },
            'Wolf': {
                wake: 9,
                windows: [
                    { type: 'focus', start: 16, end: 20, label: 'Peak Focus', subLabel: 'Deep Work' },
                    { type: 'social', start: 20, end: 23, label: 'Social Sync', subLabel: 'Connection' },
                    { type: 'recovery', start: 2, end: 10, label: 'Recharge', subLabel: 'Sleep' }
                ]
            },
            'Dolphin': {
                wake: 6.5,
                windows: [
                    { type: 'focus', start: 15, end: 19, label: 'Peak Focus', subLabel: 'Deep Work' },
                    { type: 'social', start: 20, end: 23, label: 'Social Sync', subLabel: 'Connection' },
                    { type: 'recovery', start: 0, end: 6, label: 'Recharge', subLabel: 'Sleep' }
                ]
            }
        };

        const base = schedules[chronotype.type] || schedules['Bear'];
        const superTitle = archetype?.superpower?.title || 'Superpower';

        // 1. Sort windows by start time
        // We need to handle the day linearly from 0 to 24 for gap filling logic
        // But 'recovery' often crosses midnight. Let's normalize everything to 0-24 first.
        // Actually, simpler approach: Just define the fixed windows, and fill the "space between"

        let sortedWindows = [...base.windows].sort((a, b) => a.start - b.start);

        // Handle midnight crossing for sorting: if a window wraps (start > end), it effectively is at the end of the day AND start of day.
        // But for gap filling, it's easier to view the 24h clock as a circle.

        // Let's create a filled list.
        let fullSchedule = [];

        // Helper to get color
        const getMeta = (type) => {
            switch (type) {
                case 'focus': return { color: '#F43F5E', intensity: 'high' }; // Rose
                case 'social': return { color: '#F59E0B', intensity: 'high' }; // Amber
                case 'recovery': return { color: '#6366f1', intensity: 'high' }; // Indigo
                default: return { color: '#78716C', intensity: 'low' }; // Stone
            }
        };

        // We will just iterate through the defined windows and fill gaps
        // This is a bit complex due to wrap-around. 
        // Simplified specific logic for the 4 archetypes to ensure perfection:

        const fillGaps = (mainWindows) => {
            let filled = [];
            // Sort by start time.
            // Identify the "Recovery" window (usually matches wrap)
            const sorted = mainWindows.sort((a, b) => a.start - b.start);

            for (let i = 0; i < sorted.length; i++) {
                const current = sorted[i];
                const next = sorted[(i + 1) % sorted.length];

                // Add current window
                filled.push({
                    ...current,
                    ...getMeta(current.type)
                });

                // Check gap to next
                let gapStart = current.end;
                let gapEnd = next.start;

                // Normalize for wrap
                if (gapStart >= 24) gapStart -= 24;
                // if next.start is smaller than gapStart, it implies a day wrap.
                let duration = gapEnd - gapStart;
                if (duration < 0) duration += 24;

                if (duration > 0) {
                    // Determine gap type based on what it precedes
                    let label = 'Transition';
                    let subLabel = 'Routine';

                    // Heuristic Naming
                    if (next.type === 'focus') { label = 'Warm Up'; subLabel = 'Prep Mode'; }
                    else if (next.type === 'recovery') { label = 'Wind Down'; subLabel = 'Leisure'; }
                    else if (current.type === 'focus' && next.type === 'social') { label = 'Decompress'; subLabel = 'Break'; }

                    filled.push({
                        type: 'gap',
                        label,
                        subLabel,
                        start: gapStart,
                        end: gapEnd, // Logic in UI handles wrap
                        ...getMeta('gap')
                    });
                }
            }
            return filled;
        }

        return {
            wakeTime: base.wake,
            windows: fillGaps(base.windows)
        };
    }
}

