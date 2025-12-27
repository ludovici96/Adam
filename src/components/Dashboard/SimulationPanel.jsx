import React from 'react';
import { clsx } from 'clsx';
import { Beaker, Coffee, Hexagon, Wine, Zap } from 'lucide-react';
import { PHARMA_DATABASE } from '../../analysis/PharmacogenomicAnalyzer';

export function SimulationPanel({ activeSimulation, onToggle, pharmaResults }) {
    const vices = [
        { id: 'caffeine', icon: Coffee },
        { id: 'cannabis', icon: Hexagon }, // Leaf icon not available in all lucide versions, Hexagon is chemical-ish
        { id: 'alcohol', icon: Wine },
        { id: 'magnesium', icon: Zap } // Using Zap for energy/supplement
    ];

    return (
        <div className="mb-6">

            <div className="flex gap-2 justify-center flex-wrap">
                {vices.map((vice) => {
                    const isActive = activeSimulation === vice.id;
                    const Icon = vice.icon;
                    const result = pharmaResults ? pharmaResults[vice.id] : null;
                    const label = PHARMA_DATABASE[vice.id].label;

                    return (
                        <button
                            key={vice.id}
                            onClick={() => onToggle(vice.id)}
                            className={clsx(
                                "relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all border",
                                isActive
                                    ? "bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-500/20 dark:border-emerald-500/50 dark:text-emerald-300 shadow-sm"
                                    : "bg-white border-stone-100 text-stone-600 hover:bg-stone-50 dark:bg-white/5 dark:border-white/10 dark:text-stone-300 dark:hover:bg-white/10"
                            )}
                        >
                            <Icon className={clsx("w-4 h-4", isActive ? "text-emerald-500" : "text-stone-400")} />
                            <span className="text-xs font-medium">{label}</span>

                            {/* Metabolic Badge */}
                            {result && isActive && (
                                <span className="absolute -top-2 -right-2 px-1.5 py-0.5 bg-stone-900 text-white dark:bg-white dark:text-stone-900 text-[9px] font-bold rounded-full uppercase tracking-wider shadow-sm">
                                    {result.profile}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
