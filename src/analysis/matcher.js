export class Matcher {
    constructor(database) {
        this.database = database;
        this.posMap = new Map();
        this.buildIndex();
    }

    buildIndex() {
        for (const [rsid, data] of Object.entries(this.database)) {
            if (data.chrom && data.pos) {
                const key = `${data.chrom}:${data.pos}`;
                this.posMap.set(key, rsid);
            }
        }
    }

    match(userVariants) {
        const matches = [];
        const stats = {
            totalVariants: userVariants.length,
            rsidLookups: 0,
            coordLookups: 0,
            rsidHits: 0,
            coordHits: 0,
            genotypeMisses: 0,
            totalMatches: 0
        };

        for (const v of userVariants) {
            let rsid = v.rsid;
            let snpData = null;

            // Direct RSID Lookup
            if (rsid) {
                stats.rsidLookups++;
                if (this.database[rsid.toLowerCase()]) { // Handle case-insensitivity
                    snpData = this.database[rsid.toLowerCase()];
                    stats.rsidHits++;
                }
            }

            // Fallback: Coordinate Lookup
            if (!snpData) {
                stats.coordLookups++;
                const key = `${v.chrom}:${v.pos}`;
                const matchedRsid = this.posMap.get(key);
                if (matchedRsid) {
                    rsid = matchedRsid;
                    snpData = this.database[rsid];
                    stats.coordHits++;
                }
            }

            if (snpData) {
                const userGenotype = v.genotype;
                let matchData = snpData.genotypes[userGenotype];

                if (!matchData) {
                    const rev = this.reverseComplement(userGenotype);
                    matchData = snpData.genotypes[rev];
                }

                if (matchData) {
                    matches.push({
                        rsid,
                        userGenotype,
                        ...matchData,
                        chrom: v.chrom,
                        pos: v.pos,
                        category: snpData.category
                    });
                } else {
                    stats.genotypeMisses++;
                }
            }
        }

        // Deduplicate matches by RSID (keep highest magnitude for each)
        const uniqueMatches = [];
        const seenRsids = new Set();

        // Sort by magnitude first so we keep the highest magnitude match for each RSID
        matches.sort((a, b) => b.magnitude - a.magnitude);

        for (const match of matches) {
            if (!seenRsids.has(match.rsid)) {
                seenRsids.add(match.rsid);
                uniqueMatches.push(match);
            }
        }

        stats.totalMatches = uniqueMatches.length;

        return { matches: uniqueMatches, stats };
    }

    reverseComplement(genotype) {
        const map = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };
        return genotype.split('').map(b => map[b] || b).join('');
    }
}
