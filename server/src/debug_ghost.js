import { databaseService } from './services/database.js';
import { matchVariants } from './services/matcher.js';

async function debug() {
    try {
        await databaseService.load();

        const mockVariants = [
            { rsid: 'rs193922807', chrom: '19', pos: '38990371', genotype: 'GG' }
        ];

        console.log('Running matcher on mock variants:', mockVariants);

        // Verify loaded data
        const snp1 = databaseService.getSNP('rs193922807');
        console.log('\n--- DATABASE ENTRY: rs193922807 ---');
        if (snp1) {
            console.log('Genotypes:', snp1.genotypes);
        } else {
            console.log('Not found in DB');
        }

        const { matches } = matchVariants(mockVariants);

        console.log('\n--- MATCH RESULTS ---');
        matches.forEach(m => {
            console.log(`RSID: ${m.rsid}`);
            console.log(`Mag: ${m.magnitude}`);
            console.log(`Summary: ${m.summary}`);
            console.log('-------------------');
        });

    } catch (error) {
        console.error('Debug failed:', error);
    }
}

debug();
