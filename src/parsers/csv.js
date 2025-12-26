export class CSVParser {
    async parse(file) {
        const text = await file.text();
        const lines = text.split('\n');
        const variants = [];

        let startIndex = 0;
        if (lines[0].toLowerCase().includes('rsid') && lines[0].toLowerCase().includes('position')) {
            startIndex = 1;
        }

        for (let i = startIndex; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const cols = line.split(',');
            if (cols.length < 4) continue;

            const cleanCols = cols.map(c => c.replace(/^"|"$/g, ''));

            const rsid = cleanCols[0];
            const chrom = cleanCols[1];
            const pos = cleanCols[2];
            const result = cleanCols[3];

            if (result === '--' || !result) continue;

            variants.push({
                rsid: rsid,
                chrom: this.normalizeChrom(chrom),
                pos: parseInt(pos),
                genotype: result.toUpperCase()
            });
        }

        return variants;
    }

    normalizeChrom(chrom) {
        return chrom.replace(/^chr/i, '');
    }
}
