/**
 * SNP Routes
 * Handles SNP lookup and search
 */

import { Router } from 'express';
import { databaseService } from '../services/database.js';

const router = Router();

router.get('/:rsid', (req, res) => {
    const { rsid } = req.params;

    if (!rsid) {
        return res.status(400).json({ error: 'RSID required' });
    }

    const snp = databaseService.getSNP(rsid);

    if (!snp) {
        return res.status(404).json({ error: 'SNP not found', rsid });
    }

    res.json({
        rsid: rsid.toLowerCase(),
        ...snp
    });
});

router.get('/', (req, res) => {
    const { q, limit = 50 } = req.query;

    if (!q || q.length < 2) {
        return res.status(400).json({ error: 'Search query must be at least 2 characters' });
    }

    const results = databaseService.search(q, parseInt(limit));

    res.json({
        query: q,
        count: results.length,
        results
    });
});

export default router;
