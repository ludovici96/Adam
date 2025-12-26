import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { FileDiff, ArrowRight, Loader } from 'lucide-react';
import { DropZone } from '../upload/DropZone';
import { DiffViewer } from './DiffViewer';
import { SimilarityScore } from './SimilarityScore';
import { apiClient } from '../../services/api';

export function CompareView() {
    const [file1, setFile1] = useState(null);
    const [file2, setFile2] = useState(null);
    const [results1, setResults1] = useState(null);
    const [results2, setResults2] = useState(null);
    const [processing1, setProcessing1] = useState(false);
    const [processing2, setProcessing2] = useState(false);

    // Process file helper
    const processFile = async (file) => {
        try {
            // Use server API to analyze file
            const data = await apiClient.analyzeFile(file);

            return {
                file,
                matches: data.matches || [],
                // stats isn't strictly needed for comparison logic as it re-calcs, 
                // but we can pass what we have
                stats: data.summary
            };
        } catch (err) {
            console.error('Error processing file:', err);
            return null;
        }
    };

    const handleFile1 = async (file) => {
        setFile1(file);
        if (file) {
            setProcessing1(true);
            const results = await processFile(file);
            setResults1(results);
            setProcessing1(false);
        } else {
            setResults1(null);
        }
    };

    const handleFile2 = async (file) => {
        setFile2(file);
        if (file) {
            setProcessing2(true);
            const results = await processFile(file);
            setResults2(results);
            setProcessing2(false);
        } else {
            setResults2(null);
        }
    };

    const comparison = useMemo(() => {
        if (!results1 || !results2) return null;

        const map1 = new Map(results1.matches.map(m => [m.rsid, m]));
        const map2 = new Map(results2.matches.map(m => [m.rsid, m]));

        const exact = [];
        const partial = [];
        const mismatch = [];
        const unique1 = [];
        const unique2 = [];

        // Helper to compare genotypes
        const compareGenotypes = (g1, g2) => {
            if (!g1 || !g2) return 'mismatch';

            // Helper to get complement
            const getComplement = (seq) => {
                const map = { 'A': 'T', 'T': 'A', 'C': 'G', 'G': 'C' };
                return seq.split('').map(b => map[b] || b).join('');
            };

            const checkMatch = (seq1, seq2) => {
                const a1 = seq1.length === 1 ? [seq1, seq1] : seq1.split('');
                const a2 = seq2.length === 1 ? [seq2, seq2] : seq2.split('');

                const set1 = new Set(a1);
                const set2 = new Set(a2);

                // Exact match (order independent)
                const s1 = a1.sort().join('');
                const s2 = a2.sort().join('');
                if (s1 === s2) return 'exact';

                // Partial match
                const intersection = [...set1].filter(x => set2.has(x));
                if (intersection.length > 0) return 'partial';

                return 'mismatch';
            };

            // 1. Try direct comparison
            const directStatus = checkMatch(g1, g2);
            if (directStatus !== 'mismatch') return directStatus;

            // 2. Try strand flip (complement of g2)
            // e.g. g1="AG", g2="TC" -> flip g2="AG" -> match
            const flippedG2 = getComplement(g2);
            const flippedStatus = checkMatch(g1, flippedG2);

            return flippedStatus;
        };

        // Check intersection and file 1 uniques
        for (const [rsid, match1] of map1) {
            const match2 = map2.get(rsid);
            if (match2) {
                const status = compareGenotypes(match1.genotype, match2.genotype);
                if (status === 'exact') {
                    exact.push({ rsid, match1, match2, status: 'exact' });
                } else if (status === 'partial') {
                    partial.push({ rsid, match1, match2, status: 'partial' });
                } else {
                    mismatch.push({ rsid, match1, match2, status: 'mismatch' });
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

        exact.sort(sortByMag);
        partial.sort(sortByMag);
        mismatch.sort(sortByMag);
        unique1.sort(sortByMag);
        unique2.sort(sortByMag);

        const totalCompared = exact.length + partial.length + mismatch.length;

        // Identity Rate: Exact Genotype Match %
        const identityRate = totalCompared > 0 ? exact.length / totalCompared : 0;

        // Compatibility Rate: % with at least one shared allele (Parent/Child should be ~100%)
        const compatibilityRate = totalCompared > 0 ? (exact.length + partial.length) / totalCompared : 0;

        return {
            exact,
            partial,
            mismatch,
            unique1,
            unique2,
            stats: {
                totalCompared,
                identical: exact.length,
                partial: partial.length,
                different: mismatch.length,
                unique1: unique1.length,
                unique2: unique2.length,
                identityRate,
                compatibilityRate
            }
        };
    }, [results1, results2]);



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
                    processing={processing1}
                />

                {/* File Slot 2 */}
                <FileSlot
                    label="File 2"
                    file={file2}
                    results={results2}
                    onSelect={handleFile2}
                    color="purple"
                    processing={processing2}
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
                            stats={comparison.stats}
                        />

                        <DiffViewer
                            exact={comparison.exact}
                            partial={comparison.partial}
                            mismatch={comparison.mismatch}
                            unique1={comparison.unique1}
                            unique2={comparison.unique2}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function FileSlot({ label, file, results, onSelect, color, processing }) {
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
                {processing && (
                    <span className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                        <Loader className="w-3 h-3 animate-spin" />
                        Processing...
                    </span>
                )}
            </div>

            {!file ? (
                <DropZone onFileSelect={onSelect} />
            ) : (
                <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-[var(--text-primary)] truncate">{file.name}</p>
                            <p className="text-xs text-[var(--text-secondary)]">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                        </div>
                        <button
                            onClick={() => onSelect(null)}
                            disabled={processing}
                            className="text-sm text-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
                        >
                            Change
                        </button>
                    </div>

                    {processing && (
                        <div className="relative h-1.5 w-full bg-stone-100 dark:bg-white/5 rounded-full overflow-hidden">
                            <div className={`absolute inset-0 bg-${color}-500 w-1/3 animate-[shimmer_2s_infinite_linear]`} />
                            {/* Simple animated progress bar */}
                            <motion.div
                                className={`h-full bg-${color}-500`}
                                initial={{ width: "0%" }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default CompareView;
