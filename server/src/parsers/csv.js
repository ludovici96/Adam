/**
 * CSV Parser
 * Parses CSV format DNA files (23andMe, AncestryDNA, etc.)
 */

export function parseCSV(content) {
    // Normalize line endings (handle Windows CRLF)
    const normalizedContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = normalizedContent.split('\n');
    const variants = [];

    console.log(`  [CSV Parser] Total lines: ${lines.length}`);
    console.log(`  [CSV Parser] First 3 non-comment lines:`);
    let shownLines = 0;
    for (const l of lines) {
        if (shownLines >= 3) break;
        if (!l.startsWith('#')) {
            console.log(`    ${shownLines}: "${l.substring(0, 120)}"`);
            shownLines++;
        }
    }

    // Detect delimiter (tab or comma)
    const firstDataLine = lines.find(l => !l.startsWith('#') && l.trim());
    const delimiter = firstDataLine?.includes('\t') ? '\t' : ',';
    console.log(`  [CSV Parser] Delimiter: ${delimiter === '\t' ? 'TAB' : 'COMMA'}`);

    // Detect header (exclude comment lines starting with #)
    let headerLine = lines.find(l =>
        !l.startsWith('#') &&
        (l.toLowerCase().includes('rsid') || l.toLowerCase().includes('chromosome'))
    );
    console.log(`  [CSV Parser] Header found: ${headerLine ? 'YES' : 'NO'}`);
    if (headerLine) {
        console.log(`  [CSV Parser] Header: "${headerLine.substring(0, 120)}"`);
    }

    let columns = {};
    let isAncestryFormat = false;

    if (headerLine) {
        const headers = headerLine.toLowerCase().split(delimiter).map(h => h.trim());
        console.log(`  [CSV Parser] Parsed headers: ${JSON.stringify(headers)}`);

        // Check for AncestryDNA format (allele1, allele2)
        const allele1Idx = headers.findIndex(h => h.includes('allele1'));
        const allele2Idx = headers.findIndex(h => h.includes('allele2'));
        console.log(`  [CSV Parser] allele1 idx: ${allele1Idx}, allele2 idx: ${allele2Idx}`);

        if (allele1Idx !== -1 && allele2Idx !== -1) {
            isAncestryFormat = true;
            columns = {
                rsid: headers.findIndex(h => h.includes('rsid') || h === 'snpid'),
                chrom: headers.findIndex(h => h.includes('chrom')),
                pos: headers.findIndex(h => h.includes('pos')),
                allele1: allele1Idx,
                allele2: allele2Idx
            };
        } else {
            columns = {
                rsid: headers.findIndex(h => h.includes('rsid') || h === 'snpid'),
                chrom: headers.findIndex(h => h.includes('chrom')),
                pos: headers.findIndex(h => h.includes('pos')),
                genotype: headers.findIndex(h => h.includes('genotype') || h.includes('result') || h.includes('allele'))
            };
        }
    } else {
        // Default columns for 23andMe format
        columns = { rsid: 0, chrom: 1, pos: 2, genotype: 3 };
    }

    // Auto-detect AncestryDNA format by column count if no header detection
    if (!isAncestryFormat && firstDataLine) {
        const parts = firstDataLine.split(delimiter);
        if (parts.length >= 5 && parts[3]?.length === 1 && parts[4]?.length === 1) {
            isAncestryFormat = true;
            columns = { rsid: 0, chrom: 1, pos: 2, allele1: 3, allele2: 4 };
        }
    }

    console.log(`  [CSV Parser] Format: ${isAncestryFormat ? 'AncestryDNA' : 'Standard'}`);
    console.log(`  [CSV Parser] Column mapping: ${JSON.stringify(columns)}`);

    let skippedComment = 0;
    let skippedHeader = 0;
    let skippedShort = 0;
    let skippedNoRsid = 0;
    let skippedBadGenotype = 0;

    for (const line of lines) {
        if (line.startsWith('#') || !line.trim()) {
            skippedComment++;
            continue;
        }
        if (line.toLowerCase().includes('rsid') && line.toLowerCase().includes('chrom')) {
            skippedHeader++;
            continue;
        }

        const parts = line.split(delimiter).map(p => p.trim().replace(/"/g, ''));
        if (parts.length < 4) {
            skippedShort++;
            continue;
        }

        const rsid = parts[columns.rsid]?.toLowerCase();
        const chrom = parts[columns.chrom]?.replace(/^chr/i, '');
        const pos = parseInt(parts[columns.pos]);

        let genotype;
        if (isAncestryFormat) {
            const allele1 = parts[columns.allele1];
            const allele2 = parts[columns.allele2];
            if (!allele1 || !allele2 || allele1 === '0' || allele2 === '0') {
                skippedBadGenotype++;
                continue;
            }
            genotype = (allele1 + allele2).toUpperCase();
        } else {
            genotype = parts[columns.genotype];
        }

        if (!rsid?.startsWith('rs')) {
            skippedNoRsid++;
            continue;
        }
        if (!genotype || genotype === '--' || genotype === '00') {
            skippedBadGenotype++;
            continue;
        }

        genotype = genotype.toUpperCase().replace(/[^ACGT]/g, '');
        if (!genotype) {
            skippedBadGenotype++;
            continue;
        }

        variants.push({
            rsid,
            chrom,
            pos: isNaN(pos) ? null : pos,
            genotype
        });
    }

    console.log(`  [CSV Parser] Skip stats: comments=${skippedComment}, headers=${skippedHeader}, short=${skippedShort}, no-rsid=${skippedNoRsid}, bad-genotype=${skippedBadGenotype}`);
    console.log(`  [CSV Parser] Parsed ${variants.length} variants`);

    return variants;
}

export default { parseCSV };
