import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { FileDiff, ArrowRight, Loader } from 'lucide-react';
import { DropZone } from '../upload/DropZone';
import { DiffViewer } from './DiffViewer';
import { SimilarityScore } from './SimilarityScore';
import { ParserFactory } from '../../parsers';
import { Matcher } from '../../analysis/matcher';

export function CompareView() {
    const [file1, setFile1] = useState(null);
    const [file2, setFile2] = useState(null);
    const [results1, setResults1] = useState(null);
    const [results2, setResults2] = useState(null);

    // Database caching
    const [database, setDatabase] = useState(null);
    const [dbLoading, setDbLoading] = useState(false);

    // Load database once
    useEffect(() => {
        if (!database && !dbLoading) {
            setDbLoading(true);
            fetch('/data/snpedia.json')
                .then(res => res.json())
                .then(data => {
                    setDatabase(data);
                    setDbLoading(false);
                })
                .catch(err => {
                    console.error('Failed to load database:', err);
                    setDbLoading(false);
                });
        }
    }, [database, dbLoading]);

    // Process file helper
    const processFile = async (file) => {
        if (!database) return null;

        try {
            // Parse
            const parseResult = await ParserFactory.parse(file);

            // Match
            const matcher = new Matcher(database);
            const matchResult = matcher.match(parseResult.variants);

            return {
                file,
                variants: parseResult.variants,
                matches: matchResult.matches,
                stats: matchResult.stats
            };
        } catch (err) {
            console.error('Error processing file:', err);
            return null;
        }
    };

    const handleFile1 = async (file) => {
        setFile1(file);
        const results = await processFile(file);
        setResults1(results);
    };

    const handleFile2 = async (file) => {
        setFile2(file);
        const results = await processFile(file);
        setResults2(results);
    };

    const comparison = useMemo(() => {
        if (!results1 || !results2) return null;

        const map1 = new Map(results1.matches.map(m => [m.rsid, m]));
        const map2 = new Map(results2.matches.map(m => [m.rsid, m]));

        const shared = [];
        const different = [];
        const unique1 = [];
        const unique2 = [];

        // Check intersection and file 1 uniques
        for (const [rsid, match1] of map1) {
            const match2 = map2.get(rsid);
            if (match2) {
                if (match1.genotype === match2.genotype) {
                    shared.push({ rsid, match1, match2, status: 'identical' });
                } else {
                    different.push({ rsid, match1, match2, status: 'different' });
                }
            } else {
                unique1.push({ ...match1, rsid });
            }
        }

        // Check file 2 uniques
        for (const [rsid, match2] of map2) {
            if (!map1.has(rsid)) {
                unique2.push({ ...match2, rsid });
            }
        }

        // Sort lists by magnitude
        const sortByMag = (a, b) => {
            const magA = a.magnitude || (a.match1 ? a.match1.magnitude : 0);
            const magB = b.magnitude || (b.match1 ? b.match1.magnitude : 0);
            return (magB || 0) - (magA || 0);
        };

        shared.sort(sortByMag);
        different.sort(sortByMag);
        unique1.sort(sortByMag);
        unique2.sort(sortByMag);

        const totalShared = shared.length + different.length;
        const identityRate = totalShared > 0 ? shared.length / totalShared : 0;

        return {
            shared,
            different,
            unique1,
            unique2,
            stats: {
                totalCompared: totalShared,
                identical: shared.length,
                different: different.length,
                unique1: unique1.length,
                unique2: unique2.length,
                identityRate
            }
        };
    }, [results1, results2]);

    if (dbLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <Loader className="w-8 h-8 text-cyan-500 animate-spin mb-4" />
                <p className="text-[var(--text-secondary)]">Initializing comparison engine...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="text-center">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-indigo-500 mb-2">
                    DNA Comparison
                </h1>
                <p className="text-[var(--text-secondary)]">
                    Compare two DNA files to discover shared traits and genetic differences
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
                {/* File Slot 1 */}
                <FileSlot
                    label="File 1"
                    file={file1}
                    results={results1}
                    onSelect={handleFile1}
                    color="cyan"
                />

                {/* File Slot 2 */}
                <FileSlot
                    label="File 2"
                    file={file2}
                    results={results2}
                    onSelect={handleFile2}
                    color="purple"
                />
            </div>

            <AnimatePresence>
                {comparison && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        className="space-y-8"
                    >
                        <div className="flex items-center gap-4 py-8">
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
                            <div className="px-4 py-1 rounded-full bg-cyan-500/10 text-cyan-500 text-sm font-medium border border-cyan-500/20">
                                Analysis Results
                            </div>
                            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent" />
                        </div>

                        <SimilarityScore
                            identityRate={comparison.stats.identityRate}
                            stats={comparison.stats}
                        />

                        <DiffViewer
                            shared={comparison.shared}
                            different={comparison.different}
                            unique1={comparison.unique1}
                            unique2={comparison.unique2}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function FileSlot({ label, file, results, onSelect, color }) {
    const isSelected = !!file;

    return (
        <div className={clsx(
            'relative p-6 rounded-2xl transition-all duration-300',
            isSelected
                ? `bg-${color}-500/5 border-${color}-500/20 border-2`
                : 'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10'
        )}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{label}</h3>
                {results && (
                    <span className={`text-xs px-2 py-1 rounded-full bg-${color}-500/10 text-${color}-500`}>
                        {results.matches.length.toLocaleString()} SNPs
                    </span>
                )}
            </div>

            {!file ? (
                <DropZone onFileSelect={onSelect} />
            ) : (
                <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                    <div className="flex-1 min-w-0">
                        <p className="font-medium text-[var(--text-primary)] truncate">{file.name}</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                    </div>
                    <button
                        onClick={() => onSelect(null)}
                        className="text-sm text-red-400 hover:text-red-500 transition-colors"
                    >
                        Change
                    </button>
                </div>
            )}
        </div>
    );
}

export default CompareView;
