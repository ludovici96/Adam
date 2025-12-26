/**
 * Analysis Routes
 * Handles DNA file upload and analysis
 */

import { Router } from 'express';
import multer from 'multer';
import { parseVCF } from '../parsers/vcf.js';
import { parseCSV } from '../parsers/csv.js';
import { matchVariants } from '../services/matcher.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

router.post('/', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log(`Analyzing file: ${req.file.originalname} (${req.file.size} bytes)`);
        const startTime = Date.now();

        const content = req.file.buffer.toString('utf-8');

        // Detect file type and parse
        const filename = req.file.originalname.toLowerCase();
        let variants;

        if (filename.endsWith('.vcf') || filename.endsWith('.vcf.gz')) {
            variants = parseVCF(content);
        } else if (filename.endsWith('.csv') || filename.endsWith('.txt')) {
            variants = parseCSV(content);
        } else {
            if (content.startsWith('##fileformat=VCF') || content.includes('\t')) {
                variants = parseVCF(content);
            } else {
                variants = parseCSV(content);
            }
        }

        console.log(`  Parsed ${variants.length} variants`);

        const { matches, stats } = matchVariants(variants);

        const categories = {
            health: [],
            traits: [],
            ancestry: [],
            pharmacogenomics: [],
            carrier: [],
            other: []
        };

        for (const match of matches) {
            const cat = match.category || 'other';
            if (categories[cat]) {
                categories[cat].push(match);
            } else {
                categories.other.push(match);
            }
        }

        const analysisTime = Date.now() - startTime;
        console.log(`  Found ${matches.length} matches in ${analysisTime}ms`);

        res.json({
            success: true,
            filename: req.file.originalname,
            analysisTime,
            stats,
            matches,
            categories,
            categoryStats: {
                health: categories.health.length,
                traits: categories.traits.length,
                ancestry: categories.ancestry.length,
                pharmacogenomics: categories.pharmacogenomics.length,
                carrier: categories.carrier.length,
                other: categories.other.length
            }
        });
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ error: 'Analysis failed', message: error.message });
    }
});

export default router;
