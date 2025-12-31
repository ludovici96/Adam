/**
 * Database Service
 * Loads and merges SNPedia and ClinVar databases, provides lookup and search functionality
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Compiled regex for common genotype detection to improve performance
const COMMON_GENOTYPE_REGEX = /(?:9[589]%|most common|common\/normal|common genotype|common in (?:clinvar|snpedia|gwas|complete genomics)|miscall|^common$|common.*?normal|normal.*?common)/i;

class DatabaseService {
    constructor() {
        this.database = new Map();
        this.positionIndex = new Map();
        this.isLoaded = false;
        this.conflicts = []; // Track source conflicts for validation
        this.stats = {
            snpediaCount: 0,
            clinvarCount: 0,
            gwasCount: 0,
            totalCount: 0,
            loadTime: 0,
            clinvarOverrides: 0,
            strandMismatches: 0,
            correctionsApplied: 0,
            correctionsSkipped: 0,
            clinvarMagnitudeAdjustments: 0
        };
    }

    // Get reverse complement of a genotype (for strand comparison)
    reverseComplement(genotype) {
        const map = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };
        return genotype.split('').map(b => map[b] || b).join('');
    }

    // Check if two genotypes might be strand-flipped versions of each other
    isStrandFlipped(geno1, geno2) {
        return this.reverseComplement(geno1) === geno2;
    }

    // Get max magnitude from a genotypes object
    getMaxMagnitude(genotypes) {
        if (!genotypes) return 0;
        return Math.max(0, ...Object.values(genotypes).map(g => g.magnitude || 0));
    }

    // Check if SNPedia summary indicates this is a common/normal genotype
    // This helps prevent ClinVar strand errors from overriding known-common genotypes
    isCommonGenotype(summary) {
        if (!summary) return false;
        return COMMON_GENOTYPE_REGEX.test(summary);
    }

    // Adjust ClinVar magnitude based on actual clinical significance in summary
    // ClinVar often has incorrect high magnitudes for benign/uncertain variants
    adjustClinvarMagnitude(genoData) {
        if (!genoData || !genoData.summary) return genoData;

        const summary = genoData.summary.toLowerCase();
        let adjustedMag = genoData.magnitude || 0;
        let adjustedRepute = genoData.repute;

        // Check for benign classifications - should be magnitude 0
        if (summary.includes('benign') && !summary.includes('pathogenic')) {
            adjustedMag = 0;
            adjustedRepute = 'Good';
        }
        // Check for likely benign - should be magnitude 0-0.5
        else if (summary.includes('likely benign')) {
            adjustedMag = Math.min(adjustedMag, 0.5);
            adjustedRepute = 'Good';
        }
        // Check for conflicting classifications - need to parse the breakdown
        else if (summary.includes('conflicting')) {
            // Parse patterns like "Uncertain significance(1); Benign(2)"
            const benignMatch = summary.match(/benign\s*\((\d+)\)/i);
            const pathogenicMatch = summary.match(/pathogenic\s*\((\d+)\)/i);
            const uncertainMatch = summary.match(/uncertain\s*(?:significance)?\s*\((\d+)\)/i);

            const benignCount = benignMatch ? parseInt(benignMatch[1]) : 0;
            const pathogenicCount = pathogenicMatch ? parseInt(pathogenicMatch[1]) : 0;
            const uncertainCount = uncertainMatch ? parseInt(uncertainMatch[1]) : 0;
            const total = benignCount + pathogenicCount + uncertainCount;

            if (total > 0) {
                // If majority says benign, treat as benign
                if (benignCount > pathogenicCount && benignCount >= uncertainCount) {
                    adjustedMag = Math.min(adjustedMag, 1);
                    adjustedRepute = 'neutral';
                }
                // If majority says pathogenic, keep high but cap at 3
                else if (pathogenicCount > benignCount && pathogenicCount > uncertainCount) {
                    adjustedMag = Math.min(adjustedMag, 3);
                }
                // Uncertain or mixed - low magnitude
                else {
                    adjustedMag = Math.min(adjustedMag, 1.5);
                    adjustedRepute = 'neutral';
                }
            } else {
                // Can't parse breakdown, default to low magnitude for conflicting
                adjustedMag = Math.min(adjustedMag, 1.5);
                adjustedRepute = 'neutral';
            }
        }
        // Check for uncertain significance / VUS - should be low magnitude
        else if (summary.includes('uncertain significance') || summary.includes('vus')) {
            adjustedMag = Math.min(adjustedMag, 1);
            adjustedRepute = 'neutral';
        }
        // Check for "not provided" or "not specified" without pathogenic - low magnitude
        else if ((summary.includes('not provided') || summary.includes('not specified')) &&
            !summary.includes('pathogenic')) {
            adjustedMag = Math.min(adjustedMag, 1);
            adjustedRepute = 'neutral';
        }

        return {
            ...genoData,
            magnitude: adjustedMag,
            repute: adjustedRepute,
            originalMagnitude: genoData.magnitude !== adjustedMag ? genoData.magnitude : undefined
        };
    }

    async load() {
        const startTime = Date.now();
        console.log('Loading databases...');

        const dataDir = path.join(__dirname, '../../../public/data');
        const snpediaPath = path.join(dataDir, 'snpedia.json');
        const clinvarPath = path.join(dataDir, 'clinvar.json');

        // Load SNPedia first (takes priority)
        if (fs.existsSync(snpediaPath)) {
            console.log('Loading SNPedia...');
            const snpediaData = JSON.parse(fs.readFileSync(snpediaPath, 'utf-8'));
            this.stats.snpediaCount = Object.keys(snpediaData).length;

            for (const [rsid, data] of Object.entries(snpediaData)) {
                this.database.set(rsid.toLowerCase(), { ...data, source: 'snpedia' });

                if (data.chrom && data.pos) {
                    const key = `${data.chrom}:${data.pos}`;
                    this.positionIndex.set(key, rsid.toLowerCase());
                }
            }
            console.log(`  Loaded ${this.stats.snpediaCount} SNPedia entries`);
        }

        // Load ClinVar (only add if not in SNPedia) - using streaming for large file
        if (fs.existsSync(clinvarPath)) {
            console.log('Loading ClinVar (streaming)...');

            const streamJsonModule = await import('stream-json');
            const StreamObjectModule = await import('stream-json/streamers/StreamObject.js');
            const { parser } = streamJsonModule.default || streamJsonModule;
            const { streamObject } = StreamObjectModule.default || StreamObjectModule;

            await new Promise((resolve, reject) => {
                let added = 0;
                let processed = 0;

                const pipeline = fs.createReadStream(clinvarPath)
                    .pipe(parser())
                    .pipe(streamObject());

                pipeline.on('data', ({ key: rsid, value: data }) => {
                    processed++;
                    const rsidLower = rsid.toLowerCase();

                    // Adjust magnitudes for all ClinVar genotypes based on clinical significance
                    if (data.genotypes) {
                        for (const [geno, genoData] of Object.entries(data.genotypes)) {
                            const adjusted = this.adjustClinvarMagnitude(genoData);
                            if (adjusted.originalMagnitude !== undefined) {
                                this.stats.clinvarMagnitudeAdjustments++;
                            }
                            data.genotypes[geno] = adjusted;
                        }
                    }

                    if (!this.database.has(rsidLower)) {
                        this.database.set(rsidLower, { ...data, source: 'clinvar' });
                        added++;

                        if (data.chrom && data.pos) {
                            const posKey = `${data.chrom}:${data.pos}`;
                            if (!this.positionIndex.has(posKey)) {
                                this.positionIndex.set(posKey, rsidLower);
                            }
                        }
                    } else {
                        // Merge genotypes from ClinVar - ClinVar is authoritative for clinical variants
                        const existing = this.database.get(rsidLower);
                        if (data.genotypes && existing.genotypes) {
                            const snpediaMaxMag = this.getMaxMagnitude(existing.genotypes);
                            const clinvarMaxMag = this.getMaxMagnitude(data.genotypes);

                            // Detect potential strand mismatches for high-magnitude variants
                            // Optimized: O(n) instead of O(n*m) using reverse complement lookup map
                            if (snpediaMaxMag >= 3 || clinvarMaxMag >= 3) {
                                // Build a map of ClinVar genotypes and their reverse complements
                                const clinvarByFlipped = new Map();
                                for (const [cGeno, cData] of Object.entries(data.genotypes)) {
                                    const flipped = this.reverseComplement(cGeno);
                                    clinvarByFlipped.set(flipped, { genotype: cGeno, data: cData });
                                }

                                // Single pass through SNPedia genotypes
                                for (const [sGeno, sData] of Object.entries(existing.genotypes)) {
                                    const clinvarFlipped = clinvarByFlipped.get(sGeno);

                                    if (clinvarFlipped) {
                                        const sMag = sData?.magnitude || 0;
                                        const cMag = clinvarFlipped.data?.magnitude || 0;

                                        // If magnitudes are swapped (one says normal, other says pathogenic)
                                        if ((sMag >= 3 && cMag === 0) || (cMag >= 3 && sMag === 0)) {
                                            this.stats.strandMismatches++;
                                            this.conflicts.push({
                                                rsid: rsidLower,
                                                type: 'strand_mismatch',
                                                snpediaGenotype: sGeno,
                                                snpediaMagnitude: sMag,
                                                clinvarGenotype: clinvarFlipped.genotype,
                                                clinvarMagnitude: cMag,
                                                snpediaSummary: sData?.summary,
                                                clinvarSummary: clinvarFlipped.data?.summary
                                            });
                                        }
                                    }
                                }
                            }

                            // Single pass: handle direct matches and strand-flipped matches together
                            const processedGenotypes = new Set();

                            for (const [geno, genoData] of Object.entries(data.genotypes)) {
                                const clinvarMag = genoData.magnitude || 0;
                                const flippedGeno = this.reverseComplement(geno);

                                // Check for direct match first
                                const existingDirect = existing.genotypes[geno];
                                // Check for strand-flipped match
                                const existingFlipped = !existingDirect ? existing.genotypes[flippedGeno] : null;

                                // Determine which genotype we're working with
                                const targetGeno = existingDirect ? geno : (existingFlipped ? flippedGeno : geno);
                                const existingGeno = existingDirect || existingFlipped;
                                const isStrandFlipped = !existingDirect && existingFlipped;

                                // Skip if we already processed this genotype in this merge
                                if (processedGenotypes.has(targetGeno)) continue;

                                if (!existingGeno) {
                                    // Add missing genotypes from ClinVar
                                    existing.genotypes[geno] = { ...genoData, source: 'clinvar' };
                                    processedGenotypes.add(geno);
                                } else {
                                    const snpediaMag = existingGeno.magnitude || 0;
                                    const snpediaSummary = existingGeno.summary || '';

                                    // Don't let ClinVar override if SNPedia says this is a common genotype
                                    // This prevents strand errors in ClinVar from causing false positives
                                    if (this.isCommonGenotype(snpediaSummary) && clinvarMag >= 2) {
                                        this.conflicts.push({
                                            rsid: rsidLower,
                                            type: 'blocked_override',
                                            genotype: targetGeno,
                                            reason: 'SNPedia indicates common genotype',
                                            snpediaMagnitude: snpediaMag,
                                            clinvarMagnitude: clinvarMag,
                                            snpediaSummary: snpediaSummary,
                                            clinvarSummary: genoData.summary,
                                            strandFlipped: isStrandFlipped
                                        });
                                        // Don't override - SNPedia's "common" designation takes priority
                                    }
                                    // ClinVar overrides SNPedia for clinical variants when:
                                    // 1. ClinVar says normal but SNPedia says pathogenic (false positive fix)
                                    // 2. ClinVar says pathogenic and SNPedia doesn't indicate it's common
                                    else if (clinvarMag !== snpediaMag && (clinvarMag >= 2 || snpediaMag >= 2)) {
                                        this.stats.clinvarOverrides++;
                                        this.conflicts.push({
                                            rsid: rsidLower,
                                            type: isStrandFlipped ? 'strand_corrected_override' : 'magnitude_override',
                                            genotype: targetGeno,
                                            clinvarGenotype: isStrandFlipped ? geno : undefined,
                                            snpediaMagnitude: snpediaMag,
                                            clinvarMagnitude: clinvarMag,
                                            snpediaSummary: snpediaSummary,
                                            clinvarSummary: genoData.summary
                                        });
                                        existing.genotypes[targetGeno] = {
                                            ...genoData,
                                            source: 'clinvar',
                                            strandCorrected: isStrandFlipped ? geno : undefined
                                        };
                                    }

                                    processedGenotypes.add(targetGeno);
                                }
                            }
                        }
                    }

                    if (processed % 500000 === 0) {
                        console.log(`  Processed ${processed.toLocaleString()} ClinVar entries...`);
                    }
                });

                pipeline.on('end', () => {
                    this.stats.clinvarCount = added;
                    console.log(`  Added ${added.toLocaleString()} unique ClinVar entries`);
                    if (this.stats.clinvarMagnitudeAdjustments > 0) {
                        console.log(`  Adjusted ${this.stats.clinvarMagnitudeAdjustments.toLocaleString()} ClinVar magnitudes (benign/uncertain/conflicting)`);
                    }
                    if (this.stats.clinvarOverrides > 0) {
                        console.log(`  ClinVar overrode ${this.stats.clinvarOverrides} SNPedia genotypes`);
                    }
                    if (this.stats.strandMismatches > 0) {
                        console.log(`  \x1b[31m Detected ${this.stats.strandMismatches} potential strand mismatches\x1b[0m`);
                    }
                    resolve();
                });

                pipeline.on('error', reject);
            });
        }

        // Load GWAS Catalog (adds trait associations)
        const gwasPath = path.join(dataDir, 'gwas/gwas-catalog-download-associations-alt-full.tsv');
        if (fs.existsSync(gwasPath)) {
            console.log('Loading GWAS Catalog...');

            await new Promise((resolve, reject) => {
                let added = 0;
                let overlayed = 0;
                let processed = 0;
                let headers = null;

                const rl = readline.createInterface({
                    input: fs.createReadStream(gwasPath),
                    crlfDelay: Infinity
                });

                rl.on('line', (line) => {
                    if (!headers) {
                        headers = line.split('\t');
                        return;
                    }

                    processed++;
                    const cols = line.split('\t');
                    const snps = cols[headers.indexOf('SNPS')];
                    if (!snps || !snps.startsWith('rs')) return;

                    const rsidLower = snps.toLowerCase();
                    const chrom = cols[headers.indexOf('CHR_ID')];
                    const pos = cols[headers.indexOf('CHR_POS')];
                    const trait = cols[headers.indexOf('DISEASE/TRAIT')] || cols[headers.indexOf('MAPPED_TRAIT')];
                    const pValue = parseFloat(cols[headers.indexOf('P-VALUE')]);
                    const orBeta = parseFloat(cols[headers.indexOf('OR or BETA')]);
                    const riskAllele = cols[headers.indexOf('STRONGEST SNP-RISK ALLELE')];
                    const pubmedId = cols[headers.indexOf('PUBMEDID')];

                    const gwasInfo = {
                        trait,
                        pValue: isNaN(pValue) ? null : pValue,
                        orBeta: isNaN(orBeta) ? null : orBeta,
                        riskAllele,
                        pubmedId
                    };

                    if (this.database.has(rsidLower)) {
                        const existing = this.database.get(rsidLower);
                        if (!existing.gwasAssociations) {
                            existing.gwasAssociations = [];
                            overlayed++;
                        }
                        existing.gwasAssociations.push(gwasInfo);
                    } else {
                        const chromNum = chrom?.replace('chr', '');
                        const posNum = parseInt(pos, 10);
                        this.database.set(rsidLower, {
                            source: 'gwas',
                            chrom: chromNum,
                            pos: isNaN(posNum) ? null : posNum,
                            gwasAssociations: [gwasInfo],
                            genotypes: {}
                        });
                        added++;

                        if (chromNum && posNum && !this.positionIndex.has(`${chromNum}:${posNum}`)) {
                            this.positionIndex.set(`${chromNum}:${posNum}`, rsidLower);
                        }
                    }

                    if (processed % 200000 === 0) {
                        console.log(`  Processed ${processed.toLocaleString()} GWAS entries...`);
                    }
                });

                rl.on('close', () => {
                    this.stats.gwasCount = added;
                    console.log(`  Added ${added.toLocaleString()} unique GWAS entries`);
                    console.log(`  Overlayed GWAS onto ${overlayed.toLocaleString()} existing SNPs`);
                    resolve();
                });

                rl.on('error', reject);
            });
        }

        // Apply manual corrections (persists across database updates)
        const correctionsPath = path.join(dataDir, 'database-corrections.json');
        if (fs.existsSync(correctionsPath)) {
            console.log('Applying manual corrections...');
            try {
                const corrections = JSON.parse(fs.readFileSync(correctionsPath, 'utf-8'));
                let applied = 0;
                let skipped = 0;

                for (const [index, correction] of (corrections.corrections || []).entries()) {
                    // Validate required fields
                    if (!correction || typeof correction !== 'object') {
                        console.warn(`  Skipping correction #${index + 1}: not an object`);
                        skipped++;
                        continue;
                    }

                    if (!correction.rsid || typeof correction.rsid !== 'string') {
                        console.warn(`  Skipping correction #${index + 1}: missing or invalid 'rsid'`);
                        skipped++;
                        continue;
                    }

                    if (!correction.genotypes || typeof correction.genotypes !== 'object' || Object.keys(correction.genotypes).length === 0) {
                        console.warn(`  Skipping correction for ${correction.rsid}: missing or empty 'genotypes'`);
                        skipped++;
                        continue;
                    }

                    if (!correction.reason) {
                        console.warn(`  Warning: correction for ${correction.rsid} has no 'reason' field`);
                        // Continue anyway - reason is recommended but not strictly required
                    }

                    const rsidLower = correction.rsid.toLowerCase();
                    const existing = this.database.get(rsidLower);

                    if (existing) {
                        // Ensure existing entry has genotypes object
                        if (!existing.genotypes) {
                            existing.genotypes = {};
                        }

                        // Override genotypes with corrected values
                        for (const [geno, genoData] of Object.entries(correction.genotypes)) {
                            // Validate genotype data
                            if (!genoData || typeof genoData !== 'object') {
                                console.warn(`  Skipping invalid genotype '${geno}' for ${correction.rsid}`);
                                continue;
                            }

                            existing.genotypes[geno] = {
                                ...genoData,
                                source: 'manual_correction',
                                correctionReason: correction.reason || 'No reason provided'
                            };
                        }
                        applied++;
                    } else {
                        // Add new entry if it doesn't exist
                        const newGenotypes = {};
                        for (const [geno, genoData] of Object.entries(correction.genotypes)) {
                            // Validate genotype data
                            if (!genoData || typeof genoData !== 'object') {
                                console.warn(`  Skipping invalid genotype '${geno}' for ${correction.rsid}`);
                                continue;
                            }
                            newGenotypes[geno] = {
                                ...genoData,
                                source: 'manual_correction',
                                correctionReason: correction.reason || 'No reason provided'
                            };
                        }

                        if (Object.keys(newGenotypes).length === 0) {
                            console.warn(`  Skipping correction for ${correction.rsid}: no valid genotypes after validation`);
                            skipped++;
                            continue;
                        }

                        this.database.set(rsidLower, {
                            source: 'manual_correction',
                            genotypes: newGenotypes,
                            correctionReason: correction.reason || 'No reason provided'
                        });
                        applied++;
                    }
                }

                this.stats.correctionsApplied = applied;
                this.stats.correctionsSkipped = skipped;
                console.log(`  Applied ${applied} manual corrections${skipped > 0 ? `, skipped ${skipped} invalid` : ''}`);
            } catch (err) {
                console.error('  Error loading corrections:', err.message);
            }
        }

        this.stats.totalCount = this.database.size;
        this.stats.loadTime = Date.now() - startTime;
        this.isLoaded = true;

        console.log(`\nDatabase loaded successfully!`);
        console.log(`  Total SNPs: ${this.stats.totalCount.toLocaleString()}`);
        console.log(`  Position index: ${this.positionIndex.size.toLocaleString()} entries`);
        console.log(`  Load time: ${(this.stats.loadTime / 1000).toFixed(1)}s`);
        console.log(`  Memory usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`);

        return this.stats;
    }

    getSNP(rsid) {
        return this.database.get(rsid.toLowerCase());
    }

    getSNPByPosition(chrom, pos) {
        const key = `${chrom}:${pos}`;
        const rsid = this.positionIndex.get(key);
        return rsid ? this.database.get(rsid) : null;
    }

    search(query, limit = 50) {
        const results = [];
        const queryLower = query.toLowerCase();

        for (const [rsid, data] of this.database) {
            if (results.length >= limit) break;

            // Match by RSID
            if (rsid.includes(queryLower)) {
                results.push({ rsid, ...data });
                continue;
            }

            // Match by summary
            if (data.summary?.toLowerCase().includes(queryLower)) {
                results.push({ rsid, ...data });
                continue;
            }

            // Match by genotype summaries
            if (data.genotypes) {
                for (const genoData of Object.values(data.genotypes)) {
                    if (genoData.summary?.toLowerCase().includes(queryLower)) {
                        results.push({ rsid, ...data });
                        break;
                    }
                }
            }
        }

        return results;
    }

    getStats() {
        return {
            ...this.stats,
            memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
            isLoaded: this.isLoaded,
            conflictCount: this.conflicts.length
        };
    }

    /**
     * Get all detected conflicts between data sources (e.g., SNPedia vs ClinVar).
     * Useful for validation and identifying potential data quality issues.
     *
     * @returns {Array<Object>} List of all conflict objects containing details like rsid, type, and source magnitudes
     */
    getConflicts() {
        return this.conflicts;
    }

    /**
     * Get high-priority conflicts that require attention.
     * Includes strand mismatches and high-magnitude disagreements (magnitude >= 4)
     * where sources significantly disagree on clinical importance.
     *
     * @returns {Array<Object>} List of critical conflict objects
     */
    getCriticalConflicts() {
        return this.conflicts.filter(c =>
            c.type === 'strand_mismatch' ||
            (c.snpediaMagnitude >= 4 || c.clinvarMagnitude >= 4)
        );
    }
}

// Singleton instance
export const databaseService = new DatabaseService();
export default databaseService;
