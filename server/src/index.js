/**
 * DNA Genesis - Backend API Server
 * Provides SNP analysis with merged SNPedia + ClinVar databases
 */

import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { databaseService } from './services/database.js';
import analyzeRoutes from './routes/analyze.js';
import snpRoutes from './routes/snp.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
    origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
    credentials: true
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        database: databaseService.isLoaded ? 'loaded' : 'loading',
        stats: databaseService.getStats()
    });
});

app.get('/api/stats', (req, res) => {
    res.json(databaseService.getStats());
});

app.use('/api/analyze', analyzeRoutes);
app.use('/api/snp', snpRoutes);

app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

async function start() {
    console.log('╔═══════════════════════════════════════════════╗');
    console.log('║       DNA Genesis - Backend API Server        ║');
    console.log('╚═══════════════════════════════════════════════╝\n');

    try {
        await databaseService.load();

        app.listen(PORT, () => {
            console.log(`\n🚀 Server running on http://localhost:${PORT}`);
            console.log(`   Health: http://localhost:${PORT}/api/health`);
            console.log(`   Stats:  http://localhost:${PORT}/api/stats`);
            console.log(`\n📡 Ready to receive requests!\n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

start();
