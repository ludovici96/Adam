import './styles/main.css';
import { Uploader } from './ui/uploader.js';
import { Report } from './ui/report.js';
import { VCFParser } from './parsers/vcf.js';
import { CSVParser } from './parsers/csv.js';
import { Matcher } from './analysis/matcher.js';

document.addEventListener('DOMContentLoaded', () => {
    // Theme Toggle Logic
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
        // Icons handled by CSS
    });

    // Action Buttons
    document.getElementById('new-analysis').addEventListener('click', () => {
        if (confirm('Start a new analysis? Current results will be cleared.')) {
            location.reload();
        }
    });

    document.getElementById('export-report').addEventListener('click', () => {
        window.print();
    });

    const report = new Report();
    new Uploader('dropzone', 'file-input', (file) => handleFileUpload(file, report));
});

async function handleFileUpload(file, report) {
    const ui = {
        uploadSection: document.getElementById('upload-section'),
        processingStatus: document.getElementById('processing-status'),
        progressFill: document.getElementById('progress-fill'),
        processingText: document.getElementById('processing-detail'),
        resultsSection: document.getElementById('results-section')
    };

    ui.uploadSection.querySelector('.upload-container').classList.add('hidden');
    ui.processingStatus.classList.remove('hidden');

    try {
        ui.processingText.textContent = `Parsing ${file.name}...`;
        ui.progressFill.style.width = '10%';

        let parser;
        const name = file.name.toLowerCase();
        if (name.endsWith('.vcf') || name.endsWith('.txt')) {
            parser = new VCFParser();
        } else if (name.endsWith('.csv')) {
            parser = new CSVParser();
        } else {
            throw new Error("Unsupported file format. Please upload .VCF, .CSV, or .TXT");
        }

        const variants = await parser.parse(file);
        ui.progressFill.style.width = '30%';
        ui.processingText.textContent = `Analyzed ${variants.length} variants...`;

        // Load Database
        ui.processingText.textContent = 'Loading SNPedia Database...';
        const response = await fetch('/data/snpedia.json');
        if (!response.ok) throw new Error('Failed to load database. Please run simple harvester script first.');
        const database = await response.json();

        ui.progressFill.style.width = '60%';
        ui.processingText.textContent = 'Matching against SNPedia...';

        const matcher = new Matcher(database);
        const { matches, stats } = matcher.match(variants);

        ui.progressFill.style.width = '100%';
        ui.processingText.textContent = `Found ${matches.length} matches!`;

        await new Promise(resolve => setTimeout(resolve, 800));

        ui.uploadSection.classList.add('hidden');
        ui.processingStatus.classList.add('hidden');
        ui.resultsSection.classList.remove('hidden');

        report.render(matches, variants.length, stats);

    } catch (error) {
        ui.processingText.textContent = 'Error: ' + error.message;
        ui.processingText.style.color = 'var(--danger-color)';
        ui.progressFill.style.backgroundColor = 'var(--danger-color)';
    }
}
