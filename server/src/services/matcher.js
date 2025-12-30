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

/**
 * Extract the risk allele from GWAS riskAllele field
 * Format is typically "rs12345-A" or "rs12345-?"
 */
function extractRiskAllele(riskAlleleStr) {
    if (!riskAlleleStr) return null;
    const match = riskAlleleStr.match(/-([ACGT])$/i);
    return match ? match[1].toUpperCase() : null;
}

/**
 * Check if user's genotype contains a risk allele
 * Also checks reverse complement
 */
function genotypeContainsRiskAllele(userGenotype, riskAllele) {
    if (!riskAllele || !userGenotype) return false;

    const allele = riskAllele.toUpperCase();
    const complement = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' }[allele];

    // Check if user genotype contains the risk allele or its complement
    return userGenotype.toUpperCase().includes(allele) ||
           (complement && userGenotype.toUpperCase().includes(complement));
}

/**
 * Count how many copies of risk allele user has (0, 1, or 2)
 */
function countRiskAlleles(userGenotype, riskAllele) {
    if (!riskAllele || !userGenotype) return 0;

    const allele = riskAllele.toUpperCase();
    const complement = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' }[allele];
    const geno = userGenotype.toUpperCase();

    let count = 0;
    for (const base of geno) {
        if (base === allele || base === complement) count++;
    }
    return count;
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

        if (snpData) {
            const userGenotype = v.genotype;
            let matchData = snpData.genotypes?.[userGenotype];
            let usedReverseComplement = false;

            if (!matchData && snpData.genotypes) {
                const rev = reverseComplement(userGenotype);
                const revMatchData = snpData.genotypes[rev];

                // Only use reverse complement for LOW magnitude matches (common variants)
                // High magnitude (>=3) pathogenic variants should NOT use reverse complement
                // as this often causes false positives with ClinVar data
                if (revMatchData && (revMatchData.magnitude || 0) < 3) {
                    matchData = revMatchData;
                    usedReverseComplement = true;
                }
                // For high magnitude, check if user might have the NORMAL genotype
                // by verifying if there's a low-magnitude entry for their actual genotype
                else if (revMatchData && (revMatchData.magnitude || 0) >= 3) {
                    // Don't match - this is likely a false positive
                    // The user probably has the reference/normal genotype on opposite strand
                    stats.genotypeMisses++;
                    continue;
                }
            }

            // Case 1: We have genotype-specific data from SNPedia/ClinVar
            if (matchData) {
                const summary = matchData.summary || '';
                const inferredCategory = inferCategory(summary, snpData.category);

                matches.push({
                    rsid: rsid || `${v.chrom}:${v.pos}`,
                    userGenotype,
                    magnitude: matchData.magnitude || 0,
                    repute: matchData.repute || 'neutral',
                    summary: summary,
                    chrom: v.chrom,
                    pos: v.pos,
                    category: inferredCategory,
                    source: snpData.source,
                    gwasAssociations: snpData.gwasAssociations || null
                });
            }
            // Case 2: GWAS-only data - must check if user has risk allele
            else if (snpData.gwasAssociations && snpData.gwasAssociations.length > 0) {
                // Find GWAS associations where user carries the risk allele
                const relevantAssociations = [];
                let maxRiskCount = 0;

                for (const assoc of snpData.gwasAssociations) {
                    const riskAllele = extractRiskAllele(assoc.riskAllele);
                    if (riskAllele) {
                        const riskCount = countRiskAlleles(userGenotype, riskAllele);
                        if (riskCount > 0) {
                            relevantAssociations.push({
                                ...assoc,
                                riskAlleleCount: riskCount
                            });
                            maxRiskCount = Math.max(maxRiskCount, riskCount);
                        }
                    }
                }

                // Only report if user actually carries at least one risk allele
                if (relevantAssociations.length > 0) {
                    const topAssoc = relevantAssociations[0];
                    const summary = topAssoc.trait || '';
                    const inferredCategory = inferCategory(summary, snpData.category);

                    // Magnitude based on risk allele count: 1 copy = lower, 2 copies = higher
                    const magnitude = maxRiskCount === 2 ? 1.5 : 0.5;

                    matches.push({
                        rsid: rsid || `${v.chrom}:${v.pos}`,
                        userGenotype,
                        magnitude: magnitude,
                        repute: 'Bad',
                        summary: `${summary} (${maxRiskCount} risk allele${maxRiskCount > 1 ? 's' : ''})`,
                        chrom: v.chrom,
                        pos: v.pos,
                        category: inferredCategory,
                        source: 'gwas',
                        gwasAssociations: relevantAssociations,
                        riskAlleleCount: maxRiskCount
                    });
                } else {
                    // User has SNP but NOT the risk allele - this is normal/protective
                    stats.genotypeMisses++;
                }
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
