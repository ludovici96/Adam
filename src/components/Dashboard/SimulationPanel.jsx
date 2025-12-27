import React from 'react';
import { clsx } from 'clsx';
import { Coffee, Hexagon, Wine, Zap, Cigarette, Cookie, Info } from 'lucide-react';
import { PHARMA_DATABASE } from '../../analysis/PharmacogenomicAnalyzer';
import { motion, AnimatePresence } from 'framer-motion';

export function SimulationPanel({ activeSubstances, onUpdate, pharmaResults }) {
    // Helper to toggle a substance
    const handleToggle = (id) => {
        const next = { ...activeSubstances };
        if (next[id]) {
            delete next[id];
        } else {
            // Default dosages
            const defaults = {
                caffeine: 'Med',
                alcohol: 2,
                cannabis: 'Micro',
                magnesium: 'Daily',
                nicotine: 'Low',
                sugar: 'High'
            };
            next[id] = defaults[id] || true;
        }
        onUpdate(next);
    };

    // Helper to change dosage
    const handleDosage = (id, value) => {
        onUpdate({ ...activeSubstances, [id]: value });
    };

    const vices = [
        { id: 'caffeine', icon: Coffee, controls: ['Low', 'Med', 'High'] },
        { id: 'alcohol', icon: Wine, controls: [1, 2, 3, 4, 5], labelFn: (v) => `${v} Drink${v > 1 ? 's' : ''}` },
        { id: 'cannabis', icon: Hexagon, controls: ['Micro', 'Macro', 'High'] },
        { id: 'nicotine', icon: Cigarette, controls: ['Low', 'Chain'] },
        { id: 'sugar', icon: Cookie, controls: ['Normal', 'Binge'] }, // Cookie or similar
        { id: 'magnesium', icon: Zap, controls: ['Daily'] }
    ];

    return (
        <div className="space-y-4 mb-6">
            {/* Main Selector */}
            <div className="flex gap-2 justify-center flex-wrap">
                {vices.map((vice) => {
                    const isActive = !!activeSubstances[vice.id];
                    const Icon = vice.icon;
                    const result = pharmaResults ? pharmaResults[vice.id] : null;
                    const dbEntry = PHARMA_DATABASE[vice.id];
                    const label = dbEntry?.label || vice.id;

                    return (
                        <motion.button
                            key={vice.id}
                            onClick={() => handleToggle(vice.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={clsx(
                                "relative flex flex-col items-center justify-center gap-1.5 px-5 py-4 rounded-3xl transition-all border group min-w-[100px]",
                                isActive
                                    ? "bg-emerald-50/50 border-emerald-200/50 text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-50 shadow-sm"
                                    : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300 dark:bg-white/5 dark:border-white/10 dark:text-stone-400 dark:hover:bg-white/10 dark:hover:border-white/20"
                            )}
                        >
                            <div className="flex items-center gap-2">
                                <Icon className={clsx("w-5 h-5", isActive ? "text-emerald-700 dark:text-emerald-400" : "text-stone-400 group-hover:text-stone-600 dark:group-hover:text-stone-200")} />
                                <span className="text-sm font-bold tracking-tight">{label}</span>
                            </div>

                            {/* Active Indicator: Genetic Label OR Standard Bar */}
                            {isActive && (
                                <div className="mt-1 h-5 flex items-center justify-center">
                                    {result && result.profile !== 'Normal' ? (
                                        <motion.span
                                            initial={{ scale: 0, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className={clsx(
                                                "px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider shadow-sm",
                                                result.profile === 'Risk' || result.profile === 'Slow' || result.profile === 'Psychosis' || result.profile === 'Flush'
                                                    ? "bg-rose-500 text-white animate-pulse"
                                                    : "bg-amber-400 text-amber-900"
                                            )}
                                        >
                                            {result.profile}
                                        </motion.span>
                                    ) : (
                                        <motion.div
                                            initial={{ scaleX: 0, opacity: 0 }}
                                            animate={{ scaleX: 1, opacity: 1 }}
                                            className="w-8 h-1 bg-stone-900 dark:bg-white rounded-full"
                                            transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                        />
                                    )}
                                </div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Dosage Controls for Active Substances */}
            <AnimatePresence>
                {Object.entries(activeSubstances).map(([key, value]) => {
                    const vice = vices.find(v => v.id === key);
                    if (!vice || !vice.controls) return null;

                    return (
                        <motion.div
                            key={key}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-stone-50 dark:bg-stone-800/50 rounded-lg p-3 flex items-center justify-between gap-4"
                        >
                            <div className="flex items-center gap-2 text-xs font-medium text-stone-500 dark:text-stone-400">
                                <vice.icon className="w-3 h-3" />
                                <span className="uppercase tracking-wider">{PHARMA_DATABASE[key].label} Dosage</span>
                            </div>

                            <div className="flex bg-white dark:bg-stone-900/50 rounded-lg p-1 border border-stone-200 dark:border-stone-700/50">
                                {vice.controls.map((opt) => (
                                    <motion.button
                                        key={opt}
                                        onClick={() => handleDosage(key, opt)}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className={clsx(
                                            "px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                                            value === opt
                                                ? "bg-emerald-500 text-white shadow-sm"
                                                : "text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200"
                                        )}
                                    >
                                        {vice.labelFn ? vice.labelFn(opt) : opt}
                                    </motion.button>
                                ))}
                            </div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
}
