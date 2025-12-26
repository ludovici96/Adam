/**
 * VCF Parser
 * Parses VCF format DNA files
 */

export function parseVCF(content) {
    const lines = content.split('\n');
    const variants = [];

    for (const line of lines) {
        if (line.startsWith('#') || !line.trim()) continue;

        const parts = line.split('\t');
        if (parts.length < 5) continue;

        const [chrom, pos, id, ref, alt] = parts;

        // Extract genotype from FORMAT/SAMPLE columns if present
        let genotype = null;
        if (parts.length >= 10) {
            const format = parts[8].split(':');
            const sample = parts[9].split(':');
            const gtIndex = format.indexOf('GT');

            if (gtIndex !== -1 && sample[gtIndex]) {
                const gt = sample[gtIndex];
                // Convert 0/1 format to actual alleles
                const alleles = [ref, ...alt.split(',')];
                const indices = gt.replace(/[|/]/g, ',').split(',').map(Number);

                genotype = indices
                    .filter(i => !isNaN(i) && alleles[i])
                    .map(i => alleles[i])
                    .join('');
            }
        }

        // Fallback: assume homozygous alt if no genotype
        if (!genotype) {
            genotype = alt.length === 1 ? alt + alt : alt;
        }

        const cleanChrom = chrom.replace(/^chr/i, '');

        let rsid = null;
        if (id && id.toLowerCase().startsWith('rs')) {
            rsid = id.toLowerCase();
        }

        variants.push({
            chrom: cleanChrom,
            pos: parseInt(pos),
            rsid,
            ref,
            alt,
            genotype
        });
    }

    return variants;
}

export default { parseVCF };
