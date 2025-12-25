/**
 * AncestryDNA Raw Data Parser
 *
 * Format (tab-separated):
 * rsid	chromosome	position	allele1	allele2
 * rs4477212	1	82154	A	A
 * rs3094315	1	752566	A	G
 *
 * Header line starts with "rsid"
 * Alleles are separated into two columns
 */
export class AncestryParser {
  async parse(file) {
    const text = await file.text();
    const lines = text.split('\n');
    const variants = [];

    let headerFound = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Skip comments
      if (trimmed.startsWith('#')) continue;

      // Detect header line
      if (trimmed.toLowerCase().startsWith('rsid')) {
        headerFound = true;
        continue;
      }

      // Skip lines before header
      if (!headerFound) continue;

      // Split by tab
      const cols = trimmed.split('\t');
      if (cols.length < 5) continue;

      const [rsid, chromosome, position, allele1, allele2] = cols;

      // Skip no-calls
      if (allele1 === '0' || allele2 === '0') continue;
      if (!allele1 || !allele2) continue;

      // Skip internal IDs
      if (rsid.startsWith('i') || !rsid.startsWith('rs')) continue;

      const genotype = (allele1 + allele2).toUpperCase();

      variants.push({
        rsid: rsid.toLowerCase(),
        chrom: this.normalizeChrom(chromosome),
        pos: parseInt(position, 10),
        genotype
      });
    }

    return variants;
  }

  normalizeChrom(chrom) {
    return chrom.replace(/^chr/i, '').toUpperCase();
  }

  /**
   * Detect if file content is AncestryDNA format
   */
  static detect(firstLines) {
    const content = firstLines.join('\n').toLowerCase();

    // AncestryDNA files have specific header
    if (content.includes('ancestrydna')) return true;

    // Check for header with 5 columns: rsid, chromosome, position, allele1, allele2
    const headerLine = firstLines.find(l =>
      l.toLowerCase().includes('rsid') &&
      l.toLowerCase().includes('allele1') &&
      l.toLowerCase().includes('allele2')
    );

    if (headerLine) return true;

    // Check for tab-separated format with 5 columns where last 2 are single chars
    const dataLine = firstLines.find(l => l.startsWith('rs') && l.split('\t').length >= 5);
    if (dataLine) {
      const cols = dataLine.split('\t');
      if (cols[3]?.length === 1 && cols[4]?.length === 1) return true;
    }

    return false;
  }
}
