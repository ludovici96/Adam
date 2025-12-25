export class VCFParser {
    async parse(file) {
        const text = await file.text();
        const lines = text.split('\n');
        const variants = [];

        let headerFound = false;

        for (const line of lines) {
            if (line.startsWith('##')) continue;

            if (line.startsWith('#CHROM')) {
                headerFound = true;
                continue;
            }

            if (!headerFound || !line.trim()) continue;

            const cols = line.split('\t');
            if (cols.length < 10) continue;

            const chrom = this.normalizeChrom(cols[0]);
            const pos = cols[1];
            const id = cols[2];
            const ref = cols[3];
            const alt = cols[4];
            const formatStr = cols[8];
            const sampleStr = cols[9];

            const formatKeys = formatStr.split(':');
            const gtIndex = formatKeys.indexOf('GT');
            const sampleValues = sampleStr.split(':');
            const gt = gtIndex !== -1 ? sampleValues[gtIndex] : './.';

            if (gt && gt !== './.') {
                const genotype = this.parseGenotype(gt, ref, alt);
                if (genotype) {
                    variants.push({
                        rsid: id !== '.' ? id : null,
                        chrom,
                        pos: parseInt(pos),
                        genotype
                    });
                }
            }
        }

        return variants;
    }

    normalizeChrom(chrom) {
        return chrom.replace(/^chr/i, '').replace(/^chromosome/i, '');
    }

    parseGenotype(gt, ref, alt) {
        const alleles = [ref, ...alt.split(',')];
        const indices = gt.split(/[|/]/).map(i => parseInt(i));

        if (indices.some(isNaN)) return null;

        const a1 = alleles[indices[0]];
        const a2 = alleles[indices[1]];

        return (a1 + a2).toUpperCase();
    }
}
