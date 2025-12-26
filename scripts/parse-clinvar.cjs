#!/usr/bin/env node
/**
 * ClinVar VCF to JSON Converter
 * Parses ClinVar VCF file and converts it to a format compatible with snpedia.json
 */

const fs = require('fs');
const readline = require('readline');
const zlib = require('zlib');
const path = require('path');

const INPUT_FILE = path.join(__dirname, '../public/data/clinvar.vcf.gz');
const OUTPUT_FILE = path.join(__dirname, '../public/data/clinvar.json');

// Map ClinVar significance to repute
function mapSignificanceToRepute(clnsig) {
    const sig = clnsig?.toLowerCase() || '';

    if (sig.includes('pathogenic') && !sig.includes('benign')) {
        return 'Bad';
    }
    if (sig.includes('risk_factor')) {
        return 'Bad';
    }
    if (sig.includes('benign') || sig.includes('protective')) {
        return 'Good';
    }
    return 'neutral';
}

// Map ClinVar significance to magnitude (1-5 scale)
function mapSignificanceToMagnitude(clnsig) {
    const sig = clnsig?.toLowerCase() || '';

    if (sig.includes('pathogenic') && !sig.includes('likely')) {
        return 4; // Definite pathogenic
    }
    if (sig.includes('likely_pathogenic')) {
        return 3; // Likely pathogenic
    }
    if (sig.includes('risk_factor')) {
        return 2.5;
    }
    if (sig.includes('uncertain') || sig.includes('conflicting')) {
        return 1;
    }
    if (sig.includes('likely_benign')) {
        return 0.5;
    }
    if (sig.includes('benign') || sig.includes('protective')) {
        return 0;
    }
    return 0;
}

// Map ClinVar data to category
function inferCategory(geneInfo, clndn, mc) {
    const text = `${geneInfo || ''} ${clndn || ''} ${mc || ''}`.toLowerCase();

    // Pharmacogenomics genes
    const pharmaGenes = ['cyp2c9', 'cyp2c19', 'cyp2d6', 'cyp3a4', 'vkorc1', 'dpyd', 'tpmt', 'slco1b1'];
    if (pharmaGenes.some(g => text.includes(g))) return 'pharmacogenomics';

    if (text.includes('carrier') || text.includes('recessive')) return 'carrier';

    // Check for specific conditions
    if (text.includes('cancer') || text.includes('carcinoma') || text.includes('tumor')) return 'health';
    if (text.includes('diabetes') || text.includes('cardiac') || text.includes('heart')) return 'health';

    return 'health'; // Default for ClinVar is health-related
}

