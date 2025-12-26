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

    inferCategory(summary, existingCategory) {
        if (existingCategory && existingCategory !== 'other') {
            return existingCategory;
        }

        if (!summary) return 'other';

        const text = summary.toLowerCase();

        const healthKeywords = [
            'cancer', 'tumor', 'carcinoma', 'leukemia', 'lymphoma', 'melanoma',
            'diabetes', 'heart', 'cardiac', 'cardiovascular', 'stroke', 'hypertension',
            'alzheimer', 'parkinson', 'dementia', 'neurological',
            'obesity', 'bmi', 'weight', 'cholesterol', 'triglyceride',
            'disease', 'disorder', 'syndrome', 'risk', 'susceptibility',
            'asthma', 'arthritis', 'autoimmune', 'inflammation',
            'schizophrenia', 'depression', 'bipolar', 'anxiety',
            'macular degeneration', 'glaucoma', 'blindness',
            'osteoporosis', 'fracture', 'bone density'
        ];

        const pharmaKeywords = [
            'drug', 'medication', 'warfarin', 'clopidogrel', 'statin',
            'metabolism', 'metabolizer', 'cyp', 'enzyme',
            'response', 'sensitivity', 'resistance', 'dosage',
            'adverse', 'side effect', 'toxicity',
            'pharmacokinetic', 'pharmacodynamic'
        ];

        const traitsKeywords = [
            'eye color', 'hair color', 'skin', 'pigment', 'freckling',
            'height', 'tall', 'short',
            'caffeine', 'alcohol', 'bitter taste', 'cilantro',
            'lactose', 'gluten',
            'muscle', 'athletic', 'endurance', 'sprint',
            'sleep', 'circadian', 'morning person', 'night owl',
            'earwax', 'dimple', 'cleft chin', 'widow peak'
        ];

        const carrierKeywords = [
            'carrier', 'recessive', 'inherited',
            'cystic fibrosis', 'sickle cell', 'tay-sachs',
            'hemophilia', 'thalassemia'
        ];

        const ancestryKeywords = [
            'ancestry', 'haplogroup', 'population', 'ethnicity',
            'european', 'african', 'asian', 'native american',
            'neanderthal', 'denisovan'
        ];

        if (pharmaKeywords.some(k => text.includes(k))) return 'pharmacogenomics';
        if (carrierKeywords.some(k => text.includes(k))) return 'carrier';
        if (ancestryKeywords.some(k => text.includes(k))) return 'ancestry';
        if (traitsKeywords.some(k => text.includes(k))) return 'traits';
        if (healthKeywords.some(k => text.includes(k))) return 'health';

        return 'other';
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

            if (rsid) {
                stats.rsidLookups++;
                if (this.database[rsid.toLowerCase()]) {
                    snpData = this.database[rsid.toLowerCase()];
                    stats.rsidHits++;
                }
            }

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
                    const inferredCategory = this.inferCategory(matchData.summary, snpData.category);

                    matches.push({
                        rsid,
                        userGenotype,
                        ...matchData,
                        chrom: v.chrom,
                        pos: v.pos,
                        category: inferredCategory
                    });
                } else {
                    stats.genotypeMisses++;
                }
            }
        }

        const uniqueMatches = [];
        const seenRsids = new Set();

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
