import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Sparkles, ChevronDown, ChevronUp, Heart, Zap, Moon, Sun, X, Beaker, Lightbulb, Activity } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';
import { RadarChart } from '../visualizations/RadarChart';

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 }
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
  const [selectedInsight, setSelectedInsight] = useState(null);

  // Don't render if no data or very low coverage
  if (!emotionalProfile || emotionalProfile.coverage < 0.1) {
    return null;
  }

  const { systems, archetype, radarData, overallConfidence, coverage } = emotionalProfile;
  const confidenceInfo = CONFIDENCE_LABELS[overallConfidence] || CONFIDENCE_LABELS.insufficient;

  return (
    <motion.div variants={itemVariants} className="relative">
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
            size={260}
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
              <button
                onClick={() => setSelectedInsight(archetype.superpower)}
                className="p-3 rounded-xl bg-white dark:bg-black/20 border border-stone-100 dark:border-white/5 hover:border-amber-300 dark:hover:border-amber-500/50 transition-all text-left w-full group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sun className="w-3 h-3 text-amber-500" />
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 group-hover:text-amber-500 transition-colors">Superpower</span>
                </div>
                <div className="text-sm font-medium text-stone-800 dark:text-stone-100">
                  {archetype.superpower.title}
                </div>
              </button>

              {/* Shadow */}
              <button
                onClick={() => setSelectedInsight(archetype.shadow)}
                className="p-3 rounded-xl bg-white dark:bg-black/20 border border-stone-100 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/50 transition-all text-left w-full group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Moon className="w-3 h-3 text-indigo-400" />
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 group-hover:text-indigo-400 transition-colors">Shadow</span>
                </div>
                <div className="text-sm font-medium text-stone-800 dark:text-stone-100">
                  {archetype.shadow.title}
                </div>
              </button>

              {/* Love Style */}
              <button
                onClick={() => setSelectedInsight(archetype.loveStyle)}
                className="p-3 rounded-xl bg-white dark:bg-black/20 border border-stone-100 dark:border-white/5 hover:border-rose-300 dark:hover:border-rose-500/50 transition-all text-left w-full group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Heart className="w-3 h-3 text-rose-400" />
                  <span className="text-[10px] uppercase tracking-wider font-bold text-stone-400 group-hover:text-rose-400 transition-colors">Connection</span>
                </div>
                <div className="text-xs font-medium text-stone-800 dark:text-stone-100 leading-tight">
                  {archetype.loveStyle.title}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Essence List */}
        <div className="space-y-3">
          {Object.entries(systems).map(([key, system]) => {
            const isExpanded = expandedSystem === key;
            const leanLabel = system.score > 0.5 ? system.polarLabels[1] : system.polarLabels[0];

            // Safe extraction of Vibe Object
            const vibeTitle = system.manifestation?.title || null;
            const vibeText = system.manifestation?.text || system.manifestation || system.description;
            // If manifestation is still an object (error case), fallback to description
            const safeVibeText = (typeof vibeText === 'object') ? system.description : vibeText;

            return (
              <div
                key={key}
                className="group rounded-xl overflow-hidden transition-all duration-300 border border-transparent hover:border-stone-200 dark:hover:border-white/10 hover:bg-stone-50 dark:hover:bg-white/5"
              >
                <button
                  onClick={() => setExpandedSystem(isExpanded ? null : key)}
                  className="w-full p-4 flex items-center justify-between text-left"
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

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-0.5">
                        <span className="text-base font-medium font-serif text-stone-800 dark:text-stone-100">
                          {system.label}
                        </span>
                        {/* Essence Title in Header */}
                        {vibeTitle && (
                          <>
                            <span className="hidden sm:inline text-stone-300 dark:text-stone-600">•</span>
                            <span className="text-sm font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-wide text-[10px]">
                              {vibeTitle}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-400 font-medium uppercase tracking-wider">
                        <span>{system.chemical}</span>
                        <span className="text-stone-300 dark:text-stone-600">•</span>
                        <span>{leanLabel}</span>
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
                      <div className="px-4 pb-4 pt-0 pl-[4rem]">
                        {/* Essence Text without 'You are a...' */}
                        <div className="mb-4 relative">
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-stone-200 to-transparent dark:from-white/20"></div>
                          <p className="pl-3 text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-medium">
                            "{safeVibeText}"
                          </p>
                        </div>

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

      {/* Deep Dive Modal */}
      <AnimatePresence>
        {selectedInsight && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedInsight(null)}
              className="absolute inset-0 bg-stone-900/30 dark:bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="relative w-full max-w-sm bg-white dark:bg-stone-900 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5"
            >
              {/* Modal Header */}
              <div className="relative p-8 pb-6 bg-gradient-to-br from-stone-50 to-white dark:from-white/5 dark:to-transparent">
                <button
                  onClick={() => setSelectedInsight(null)}
                  className="absolute top-4 right-4 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5 text-stone-400" />
                </button>
                <div className="flex items-center gap-2 mb-3 text-[10px] uppercase tracking-widest font-bold text-stone-400">
                  {selectedInsight.type === 'superpower' && <Sun className="w-4 h-4 text-amber-500" />}
                  {selectedInsight.type === 'shadow' && <Moon className="w-4 h-4 text-indigo-500" />}
                  {selectedInsight.type === 'love' && <Heart className="w-4 h-4 text-rose-500" />}
                  {selectedInsight.type === 'superpower' ? 'Your Superpower' :
                    selectedInsight.type === 'shadow' ? 'Your Shadow' : 'Love Style'}
                </div>
                <h3 className="text-3xl font-serif text-stone-900 dark:text-white leading-tight">
                  {selectedInsight.title}
                </h3>
              </div>

              {/* Modal Body */}
              <div className="px-8 pb-8 space-y-6 bg-white dark:bg-stone-900">
                {/* 1. The Science */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-stone-900 dark:text-white font-medium text-sm">
                    <Beaker className="w-4 h-4 text-stone-400" />
                    The Science
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed pl-6 border-l-2 border-stone-100 dark:border-white/10">
                    {selectedInsight.science}
                  </p>
                </div>

                {/* 2. The Manifestation (What it feels like) */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-stone-900 dark:text-white font-medium text-sm">
                    <Activity className="w-4 h-4 text-stone-400" />
                    In Real Life
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed italic pl-6 border-l-2 border-stone-100 dark:border-white/10">
                    "{selectedInsight.manifestation}"
                  </p>
                </div>

                {/* 3. The Hack (Action) */}
                <div className="bg-gradient-to-br from-indigo-50 to-rose-50 dark:from-indigo-900/20 dark:to-rose-900/20 border border-indigo-100 dark:border-white/10 rounded-2xl p-5 mt-4">
                  <div className="flex items-center gap-2 mb-2 text-indigo-900 dark:text-indigo-200 font-bold text-sm">
                    <Lightbulb className="w-4 h-4 text-indigo-500" />
                    Bio-Hack
                  </div>
                  <p className="text-sm text-indigo-900/80 dark:text-indigo-200/80 leading-relaxed font-medium">
                    {selectedInsight.hack}
                  </p>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default EmotionalRadar;
