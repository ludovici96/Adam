/**
 * CSV Parser
 * Parses CSV format DNA files (23andMe, AncestryDNA, etc.)
 */

export function parseCSV(content) {
    const lines = content.split('\n');
    const variants = [];

    // Detect delimiter (tab or comma)
    const firstDataLine = lines.find(l => !l.startsWith('#') && l.trim());
    const delimiter = firstDataLine?.includes('\t') ? '\t' : ',';

    // Detect header
    let headerLine = lines.find(l =>
        l.toLowerCase().includes('rsid') ||
        l.toLowerCase().includes('chromosome')
    );

    let columns = {};
    if (headerLine) {
        const headers = headerLine.toLowerCase().split(delimiter).map(h => h.trim());
        columns = {
            rsid: headers.findIndex(h => h.includes('rsid') || h === 'snpid'),
            chrom: headers.findIndex(h => h.includes('chrom')),
            pos: headers.findIndex(h => h.includes('pos')),
            genotype: headers.findIndex(h => h.includes('genotype') || h.includes('result') || h.includes('allele'))
        };
    } else {
        // Default columns for 23andMe format
        columns = { rsid: 0, chrom: 1, pos: 2, genotype: 3 };
    }

    for (const line of lines) {
        if (line.startsWith('#') || !line.trim()) continue;
        if (line.toLowerCase().includes('rsid')) continue;

        const parts = line.split(delimiter).map(p => p.trim().replace(/"/g, ''));
        if (parts.length < 4) continue;

        const rsid = parts[columns.rsid]?.toLowerCase();
        const chrom = parts[columns.chrom]?.replace(/^chr/i, '');
        const pos = parseInt(parts[columns.pos]);
        let genotype = parts[columns.genotype];

        if (!rsid?.startsWith('rs')) continue;
        if (!genotype || genotype === '--' || genotype === '00') continue;

        // Handle different genotype formats
        genotype = genotype.toUpperCase().replace(/[^ACGT]/g, '');

        if (!genotype) continue;

        variants.push({
            rsid,
            chrom,
            pos: isNaN(pos) ? null : pos,
            genotype
        });
    }

    return variants;
}

export default { parseCSV };
