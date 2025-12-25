import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INPUT_FILE = process.argv[2];
const OUTPUT_DIR = path.join(__dirname, '../public/data');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'snpedia.json');

if (!INPUT_FILE) {
    console.error('Please provide the path to the input JSON file.');
    console.error('Usage: node scripts/build_database.js <path-to-input.json>');
    process.exit(1);
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log(`Processing ${INPUT_FILE}...`);

try {
    const rawData = fs.readFileSync(INPUT_FILE, 'utf8');
    const sourceData = JSON.parse(rawData);

    // Transform data
    // Expected structure varies by dump source, but assuming array of objects or object map
    // Adapting to common Zenodo structure: keys are rsids

    const optimizedDB = {};
    let count = 0;

    // Helper to normalize coordinates
    const normalizeChrom = (c) => String(c).replace(/^(chr)/i, '').replace(/^23$/, 'X').replace(/^24$/, 'Y');

    const entries = Array.isArray(sourceData) ? sourceData : Object.entries(sourceData);

    for (const item of entries) {
        // Handle both array [key, val] and object { ... } inputs
        let data = Array.isArray(sourceData) ? item : item[1];
        let rsid = Array.isArray(sourceData) ? (data.rsid || data.name) : item[0];

        if (!rsid) continue;
        if (!rsid.startsWith('rs')) continue; // Skip non-rs pages

        // Extract coordinates if available (often in metadata or separate fields)
        // Adjust these field accessors based on the actual dump format
        let chrom = data.chromosome || data.chr;
        let pos = data.position || data.pos;

        const entry = {
            chrom: chrom ? normalizeChrom(chrom) : null,
            pos: pos ? parseInt(pos) : null,
            summary: data.summary || data.text || "No summary available",
            category: determineCategory(data.summary || ""),
            genotypes: {}
        };

        // Process genotypes (often stored as "genotypes" object or list)
        if (data.genotypes) {
            for (const [gt, details] of Object.entries(data.genotypes)) {
                entry.genotypes[gt] = {
                    magnitude: parseFloat(details.magnitude || 0),
                    repute: details.repute || "neutral",
                    summary: details.summary || details.text || ""
                };
            }
        }

        // Only include if we have useful data (genotypes or coordinates)
        if (Object.keys(entry.genotypes).length > 0 || (entry.chrom && entry.pos)) {
            optimizedDB[rsid] = entry;
            count++;
        }
    }

    // Add our simulated Big Y marker for testing integrity if not present
    if (!optimizedDB['rs_simulated_Y']) {
        optimizedDB['rs_simulated_Y'] = {
            chrom: "Y",
            pos: 2781653,
            summary: "Y-DNA Marker (Simulated)",
            category: "ancestry",
            genotypes: {
                "G": { magnitude: 1, repute: "neutral", summary: "Marker present (Simulated Match)" },
                "GG": { magnitude: 1, repute: "neutral", summary: "Marker present (Simulated Match)" }
            }
        };
        console.log('Added simulated Y-marker for testing.');
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(optimizedDB));
    console.log(`Success! Database built with ${count} entries.`);
    console.log(`Saved to: ${OUTPUT_FILE}`);

} catch (error) {
    console.error('Error processing file:', error.message);
    process.exit(1);
}

function determineCategory(text) {
    text = text.toLowerCase();
    if (text.includes('cancer') || text.includes('disease') || text.includes('risk') || text.includes('syndrome')) return 'health';
    if (text.includes('color') || text.includes('hair') || text.includes('eye') || text.includes('muscle') || text.includes('height')) return 'traits';
    if (text.includes('metabolizer') || text.includes('drug') || text.includes('response')) return 'medications';
    if (text.includes('haplogroup') || text.includes('ancestry')) return 'ancestry';
    return 'other';
}
