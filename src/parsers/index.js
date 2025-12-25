/**
 * Parser Factory - Auto-detects DNA file format and returns appropriate parser
 *
 * Supported formats:
 * - 23andMe (tab-separated: rsid, chromosome, position, genotype)
 * - AncestryDNA (tab-separated: rsid, chromosome, position, allele1, allele2)
 * - FTDNA (CSV: RSID, CHROMOSOME, POSITION, RESULT)
 * - VCF (Variant Call Format - standard bioinformatics format)
 * - MyHeritage (similar to AncestryDNA)
 */

import { VCFParser } from './vcf.js';
import { CSVParser } from './csv.js';
import { TwentyThreeParser } from './twentythree.js';
import { AncestryParser } from './ancestry.js';

export const FILE_FORMATS = {
  VCF: 'vcf',
  TWENTYTHREE: '23andme',
  ANCESTRY: 'ancestry',
  FTDNA: 'ftdna',
  MYHERITAGE: 'myheritage',
  UNKNOWN: 'unknown'
};

export class ParserFactory {
  /**
   * Read first N lines of a file for format detection
   */
  static async getFirstLines(file, n = 50) {
    const text = await file.text();
    const lines = text.split('\n').slice(0, n);
    return { lines, fullText: text };
  }

  /**
   * Detect file format from content
   */
  static detectFormat(lines, fileName = '') {
    const content = lines.join('\n');
    const contentLower = content.toLowerCase();
    const fileNameLower = fileName.toLowerCase();

    // VCF detection - most specific
    if (contentLower.includes('##fileformat=vcf') || fileNameLower.endsWith('.vcf')) {
      return FILE_FORMATS.VCF;
    }

    // 23andMe detection
    if (contentLower.includes('23andme') || TwentyThreeParser.detect(lines)) {
      return FILE_FORMATS.TWENTYTHREE;
    }

    // AncestryDNA detection
    if (contentLower.includes('ancestrydna') || AncestryParser.detect(lines)) {
      return FILE_FORMATS.ANCESTRY;
    }

    // FTDNA detection (CSV with specific header)
    if (contentLower.includes('ftdna') ||
        contentLower.includes('family tree dna') ||
        (contentLower.includes('rsid') && content.includes(','))) {
      return FILE_FORMATS.FTDNA;
    }

    // MyHeritage (similar to Ancestry format)
    if (contentLower.includes('myheritage')) {
      return FILE_FORMATS.MYHERITAGE;
    }

    // Fallback detection based on structure
    const firstDataLine = lines.find(l => l.startsWith('rs') || (l.match(/^[^#]/) && l.includes('\t')));

    if (firstDataLine) {
      const tabCols = firstDataLine.split('\t');
      const commaCols = firstDataLine.split(',');

      // Tab-separated with 4 columns = likely 23andMe
      if (tabCols.length === 4 && tabCols[3]?.length <= 2) {
        return FILE_FORMATS.TWENTYTHREE;
      }

      // Tab-separated with 5 columns = likely AncestryDNA
      if (tabCols.length >= 5 && tabCols[3]?.length === 1 && tabCols[4]?.length === 1) {
        return FILE_FORMATS.ANCESTRY;
      }

      // Comma-separated = likely FTDNA
      if (commaCols.length >= 4) {
        return FILE_FORMATS.FTDNA;
      }
    }

    return FILE_FORMATS.UNKNOWN;
  }

  /**
   * Get parser instance for the detected format
   */
  static getParser(format) {
    switch (format) {
      case FILE_FORMATS.VCF:
        return new VCFParser();
      case FILE_FORMATS.TWENTYTHREE:
        return new TwentyThreeParser();
      case FILE_FORMATS.ANCESTRY:
      case FILE_FORMATS.MYHERITAGE:
        return new AncestryParser();
      case FILE_FORMATS.FTDNA:
        return new CSVParser();
      default:
        // Default to 23andMe parser as it's most common
        return new TwentyThreeParser();
    }
  }

  /**
   * Parse a DNA file with auto-detection
   * @param {File} file - The file to parse
   * @returns {Promise<{variants: Array, format: string, stats: Object}>}
   */
  static async parse(file) {
    const startTime = performance.now();

    // Read file and detect format
    const { lines, fullText } = await this.getFirstLines(file, 100);
    const format = this.detectFormat(lines, file.name);

    // Get appropriate parser
    const parser = this.getParser(format);

    // Create a fake file object with the text we already read
    // to avoid reading the file twice
    const fakeFile = {
      text: async () => fullText,
      name: file.name,
      size: file.size
    };

    // Parse variants
    const variants = await parser.parse(fakeFile);

    const endTime = performance.now();

    return {
      variants,
      format,
      stats: {
        totalVariants: variants.length,
        parseTime: ((endTime - startTime) / 1000).toFixed(2),
        fileName: file.name,
        fileSize: file.size,
        detectedFormat: format
      }
    };
  }
}

// Re-export individual parsers
export { VCFParser } from './vcf.js';
export { CSVParser } from './csv.js';
export { TwentyThreeParser } from './twentythree.js';
export { AncestryParser } from './ancestry.js';
