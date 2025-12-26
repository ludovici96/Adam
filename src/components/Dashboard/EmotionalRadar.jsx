import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Brain, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import { RadarChart } from '../visualizations/RadarChart';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const DIMENSION_COLORS = {
  'E/I': '#C17817', // Amber - energy
  'S/N': '#2D8B7A', // Teal - information
  'T/F': '#78716C', // Stone - decisions
  'J/P': '#4A5568'  // Slate - lifestyle
};

const CONFIDENCE_LABELS = {
  high: { label: 'High confidence', color: 'text-teal-600 dark:text-teal-400' },
  moderate: { label: 'Moderate confidence', color: 'text-amber-600 dark:text-amber-400' },
  low: { label: 'Low confidence', color: 'text-stone-500 dark:text-stone-400' },
  insufficient: { label: 'Limited data', color: 'text-red-500 dark:text-red-400' }
};

export function EmotionalRadar() {
  const { emotionalProfile } = useAnalysis();
  const [expandedDimension, setExpandedDimension] = useState(null);

  // Don't render if no data or very low coverage
  if (!emotionalProfile || emotionalProfile.coverage < 0.1) {
    return null;
  }

  const { dimensions, mbtiType, typeProfile, radarData, overallConfidence, coverage } = emotionalProfile;
  const confidenceInfo = CONFIDENCE_LABELS[overallConfidence] || CONFIDENCE_LABELS.insufficient;

  return (
    <motion.div variants={itemVariants}>
      <div className={clsx(
        'p-6 rounded-2xl',
        'bg-gray-50 dark:bg-white/5 backdrop-blur-sm',
        'border border-gray-200 dark:border-white/10'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20">
              <Brain className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] font-serif">
                Personality Insights
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Emotional Radar
              </p>
            </div>
          </div>
          <div className={clsx('text-xs', confidenceInfo.color)}>
            {confidenceInfo.label}
          </div>
        </div>

        {/* Radar Chart */}
        <div className="mb-6">
          <RadarChart
            data={radarData}
            size={280}
            animated={true}
            showLabels={true}
            showValues={false}
          />
        </div>

        {/* MBTI Type Display */}
        <div className="text-center mb-6 py-4 rounded-xl bg-white/5 dark:bg-black/10">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs uppercase tracking-wider text-[var(--text-secondary)]">
              Personality Type
            </span>
          </div>
          <div className="text-4xl font-bold font-serif text-[var(--text-primary)] tracking-widest">
            {mbtiType}
          </div>
          <div className="text-sm text-[var(--text-secondary)] mt-1 font-medium">
            {typeProfile.name}
          </div>
          <p className="text-xs text-[var(--text-secondary)]/70 mt-2 max-w-xs mx-auto px-4">
            {typeProfile.description}
          </p>
          {typeProfile.strengths && typeProfile.strengths.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {typeProfile.strengths.slice(0, 3).map((strength, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400"
                >
                  {strength}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Dimension Breakdown */}
        <div className="space-y-2">
          <h4 className="text-xs uppercase tracking-wider text-[var(--text-secondary)] mb-3">
            Trait Dimensions
          </h4>
          {Object.entries(dimensions).map(([key, dim]) => {
            const isExpanded = expandedDimension === key;
            const strength = Math.round(Math.abs(dim.score - 0.5) * 200);

            return (
              <div
                key={key}
                className="rounded-lg bg-white/5 dark:bg-black/10 overflow-hidden border border-transparent hover:border-white/10 transition-colors"
              >
                <button
                  onClick={() => setExpandedDimension(isExpanded ? null : key)}
                  className="w-full p-3 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1.5 h-8 rounded-full"
                      style={{ backgroundColor: DIMENSION_COLORS[key] }}
                    />
                    <div>
                      <div className="text-sm font-medium text-[var(--text-primary)]">
                        {dim.polarLabels[0]} / {dim.polarLabels[1]}
                      </div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        {dim.description}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xl font-bold font-serif text-[var(--text-primary)]">
                        {dim.letter}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] ml-2">
                        {strength}%
                      </span>
                    </div>
                    {dim.details && dim.details.length > 0 && (
                      isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
                      )
                    )}
                  </div>
                </button>

                {/* Expanded SNP details */}
                <AnimatePresence>
                  {isExpanded && dim.details && dim.details.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3">
                        <div className="border-t border-white/10 pt-3 space-y-2">
                          <div className="text-[10px] uppercase tracking-wider text-[var(--text-secondary)] mb-2">
                            Genetic markers analyzed
                          </div>
                          {dim.details.map((detail, i) => (
                            <div
                              key={i}
                              className="flex justify-between items-center text-xs p-2 rounded bg-white/5 dark:bg-black/5"
                            >
                              <div>
                                <span className="font-mono text-[var(--text-primary)]">
                                  {detail.rsid}
                                </span>
                                <span className="text-[var(--text-secondary)] ml-2">
                                  ({detail.gene})
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[var(--text-secondary)]">
                                  {detail.genotype}
                                </span>
                                <span
                                  className={clsx(
                                    'px-1.5 py-0.5 rounded text-[10px] font-medium',
                                    detail.direction === dim.letter
                                      ? 'bg-teal-500/20 text-teal-600 dark:text-teal-400'
                                      : 'bg-stone-500/20 text-stone-600 dark:text-stone-400'
                                  )}
                                >
                                  → {detail.direction}
                                </span>
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
              className="h-full rounded-full bg-teal-500"
              initial={{ width: 0 }}
              animate={{ width: `${coverage * 100}%` }}
              transition={{ duration: 0.5, delay: 0.3 }}
            />
          </div>
        </div>

        {/* Minimal Disclaimer */}
        <p className="text-[10px] text-[var(--text-secondary)]/40 mt-4 text-center leading-relaxed">
          Genetic associations for exploration. Not a psychological assessment.
        </p>
      </div>
    </motion.div>
  );
}

export default EmotionalRadar;
