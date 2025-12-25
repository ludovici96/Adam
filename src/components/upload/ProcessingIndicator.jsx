import React from 'react';
import { motion } from 'framer-motion';
import { FileSearch, Database, FlaskConical, CheckCircle2 } from 'lucide-react';

const STAGES = {
  uploading: {
    label: 'Reading file',
    description: 'Loading your DNA data...',
    icon: FileSearch
  },
  parsing: {
    label: 'Parsing variants',
    description: 'Extracting genetic variants from your file...',
    icon: FileSearch
  },
  analyzing: {
    label: 'Analyzing DNA',
    description: 'Matching variants against SNPedia database...',
    icon: FlaskConical
  },
  complete: {
    label: 'Analysis complete',
    description: 'Your results are ready!',
    icon: CheckCircle2
  }
};

export function ProcessingIndicator({ stage, progress = 0, message }) {
  const stageConfig = STAGES[stage] || STAGES.parsing;
  const Icon = stageConfig.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            stage === 'complete'
              ? 'bg-emerald-500/20'
              : 'bg-gradient-to-br from-cyan-500/20 to-indigo-500/20'
          }`}>
            <motion.div
              animate={stage !== 'complete' ? { rotate: [0, 360] } : {}}
              transition={{
                duration: 2,
                repeat: stage !== 'complete' ? Infinity : 0,
                ease: 'linear'
              }}
            >
              <Icon className={`w-6 h-6 ${stage === 'complete' ? 'text-emerald-400' : 'text-cyan-400'}`} />
            </motion.div>
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">
              {stageConfig.label}
            </h3>
            <p className="text-sm text-slate-400">
              {message || stageConfig.description}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {stage !== 'complete' && (
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            />
          </div>
        )}

        {/* Stage indicators */}
        <div className="mt-6 flex items-center justify-between">
          {Object.entries(STAGES).slice(0, -1).map(([key], index) => {
            const stageOrder = Object.keys(STAGES).slice(0, -1);
            const currentIndex = stageOrder.indexOf(stage);
            const thisIndex = index;

            const isComplete = thisIndex < currentIndex || stage === 'complete';
            const isCurrent = thisIndex === currentIndex && stage !== 'complete';

            return (
              <div key={key} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300 ${
                  isComplete ? 'bg-emerald-500/20 text-emerald-400' :
                  isCurrent ? 'bg-cyan-500/20 text-cyan-400 ring-2 ring-cyan-400/50' :
                  'bg-white/5 text-slate-500'
                }`}>
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-medium">{index + 1}</span>
                  )}
                </div>

                {index < Object.keys(STAGES).length - 2 && (
                  <div className={`w-12 sm:w-20 h-0.5 mx-2 transition-colors duration-300 ${
                    thisIndex < currentIndex || stage === 'complete'
                      ? 'bg-emerald-500/40'
                      : 'bg-white/10'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DNA Helix Animation */}
      {stage !== 'complete' && (
        <div className="mt-8 flex justify-center">
          <DNAHelix />
        </div>
      )}
    </motion.div>
  );
}

function DNAHelix() {
  const nucleotides = 12;
  const colors = ['#22d3ee', '#f472b6', '#a78bfa', '#4ade80'];

  return (
    <div className="relative h-16 w-48">
      {Array.from({ length: nucleotides }).map((_, i) => {
        const delay = i * 0.1;
        const colorIndex = i % 4;

        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${(i / nucleotides) * 100}%`,
              backgroundColor: colors[colorIndex]
            }}
            animate={{
              y: [0, -20, 0, 20, 0],
              opacity: [0.5, 1, 0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        );
      })}
      {Array.from({ length: nucleotides }).map((_, i) => {
        const delay = i * 0.1 + 1;
        const colorIndex = (i + 2) % 4;

        return (
          <motion.div
            key={`bottom-${i}`}
            className="absolute w-2 h-2 rounded-full"
            style={{
              left: `${(i / nucleotides) * 100}%`,
              backgroundColor: colors[colorIndex]
            }}
            animate={{
              y: [0, 20, 0, -20, 0],
              opacity: [0.5, 1, 0.5, 1, 0.5]
            }}
            transition={{
              duration: 2,
              delay,
              repeat: Infinity,
              ease: 'easeInOut'
            }}
          />
        );
      })}
    </div>
  );
}

export default ProcessingIndicator;
