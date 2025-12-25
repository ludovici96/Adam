import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_FILE = path.join(__dirname, '../public/data/snpedia.json');
const API_URL = 'https://bots.snpedia.com/api.php';
const USER_AGENT = 'DNACheckerBot/1.0 (Educational; +http://localhost)';

// Configuration
const BATCH_SIZE = 50;
const LIMIT = process.argv.includes('--limit') ? parseInt(process.argv[process.argv.indexOf('--limit') + 1]) : 0;

async function main() {
    console.log(`Starting SNPedia (Genotype-First) Harvester...`);

    // 1. Crawl Category:Is_a_genotype to find all interesting Genotypes
    console.log('Fetching Category:Is_a_genotype list...');
    let genotypeTitles = await getCategoryMembers('Category:Is_a_genotype');

    if (LIMIT > 0) {
        // If limit is 50, we take 50 genotypes.
        console.log(`Limit active: Taking first ${LIMIT} genotypes.`);
        genotypeTitles = genotypeTitles.slice(0, LIMIT);
    }

    const genotypesToFetch = genotypeTitles.map(t => t.title);

    // 2. Derive unique RSIDs from these genotypes
    // Format is usually "Rs1234(A;A)" or "Rs1234(C;T)"
    const rsids = new Set();
    genotypesToFetch.forEach(title => {
        const match = title.match(/^(Rs\d+)/i);
        if (match) {
            // Normalize case just in case
            const rsid = match[1];
            // Access the main page using the exact casing from the genotype title prefix if possible, 
            // but MediaWiki capitalizes first letter automatically.
            rsids.add(rsid);
        }
    });

    const rsidsToFetch = Array.from(rsids);
    console.log(`Identified ${genotypesToFetch.length} genotypes corresponding to ${rsidsToFetch.length} unique SNPs.`);

    // 3. Prepare Master List of Pages to Fetch
    const allPages = [...rsidsToFetch, ...genotypesToFetch];
    console.log(`Total pages to fetch: ${allPages.length}`);

    const db = {};

    // 4. Batch Fetch Content
    let processed = 0;
    for (let i = 0; i < allPages.length; i += BATCH_SIZE) {
        const batch = allPages.slice(i, i + BATCH_SIZE);

        console.log(`Fetching content batch ${Math.ceil((i + 1) / BATCH_SIZE)}/${Math.ceil(allPages.length / BATCH_SIZE)}...`);

        try {
            const pages = await getPageRevisions(batch);

            for (const page of Object.values(pages)) {
                if (!page.revisions || !page.revisions[0]) continue;
                processPageContent(page.title, page.revisions[0]['*'], db);
            }
        } catch (err) {
            console.error(`Error in batch ${i}: ${err.message}`);
        }

        // Rate limit
        await new Promise(r => setTimeout(r, 200));
    }

    // 5. Add Simulated Data for Verification
    if (!db['rs_simulated_Y']) {
        db['rs_simulated_Y'] = {
            chrom: "Y",
            pos: 2781653,
            summary: "Y-DNA Marker (Simulated)",
            category: "ancestry",
            genotypes: {
                "G": { magnitude: 1, repute: "neutral", summary: "Marker present (Simulated Match)" },
                "GG": { magnitude: 1, repute: "neutral", summary: "Marker present (Simulated Match)" }
            }
        };
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(db));
    console.log(`Done! Database saved with ${Object.keys(db).length} SNPs.`);
}

