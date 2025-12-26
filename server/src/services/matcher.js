/**
 * Matcher Service
 * Matches user DNA variants against the SNP database
 */

import { databaseService } from './database.js';

const CATEGORY_KEYWORDS = {
    pharmacogenomics: [
        'drug', 'medication', 'warfarin', 'clopidogrel', 'statin',
        'metabolism', 'metabolizer', 'cyp', 'enzyme',
        'response', 'sensitivity', 'resistance', 'dosage',
        'adverse', 'side effect', 'toxicity'
    ],
    carrier: [
        'carrier', 'recessive', 'inherited',
        'cystic fibrosis', 'sickle cell', 'tay-sachs',
        'hemophilia', 'thalassemia'
    ],
    ancestry: [
        'ancestry', 'haplogroup', 'population', 'ethnicity',
        'european', 'african', 'asian', 'native american',
        'neanderthal', 'denisovan'
    ],
    traits: [
        'eye color', 'hair color', 'skin', 'pigment', 'freckling',
        'height', 'tall', 'short', 'caffeine', 'alcohol',
        'bitter taste', 'cilantro', 'lactose', 'gluten',
        'muscle', 'athletic', 'endurance', 'sprint',
        'sleep', 'circadian', 'earwax', 'dimple'
    ],
    health: [
        'cancer', 'tumor', 'carcinoma', 'leukemia', 'lymphoma',
        'diabetes', 'heart', 'cardiac', 'cardiovascular', 'stroke',
        'alzheimer', 'parkinson', 'dementia', 'obesity',
        'disease', 'disorder', 'syndrome', 'risk', 'susceptibility'
    ]
};

function inferCategory(summary, existingCategory) {
    if (existingCategory && existingCategory !== 'other') {
        return existingCategory;
    }

    if (!summary) return 'other';
    const text = summary.toLowerCase();

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
        if (keywords.some(k => text.includes(k))) {
            return category;
        }
    }

    return 'other';
}

function reverseComplement(genotype) {
    const map = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };
    return genotype.split('').map(b => map[b] || b).join('');
}

export function matchVariants(variants) {
    const matches = [];
    const stats = {
        totalVariants: variants.length,
        rsidLookups: 0,
        coordLookups: 0,
        rsidHits: 0,
        coordHits: 0,
        genotypeMisses: 0,
        totalMatches: 0
    };

    for (const v of variants) {
        let rsid = v.rsid;
        let snpData = null;

        if (rsid) {
            stats.rsidLookups++;
            snpData = databaseService.getSNP(rsid);
            if (snpData) {
                stats.rsidHits++;
                rsid = rsid.toLowerCase();
            }
        }

        if (!snpData && v.chrom && v.pos) {
            stats.coordLookups++;
            const result = databaseService.getSNPByPosition(v.chrom, v.pos);
            if (result) {
                snpData = result;
                stats.coordHits++;
            }
        }

        if (snpData && snpData.genotypes) {
            const userGenotype = v.genotype;
            let matchData = snpData.genotypes[userGenotype];

            if (!matchData) {
                const rev = reverseComplement(userGenotype);
                matchData = snpData.genotypes[rev];
            }

            if (matchData) {
                const inferredCategory = inferCategory(matchData.summary, snpData.category);

                matches.push({
                    rsid: rsid || `${v.chrom}:${v.pos}`,
                    userGenotype,
                    magnitude: matchData.magnitude || 0,
                    repute: matchData.repute,
                    summary: matchData.summary,
                    chrom: v.chrom,
                    pos: v.pos,
                    category: inferredCategory,
                    source: snpData.source
                });
            } else {
                stats.genotypeMisses++;
            }
        }
    }

    // Deduplicate by RSID, keep highest magnitude
    const uniqueMatches = [];
    const seenRsids = new Set();

    matches.sort((a, b) => (b.magnitude || 0) - (a.magnitude || 0));

    for (const match of matches) {
        if (!seenRsids.has(match.rsid)) {
            seenRsids.add(match.rsid);
            uniqueMatches.push(match);
        }
    }

    stats.totalMatches = uniqueMatches.length;

    return { matches: uniqueMatches, stats };
}

export default { matchVariants };
