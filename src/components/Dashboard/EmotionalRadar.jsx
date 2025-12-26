import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Brain, ChevronDown, ChevronUp, Dna, Activity } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import { RadarChart } from '../visualizations/RadarChart';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const CONFIDENCE_LABELS = {
  high: { label: 'High confidence', color: 'text-teal-600 dark:text-teal-400' },
  moderate: { label: 'Moderate confidence', color: 'text-amber-600 dark:text-amber-400' },
  low: { label: 'Low confidence', color: 'text-stone-500 dark:text-stone-400' },
  insufficient: { label: 'Limited data', color: 'text-red-500 dark:text-red-400' }
};

export function EmotionalRadar() {
  const { emotionalProfile } = useAnalysis();
  const [expandedSystem, setExpandedSystem] = useState(null);

  // Don't render if no data or very low coverage
  if (!emotionalProfile || emotionalProfile.coverage < 0.1) {
    return null;
  }

  const { systems, archetype, radarData, overallConfidence, coverage } = emotionalProfile;
  const confidenceInfo = CONFIDENCE_LABELS[overallConfidence] || CONFIDENCE_LABELS.insufficient;

  return (
    <motion.div variants={itemVariants}>
      <div className={clsx(
        'p-5 rounded-2xl',
        'bg-gray-50 dark:bg-white/5 backdrop-blur-sm',
        'border border-gray-200 dark:border-white/10'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20">
              <Dna className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] font-serif">
                Neurochemistry Profile
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Biological systems analysis
              </p>
            </div>
          </div>
          <div className={clsx('text-xs', confidenceInfo.color)}>
            {confidenceInfo.label}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="mb-4">
          <RadarChart
            data={radarData}
            size={280}
            animated={true}
            showLabels={true}
            showValues={false}
            colors={{
              fill: '#6366f1', // Indigo
              stroke: '#6366f1',
              points: '#818cf8',
            }}
          />
        </div>

        {/* Archetype / Summary Display */}
        <div className="text-center mb-5 py-3 rounded-xl bg-white/5 dark:bg-black/10">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-indigo-500" />
            <span className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              System Archetype
            </span>
          </div>
          <div className="text-2xl font-bold font-serif text-[var(--text-primary)] tracking-wide">
            {archetype.name}
          </div>
          <p className="text-xs text-[var(--text-secondary)]/80 mt-2 max-w-xs mx-auto px-4 leading-relaxed">
            {archetype.description}
          </p>
        </div>

        {/* Neurochemical Breakdown */}
        <div className="space-y-2">
          {Object.entries(systems).map(([key, system]) => {
            const isExpanded = expandedSystem === key;
            const scorePercent = Math.round(system.score * 100);

            // Determine which pole the user leans towards
            const leanLabel = system.score > 0.5 ? system.polarLabels[1] : system.polarLabels[0];

            return (
              <div
                key={key}
                className="rounded-lg bg-white/5 dark:bg-black/10 overflow-hidden border border-transparent hover:border-white/10 transition-colors"
              >
                <button
                  onClick={() => setExpandedSystem(isExpanded ? null : key)}
                  className="w-full p-2.5 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1.5 h-8 rounded-full"
                      style={{ backgroundColor: system.color }}
                    />
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {system.label}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {leanLabel}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Expanded SNP details */}
                <AnimatePresence>
                  {isExpanded && system.details && system.details.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden bg-black/5 dark:bg-black/20"
                    >
                      <div className="px-3 py-3 space-y-3">
                        <p className="text-xs text-[var(--text-secondary)] italic">
                          {system.description}
                        </p>

                        <div className="space-y-2">
                          <div className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)]">
                            Contributing Variants
                          </div>
                          {system.details.map((detail, i) => (
                            <div
                              key={i}
                              className="text-xs p-2 rounded bg-white/40 dark:bg-white/5 backdrop-blur-sm"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-mono text-[var(--text-primary)] font-semibold">
                                  {detail.gene} <span className="font-normal opacity-70">({detail.rsid})</span>
                                </span>
                                <span className="font-mono text-[var(--text-secondary)]">
                                  {detail.genotype}
                                </span>
                              </div>
                              <div className="text-[10px] text-[var(--text-secondary)] leading-tight">
                                {detail.reference}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Coverage indicator */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex justify-between items-center text-xs text-[var(--text-secondary)]">
            <span>Genetic markers found</span>
            <span>{Math.round(coverage * 100)}% coverage</span>
          </div>
          <div className="mt-1.5 h-1 rounded-full bg-white/10 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-indigo-500"
              initial={{ width: 0 }}
              animate={{ width: `${coverage * 100}%` }}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
          </div>
        </div>

        {/* Scientific Disclaimer */}
        <p className="text-[10px] text-[var(--text-secondary)]/40 mt-3 text-center leading-relaxed">
          Based on common genetic variants correlated with neurotransmitter function. This is not a medical test or a diagnosis.
        </p>
      </div>
    </motion.div>
  );
}

export default EmotionalRadar;
