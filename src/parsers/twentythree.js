/**
 * 23andMe Raw Data Parser
 *
 * Format (tab-separated):
 * # rsid	chromosome	position	genotype
 * rs4477212	1	82154	AA
 * rs3094315	1	752566	AG
 *
 * Comments start with #
 * Genotypes are typically 2 letters (AA, AG, etc.) or -- for no-call
 */
export class TwentyThreeParser {
  async parse(file) {
    const text = await file.text();
    const lines = text.split('\n');
    const variants = [];

    for (const line of lines) {
      // Skip comments and empty lines
      if (line.startsWith('#') || !line.trim()) continue;

      // Split by tab (23andMe uses tabs)
      const cols = line.split('\t');
      if (cols.length < 4) continue;

      const [rsid, chromosome, position, genotype] = cols;

      // Skip no-calls
      if (!genotype || genotype === '--' || genotype === '00') continue;

      // Skip internal IDs (23andMe uses i prefix for internal markers)
      if (rsid.startsWith('i')) continue;

      const normalizedGenotype = this.normalizeGenotype(genotype);
      if (!normalizedGenotype) continue;

      variants.push({
        rsid: rsid.toLowerCase(),
        chrom: this.normalizeChrom(chromosome),
        pos: parseInt(position, 10),
        genotype: normalizedGenotype
      });
    }

    return variants;
  }

  normalizeChrom(chrom) {
    return chrom.replace(/^chr/i, '').toUpperCase();
  }

  normalizeGenotype(genotype) {
    if (!genotype || genotype === '--' || genotype === '00') return null;

    // Handle single nucleotide (X/Y chromosome or mitochondrial)
    if (genotype.length === 1) {
      return genotype.toUpperCase() + genotype.toUpperCase();
    }

    // Standard two-letter genotype
    if (genotype.length === 2) {
      return genotype.toUpperCase();
    }

    // Handle insertions/deletions (D/I format)
    if (genotype.includes('D') || genotype.includes('I')) {
      return genotype.toUpperCase();
    }

    return null;
  }

  /**
   * Detect if file content is 23andMe format
   */
  static detect(firstLines) {
    const content = firstLines.join('\n').toLowerCase();

    // 23andMe files have specific header comments
    if (content.includes('23andme')) return true;
    if (content.includes('# rsid') && content.includes('chromosome') && content.includes('genotype')) return true;

    // Check for tab-separated format with rs IDs
    const dataLine = firstLines.find(l => l.startsWith('rs'));
    if (dataLine && dataLine.split('\t').length >= 4) {
      const cols = dataLine.split('\t');
      // Check if last column looks like a genotype (1-2 chars)
      if (cols[3] && cols[3].length <= 2) return true;
    }

    return false;
  }
}
