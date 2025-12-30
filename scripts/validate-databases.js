#!/usr/bin/env node
/**
 * Database Validation Script
 * Detects strand mismatches and conflicts between SNPedia and ClinVar databases
 *
 * Usage: node --max-old-space-size=8192 scripts/validate-databases.js [--fix] [--output report.json]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const DATA_DIR = path.join(__dirname, '../public/data');
const SNPEDIA_PATH = path.join(DATA_DIR, 'snpedia.json');
const CLINVAR_PATH = path.join(DATA_DIR, 'clinvar.json');

// Utility functions
function reverseComplement(genotype) {
    const map = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };
    return genotype.split('').map(b => map[b] || b).join('');
}

function getMaxMagnitude(genotypes) {
    if (!genotypes) return 0;
    return Math.max(0, ...Object.values(genotypes).map(g => g.magnitude || 0));
}

async function loadClinvarStreaming() {
    console.log('Loading ClinVar (streaming)...');
    const clinvar = new Map();

    const streamJsonModule = await import('stream-json');
    const StreamObjectModule = await import('stream-json/streamers/StreamObject.js');
    const { parser } = streamJsonModule.default || streamJsonModule;
    const { streamObject } = StreamObjectModule.default || StreamObjectModule;

    return new Promise((resolve, reject) => {
        let count = 0;

        // Create streams separately to attach error handlers to each
        const sourceStream = fs.createReadStream(CLINVAR_PATH);
        const jsonParser = parser();
        const objectStreamer = streamObject();

        // Attach error handlers to all streams in the pipeline
        sourceStream.on('error', (err) => {
            reject(new Error(`Source stream error: ${err.message}`));
        });

        jsonParser.on('error', (err) => {
            reject(new Error(`JSON parser error: ${err.message}`));
        });

        objectStreamer.on('error', (err) => {
            reject(new Error(`Object streamer error: ${err.message}`));
        });

        // Build the pipeline
        const pipeline = sourceStream.pipe(jsonParser).pipe(objectStreamer);

        pipeline.on('data', ({ key: rsid, value: data }) => {
            clinvar.set(rsid.toLowerCase(), data);
            count++;
            if (count % 500000 === 0) {
                console.log(`  Loaded ${count.toLocaleString()} ClinVar entries...`);
            }
        });

        pipeline.on('end', () => {
            console.log(`  Total: ${clinvar.size.toLocaleString()} ClinVar entries`);
            resolve(clinvar);
        });

        pipeline.on('error', reject);
    });
}

async function main() {
    const args = process.argv.slice(2);
    const shouldFix = args.includes('--fix');
    const outputIndex = args.indexOf('--output');
    const outputPath = outputIndex !== -1 ? args[outputIndex + 1] : null;

    console.log('=== Database Validation Script ===\n');

    // Load SNPedia
    console.log('Loading SNPedia...');
    if (!fs.existsSync(SNPEDIA_PATH)) {
        console.error('SNPedia database not found at:', SNPEDIA_PATH);
        process.exit(1);
    }
    const snpedia = JSON.parse(fs.readFileSync(SNPEDIA_PATH, 'utf-8'));
    console.log(`  Loaded ${Object.keys(snpedia).length.toLocaleString()} SNPedia entries\n`);

    // Load ClinVar
    let clinvar = new Map();
    if (fs.existsSync(CLINVAR_PATH)) {
        clinvar = await loadClinvarStreaming();
    } else {
        console.log('ClinVar database not found, skipping ClinVar comparison\n');
    }

    // Track issues
    const issues = {
        strandMismatches: [],
        magnitudeConflicts: [],
        missingGenotypes: [],
        suspiciousHighMagnitude: []
    };

    console.log('\nAnalyzing variants...\n');

    let analyzed = 0;
    for (const [rsid, snpData] of Object.entries(snpedia)) {
        analyzed++;
        if (analyzed % 100000 === 0) {
            console.log(`  Analyzed ${analyzed.toLocaleString()} variants...`);
        }

        const rsidLower = rsid.toLowerCase();
        const clinvarData = clinvar.get(rsidLower);

        // Check for high-magnitude SNPedia entries
        const snpediaMaxMag = getMaxMagnitude(snpData.genotypes);

        if (snpediaMaxMag >= 4) {
            // Check if this is a potentially problematic entry
            if (!clinvarData) {
                // High-magnitude SNPedia entry with no ClinVar validation
                issues.suspiciousHighMagnitude.push({
                    rsid,
                    magnitude: snpediaMaxMag,
                    reason: 'No ClinVar data to validate',
                    genotypes: snpData.genotypes
                });
            }
        }

        if (!clinvarData || !clinvarData.genotypes || !snpData.genotypes) continue;

        const snpediaGenos = Object.keys(snpData.genotypes);

        // Check for strand mismatches
        for (const sGeno of snpediaGenos) {
            const sData = snpData.genotypes[sGeno];
            const sMag = sData.magnitude || 0;

            // Check if there's a direct match in ClinVar
            const directMatch = clinvarData.genotypes[sGeno];

            // Check for reverse complement match
            const revComp = reverseComplement(sGeno);
            const revMatch = clinvarData.genotypes[revComp];

            if (directMatch) {
                const cMag = directMatch.magnitude || 0;

                // Check for magnitude conflicts
                if (Math.abs(sMag - cMag) >= 2 && (sMag >= 2 || cMag >= 2)) {
                    issues.magnitudeConflicts.push({
                        rsid,
                        genotype: sGeno,
                        snpediaMagnitude: sMag,
                        clinvarMagnitude: cMag,
                        snpediaSummary: sData.summary,
                        clinvarSummary: directMatch.summary,
                        recommendation: cMag < sMag ? 'SNPedia may be overstating risk' : 'SNPedia may be understating risk'
                    });
                }
            }

            if (revMatch && !directMatch) {
                const cMag = revMatch.magnitude || 0;

                // This is a potential strand mismatch
                if ((sMag >= 3 && cMag === 0) || (cMag >= 3 && sMag === 0)) {
                    issues.strandMismatches.push({
                        rsid,
                        snpediaGenotype: sGeno,
                        snpediaMagnitude: sMag,
                        snpediaSummary: sData.summary,
                        clinvarGenotype: revComp,
                        clinvarMagnitude: cMag,
                        clinvarSummary: revMatch.summary,
                        suggestedFix: `Swap ${sGeno} and ${revComp} interpretations in SNPedia`
                    });
                }
            }
        }
    }

    // Generate report
    console.log('\n=== Validation Report ===\n');

    console.log(`Strand Mismatches: ${issues.strandMismatches.length}`);
    console.log(`Magnitude Conflicts: ${issues.magnitudeConflicts.length}`);
    console.log(`Suspicious High-Magnitude (no ClinVar): ${issues.suspiciousHighMagnitude.length}`);

    // Show critical issues
    if (issues.strandMismatches.length > 0) {
        console.log('\n--- CRITICAL: Strand Mismatches ---');
        console.log('These variants have opposite interpretations between sources:\n');

        for (const issue of issues.strandMismatches.slice(0, 20)) {
            console.log(`  ${issue.rsid}:`);
            console.log(`    SNPedia: ${issue.snpediaGenotype} = mag ${issue.snpediaMagnitude} "${issue.snpediaSummary?.substring(0, 50)}..."`);
            console.log(`    ClinVar: ${issue.clinvarGenotype} = mag ${issue.clinvarMagnitude} "${issue.clinvarSummary?.substring(0, 50)}..."`);
            console.log(`    Fix: ${issue.suggestedFix}\n`);
        }

        if (issues.strandMismatches.length > 20) {
            console.log(`  ... and ${issues.strandMismatches.length - 20} more\n`);
        }
    }

    if (issues.magnitudeConflicts.length > 0) {
        console.log('\n--- Magnitude Conflicts ---');
        console.log('These variants have different magnitude scores between sources:\n');

        // Sort by magnitude difference
        const sorted = [...issues.magnitudeConflicts].sort((a, b) =>
            Math.abs(b.snpediaMagnitude - b.clinvarMagnitude) - Math.abs(a.snpediaMagnitude - a.clinvarMagnitude)
        );

        for (const issue of sorted.slice(0, 20)) {
            console.log(`  ${issue.rsid} (${issue.genotype}):`);
            console.log(`    SNPedia: mag ${issue.snpediaMagnitude} | ClinVar: mag ${issue.clinvarMagnitude}`);
            console.log(`    ${issue.recommendation}\n`);
        }

        if (issues.magnitudeConflicts.length > 20) {
            console.log(`  ... and ${issues.magnitudeConflicts.length - 20} more\n`);
        }
    }

    // Save full report if requested
    if (outputPath) {
        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                strandMismatches: issues.strandMismatches.length,
                magnitudeConflicts: issues.magnitudeConflicts.length,
                suspiciousHighMagnitude: issues.suspiciousHighMagnitude.length
            },
            issues
        };

        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        console.log(`\nFull report saved to: ${outputPath}`);
    }

    // Apply fixes if requested
    if (shouldFix && issues.strandMismatches.length > 0) {
        console.log('\n--- Applying Fixes ---\n');

        let fixed = 0;
        const processedPairs = new Set(); // Track processed genotype pairs to avoid double-fixing

        for (const issue of issues.strandMismatches) {
            const rsidLower = issue.rsid.toLowerCase();
            const pairKey = `${rsidLower}:${[issue.snpediaGenotype, issue.clinvarGenotype].sort().join('-')}`;

            // Skip if we already processed this genotype pair
            if (processedPairs.has(pairKey)) continue;
            processedPairs.add(pairKey);

            if (snpedia[rsidLower] || snpedia[issue.rsid]) {
                const entry = snpedia[rsidLower] || snpedia[issue.rsid];

                // Get ClinVar data for this SNP
                const clinvarEntry = clinvar.get(rsidLower);
                if (clinvarEntry && clinvarEntry.genotypes) {
                    const snpediaGeno1 = issue.snpediaGenotype; // e.g., 'AA'
                    const snpediaGeno2 = issue.clinvarGenotype; // e.g., 'TT' (the complement)

                    // Get old SNPedia values for both genotypes
                    const oldSnpedia1 = entry.genotypes[snpediaGeno1];
                    const oldSnpedia2 = entry.genotypes[snpediaGeno2];

                    // Get ClinVar values for both genotypes
                    const clinvar1 = clinvarEntry.genotypes[snpediaGeno1];
                    const clinvar2 = clinvarEntry.genotypes[snpediaGeno2];

                    // Properly swap BOTH genotypes using ClinVar's interpretations
                    if (oldSnpedia1 && clinvar1) {
                        entry.genotypes[snpediaGeno1] = {
                            ...clinvar1,
                            _fixedFrom: 'strand_mismatch',
                            _originalMagnitude: oldSnpedia1.magnitude,
                            _originalSummary: oldSnpedia1.summary
                        };
                    }

                    if (oldSnpedia2 && clinvar2) {
                        entry.genotypes[snpediaGeno2] = {
                            ...clinvar2,
                            _fixedFrom: 'strand_mismatch',
                            _originalMagnitude: oldSnpedia2.magnitude,
                            _originalSummary: oldSnpedia2.summary
                        };
                    }

                    // If ClinVar doesn't have one of the genotypes, swap using the other's old value
                    if (oldSnpedia1 && !clinvar1 && oldSnpedia2) {
                        entry.genotypes[snpediaGeno1] = {
                            magnitude: oldSnpedia2.magnitude,
                            repute: oldSnpedia2.repute,
                            summary: oldSnpedia2.summary,
                            _fixedFrom: 'strand_swap',
                            _swappedWith: snpediaGeno2
                        };
                    }

                    if (oldSnpedia2 && !clinvar2 && oldSnpedia1) {
                        entry.genotypes[snpediaGeno2] = {
                            magnitude: oldSnpedia1.magnitude,
                            repute: oldSnpedia1.repute,
                            summary: oldSnpedia1.summary,
                            _fixedFrom: 'strand_swap',
                            _swappedWith: snpediaGeno1
                        };
                    }

                    fixed++;
                    console.log(`  Fixed ${issue.rsid}: swapped ${snpediaGeno1} ↔ ${snpediaGeno2}`);
                }
            }
        }

        if (fixed > 0) {
            // Backup original
            const backupPath = SNPEDIA_PATH + '.backup.' + Date.now();
            fs.copyFileSync(SNPEDIA_PATH, backupPath);
            console.log(`\n  Backed up original to: ${backupPath}`);

            // Write fixed version
            fs.writeFileSync(SNPEDIA_PATH, JSON.stringify(snpedia, null, 2));
            console.log(`  Fixed ${fixed} strand mismatches in SNPedia database`);
        }
    }

    console.log('\nValidation complete.');

    // Exit with error code if critical issues found
    if (issues.strandMismatches.length > 0) {
        process.exit(1);
    }
}

main().catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