function processPageContent(title, content, db) {
    // Determine if this is an RS page or a Genotype page
    const isGenotypePage = title.includes('(') && title.includes(')');

    // Normalize RSID key (lowercase 'rs')
    let rskey = title.match(/^(Rs\d+)/i)?.[1]?.toLowerCase();

    if (!rskey) return; // Should not happen given our filtering

    // Initialize DB entry if missing
    if (!db[rskey]) {
        db[rskey] = {
            chrom: null,
            pos: null,
            summary: "No summary",
            category: "other",
            genotypes: {}
        };
    }
    const entry = db[rskey];

    if (isGenotypePage) {
        // Parse {{Genotype ...}}
        const parsed = parseGenotypeTemplate(content);
        if (parsed) {
            // Extract alleles from Title "Rs123(A;T)" -> "AT"
            // or from template "allele1=A|allele2=T"

            // Prefer title for mapping key as it matches lookup keys
            const allelesMatch = title.match(/\(([^)]+)\)/);
            let alleles = "??";
            if (allelesMatch) {
                alleles = allelesMatch[1].replace(/[;,\/]/g, '').toUpperCase();
            }

            entry.genotypes[alleles] = parsed;
        }
    } else {
        // RS Page - Parse {{Rsnp ...}} or {{Rsnpbox ...}}
        // Try finding any template starting with Rsnp
        const match = content.match(/{{Rsnp\w*\s*\|([^}]*)}}/i);
        if (match) {
            const metadata = parseTemplateArgs(match[1]);
            // Common keys: chromosome, chr, position, pos, summary, text
            const chrom = metadata.chromosome || metadata.chr;
            const pos = metadata.position || metadata.pos;
            const summary = metadata.summary || metadata.text;

            if (chrom) entry.chrom = normalizeChrom(chrom);
            if (pos) entry.pos = parseInt(pos);
            if (summary) {
                entry.summary = summary;
                entry.category = determineCategory(summary);
            }
        }
    }
}

function parseGenotypeTemplate(text) {
    const match = text.match(/{{Genotype\s*\|([^}]*)}}/i);
    if (!match) return null;

    const meta = parseTemplateArgs(match[1]);
    return {
        magnitude: parseFloat(meta.magnitude || 0),
        repute: meta.repute || "neutral",
        summary: meta.summary || meta.text || ""
    };
}

// Reuse helpers
function parseTemplateArgs(argsString) {
    const args = {};
    const parts = argsString.split('|');
    for (const part of parts) {
        const [key, ...rest] = part.split('=');
        if (key && rest.length > 0) {
            args[key.trim().toLowerCase()] = rest.join('=').trim();
        }
    }
    return args;
}

function normalizeChrom(c) {
    if (!c) return null;
    return String(c).replace(/^(chr)/i, '').replace(/^23$/, 'X').replace(/^24$/, 'Y');
}

function determineCategory(text) {
    if (!text) return 'other';
    text = text.toLowerCase();
    if (text.includes('cancer') || text.includes('disease') || text.includes('risk') || text.includes('syndrome')) return 'health';
    if (text.includes('color') || text.includes('hair') || text.includes('eye') || text.includes('muscle') || text.includes('height')) return 'traits';
    if (text.includes('metabolizer') || text.includes('drug') || text.includes('response')) return 'medications';
    if (text.includes('haplogroup') || text.includes('ancestry')) return 'ancestry';
    return 'other';
}

function fetchJSON(params) {
    return new Promise((resolve, reject) => {
        const query = new URLSearchParams(params).toString();
        const url = `${API_URL}?${query}&format=json`;

        https.get(url, { headers: { 'User-Agent': USER_AGENT } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    // Check for HTML/Error
                    if (data.trim().startsWith('<')) {
                        reject(new Error(`API Error: Received HTML instead of JSON. Status: ${res.statusCode}`));
                        return;
                    }
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

// Updated getCategoryMembers for large lists
async function getCategoryMembers(category) {
    let members = [];
    let continueToken = null;

    do {
        const params = {
            action: 'query',
            list: 'categorymembers',
            cmtitle: category,
            cmlimit: '500',
            cmstartsortkeyprefix: 'Rs'
        };
        if (continueToken) params.cmcontinue = continueToken;

        const res = await fetchJSON(params);
        if (res.query && res.query.categorymembers) {
            members = members.concat(res.query.categorymembers);
        }

        continueToken = res.continue ? res.continue.cmcontinue : null;
        if (LIMIT > 0 && members.length >= LIMIT) break;

    } while (continueToken);

    return members;
}

async function getPageRevisions(titles) {
    // API limits titles per request (usually 50) - our batch size is 50 so this is fine.
    // However, piping many titles: title1|title2...
    const params = {
        action: 'query',
        prop: 'revisions',
        rvprop: 'content',
        titles: titles.join('|')
    };

    const res = await fetchJSON(params);
    return res.query && res.query.pages ? res.query.pages : {};
}

main().catch(console.error);
