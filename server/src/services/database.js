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

class DatabaseService {
    constructor() {
        this.database = new Map();
        this.positionIndex = new Map();
        this.isLoaded = false;
        this.stats = {
            snpediaCount: 0,
            clinvarCount: 0,
            gwasCount: 0,
            totalCount: 0,
            loadTime: 0
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
                        // Merge genotypes from ClinVar that aren't in SNPedia
                        const existing = this.database.get(rsidLower);
                        if (data.genotypes && existing.genotypes) {
                            for (const [geno, genoData] of Object.entries(data.genotypes)) {
                                if (!existing.genotypes[geno]) {
                                    existing.genotypes[geno] = genoData;
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
                    resolve();
                });

                rl.on('error', reject);
            });
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
            isLoaded: this.isLoaded
        };
    }
}

// Singleton instance
export const databaseService = new DatabaseService();
export default databaseService;
