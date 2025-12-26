import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Sparkles, ChevronDown, ChevronUp, Heart, Zap, Moon, Sun } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import { RadarChart } from '../visualizations/RadarChart';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const CONFIDENCE_LABELS = {
  high: { label: 'Strong Signal', color: 'text-emerald-600 dark:text-emerald-400' },
  moderate: { label: 'Clear Signal', color: 'text-amber-600 dark:text-amber-400' },
  low: { label: 'Faint Signal', color: 'text-stone-500 dark:text-stone-400' },
  insufficient: { label: 'Not enough data', color: 'text-red-500 dark:text-red-400' }
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
        'p-6 rounded-3xl',
        'bg-white dark:bg-white/5 backdrop-blur-md shadow-sm',
        'border border-stone-100 dark:border-white/10'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-rose-50 dark:bg-rose-500/20">
              <Sparkles className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h3 className="text-xl font-medium text-stone-900 dark:text-white font-serif tracking-tight">
                Bio-Essence
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium tracking-wide uppercase">
                Your Chemical Signature
              </p>
            </div>
          </div>
          <div className={clsx('text-xs font-medium px-2 py-1 rounded-full bg-stone-100 dark:bg-white/10', confidenceInfo.color)}>
            {confidenceInfo.label}
          </div>
        </div>

        {/* Radar Chart Container - Soft Glow */}
        <div className="mb-8 relative flex justify-center">
          {/* Background Gradient Blob */}
          <div className="absolute inset-0 bg-gradient-to-tr from-rose-200/30 to-indigo-200/30 dark:from-rose-500/10 dark:to-indigo-500/10 blur-3xl opacity-50 rounded-full scale-75" />

          <RadarChart
            data={radarData}
            size={260} // Slightly smaller for elegance
            animated={true}
            showLabels={true}
            showValues={false}
            colors={{
              fill: '#e11d48', // Rose-600
              stroke: '#e11d48',
              points: '#fb7185', // Rose-400
            }}
          />
        </div>

        {/* The Archetype Card - "The Soul" */}
        <div className="text-center mb-8 relative">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-stone-50 to-rose-50/50 dark:from-white/5 dark:to-rose-500/5 border border-white/50 dark:border-white/5">
            <div className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-white dark:bg-black/20 text-[10px] font-bold tracking-widest uppercase text-stone-400">
              Archetype
            </div>
            <div className="text-3xl font-medium font-serif text-stone-800 dark:text-white mb-2">
              {archetype.name}
            </div>
            <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-sm mx-auto mb-6">
              {archetype.description}
            </p>

            {/* The Trinity: Superpower, Shadow, Love */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
              {/* Superpower */}
              <div className="p-3 rounded-xl bg-white dark:bg-black/20 border border-stone-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Sun className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">Superpower</span>
                </div>
                <div className="text-sm font-medium text-stone-800 dark:text-stone-100">
                  {archetype.superpower}
                </div>
              </div>

              {/* Shadow */}
              <div className="p-3 rounded-xl bg-white dark:bg-black/20 border border-stone-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Moon className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">Shadow</span>
                </div>
                <div className="text-sm font-medium text-stone-800 dark:text-stone-100">
                  {archetype.shadow}
                </div>
              </div>

              {/* Love Style */}
              <div className="p-3 rounded-xl bg-white dark:bg-black/20 border border-stone-100 dark:border-white/5">
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-3 h-3 text-rose-400" />
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400">Connection</span>
                </div>
                <div className="text-xs font-medium text-stone-800 dark:text-stone-100 leading-tight">
                  {archetype.loveStyle}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Essence List */}
        <div className="space-y-3">
          {Object.entries(systems).map(([key, system]) => {
            const isExpanded = expandedSystem === key;
            const leanLabel = system.score > 0.5 ? system.polarLabels[1] : system.polarLabels[0];

            return (
              <div
                key={key}
                className="group rounded-xl overflow-hidden transition-all duration-300 border border-transparent hover:border-stone-200 dark:hover:border-white/10 hover:bg-stone-50 dark:hover:bg-white/5"
              >
                <button
                  onClick={() => setExpandedSystem(isExpanded ? null : key)}
                  className="w-full p-3 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-4">
                    {/* Color Dot with Glow */}
                    <div className="relative flex justify-center items-center w-8 h-8">
                      <div
                        className="absolute inset-0 rounded-full opacity-20 blur-sm"
                        style={{ backgroundColor: system.color }}
                      />
                      <div
                        className="w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-black/20 shadow-sm"
                        style={{ backgroundColor: system.color }}
                      />
                    </div>

                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-medium font-serif text-stone-800 dark:text-stone-100">
                          {system.label}
                        </span>
                        <span className="text-[10px] uppercase tracking-wider text-stone-400 font-medium">
                          {system.chemical}
                        </span>
                      </div>
                      <div className="text-sm text-stone-500 dark:text-stone-400 font-medium">
                        {leanLabel}
                      </div>
                    </div>
                  </div>

                  <div className={clsx(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-transform bg-stone-100 dark:bg-white/10",
                    isExpanded ? "rotate-180" : ""
                  )}>
                    <ChevronDown className="w-3 h-3 text-stone-500" />
                  </div>
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 pt-0 pl-[3.5rem]">
                        <p className="text-sm text-stone-600 dark:text-stone-300 italic mb-3 leading-relaxed">
                          "{system.description}"
                        </p>

                        <div className="space-y-2">
                          <div className="text-[10px] uppercase tracking-wider font-bold text-stone-400">
                            Genetic Keys
                          </div>
                          {system.details.map((detail, i) => (
                            <div
                              key={i}
                              className="text-xs p-2.5 rounded-lg bg-white dark:bg-black/20 border border-stone-100 dark:border-white/5"
                            >
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-medium text-stone-700 dark:text-stone-200">
                                  {detail.gene}
                                </span>
                                <span className={clsx(
                                  "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                                  detail.userImpact === 'Increases' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300" :
                                    detail.userImpact === 'Decreases' ? "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300" :
                                      "bg-stone-100 text-stone-600 dark:bg-stone-500/20 dark:text-stone-400"
                                )}>
                                  {detail.userImpact}
                                </span>
                              </div>
                              <div className="text-stone-500 dark:text-stone-400 leading-snug">
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

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-[10px] text-stone-400 uppercase tracking-widest">
            Genetic Coverage: {Math.round(coverage * 100)}%
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default EmotionalRadar;