async function parseClinVar() {
    console.log('Starting ClinVar VCF parsing...');
    console.log(`Input: ${INPUT_FILE}`);
    console.log(`Output: ${OUTPUT_FILE}`);

    const database = {};
    let lineCount = 0;
    let snpCount = 0;
    let skippedNoRs = 0;

    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(INPUT_FILE);
        const gunzip = zlib.createGunzip();
        const rl = readline.createInterface({
            input: fileStream.pipe(gunzip),
            crlfDelay: Infinity
        });

        rl.on('line', (line) => {
            lineCount++;

            // Skip header lines
            if (line.startsWith('#')) return;

            // Parse VCF line
            const parts = line.split('\t');
            if (parts.length < 8) return;

            const [chrom, pos, id, ref, alt, qual, filter, info] = parts;

            // Parse INFO field
            const infoObj = {};
            info.split(';').forEach(item => {
                const [key, value] = item.split('=');
                infoObj[key] = value;
            });

            // Get RS ID - prefer from RS field, fallback to ID if it's an RS
            let rsid = infoObj.RS ? `rs${infoObj.RS}` : null;
            if (!rsid && id && id.toLowerCase().startsWith('rs')) {
                rsid = id.toLowerCase();
            }

            // Skip if no RS ID
            if (!rsid) {
                skippedNoRs++;
                return;
            }

            rsid = rsid.toLowerCase();

            const clnsig = infoObj.CLNSIG || '';
            const clndn = infoObj.CLNDN || '';
            const geneInfo = infoObj.GENEINFO || '';
            const mc = infoObj.MC || ''; // Molecular consequence

            // Only process single nucleotide variants with clinical significance
            if (infoObj.CLNVC !== 'single_nucleotide_variant') return;
            if (!clnsig || clnsig === 'not_provided') return;

            // Create genotype entries
            // For SNVs, we create entries for both homozygous and heterozygous
            const genotypes = {};

            // Homozygous alt
            const homoAlt = alt + alt;
            genotypes[homoAlt] = {
                magnitude: mapSignificanceToMagnitude(clnsig),
                repute: mapSignificanceToRepute(clnsig),
                summary: formatSummary(clndn, geneInfo, clnsig)
            };

            // Heterozygous
            const hetero = ref + alt;
            const heteroReverse = alt + ref;
            genotypes[hetero] = {
                magnitude: Math.max(0, mapSignificanceToMagnitude(clnsig) - 0.5),
                repute: mapSignificanceToRepute(clnsig),
                summary: formatSummary(clndn, geneInfo, clnsig) + ' (heterozygous)'
            };
            genotypes[heteroReverse] = genotypes[hetero];

            // Homozygous ref (usually benign)
            const homoRef = ref + ref;
            genotypes[homoRef] = {
                magnitude: 0,
                repute: 'Good',
                summary: 'Common/normal genotype'
            };

            database[rsid] = {
                chrom: chrom.replace('chr', ''),
                pos: parseInt(pos),
                summary: formatSummary(clndn, geneInfo, clnsig),
                category: inferCategory(geneInfo, clndn, mc),
                genotypes
            };

            snpCount++;

            // Progress update every 100k lines
            if (lineCount % 100000 === 0) {
                console.log(`Processed ${lineCount} lines, ${snpCount} SNPs...`);
            }
        });

        rl.on('close', () => {
            console.log(`\nParsing complete!`);
            console.log(`Total lines: ${lineCount}`);
            console.log(`SNPs with RS IDs: ${snpCount}`);
            console.log(`Skipped (no RS ID): ${skippedNoRs}`);

            // Write output using streaming to avoid memory issues
            console.log(`\nWriting to ${OUTPUT_FILE}...`);

            const writeStream = fs.createWriteStream(OUTPUT_FILE);
            writeStream.write('{');

            const entries = Object.entries(database);
            const totalEntries = entries.length;
            let written = 0;

            for (let i = 0; i < entries.length; i++) {
                const [key, value] = entries[i];
                const jsonEntry = `"${key}":${JSON.stringify(value)}`;

                if (i < entries.length - 1) {
                    writeStream.write(jsonEntry + ',');
                } else {
                    writeStream.write(jsonEntry);
                }

                written++;
                if (written % 100000 === 0) {
                    console.log(`Writing ${written}/${totalEntries}...`);
                }
            }

            writeStream.write('}');
            writeStream.end();

            writeStream.on('finish', () => {
                console.log(`Done! File size: ${(fs.statSync(OUTPUT_FILE).size / 1024 / 1024).toFixed(2)} MB`);
                resolve(database);
            });

            writeStream.on('error', reject);
        });

        rl.on('error', reject);
        gunzip.on('error', reject);
        fileStream.on('error', reject);
    });
}

function formatSummary(clndn, geneInfo, clnsig) {
    let summary = '';

    // Clean up disease name
    if (clndn && clndn !== 'not_provided' && clndn !== 'not_specified') {
        summary = clndn.replace(/_/g, ' ').replace(/\|/g, ', ');
    }

    // Add gene info
    if (geneInfo) {
        const geneName = geneInfo.split(':')[0];
        if (summary) {
            summary += ` (${geneName})`;
        } else {
            summary = `${geneName} variant`;
        }
    }

    // Add significance if notable
    if (clnsig) {
        const sig = clnsig.replace(/_/g, ' ');
        if (sig.toLowerCase().includes('pathogenic')) {
            summary = summary ? `${summary} - ${sig}` : sig;
        }
    }

    return summary || 'ClinVar variant';
}

// Run the parser
parseClinVar()
    .then(() => {
        console.log('\nClinVar database created successfully!');
        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
