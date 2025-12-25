import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Shield, Info } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';

export function HealthRisks() {
  const { riskScores } = useAnalysis();

  if (!riskScores || riskScores.length === 0) {
    return null;
  }

  // Get top 5 elevated risks and top 3 protective factors
  const elevatedRisks = riskScores
    .filter(s => s.confidence !== 'insufficient' && s.relativeRisk > 1.1)
    .slice(0, 5);

  const protectiveFactors = riskScores
    .filter(s => s.confidence !== 'insufficient' && s.relativeRisk < 0.9)
    .sort((a, b) => a.relativeRisk - b.relativeRisk)
    .slice(0, 3);

  if (elevatedRisks.length === 0 && protectiveFactors.length === 0) {
    return null;
  }

  return (
    <div className={clsx(
      'p-6 rounded-2xl',
      'bg-gray-50 dark:bg-white/5 backdrop-blur-sm',
      'border border-gray-200 dark:border-white/10'
    )}>
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-amber-500" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Health Risk Insights
        </h3>
      </div>

      {/* Disclaimer */}
      <div className={clsx(
        'mb-4 p-3 rounded-lg',
        'bg-amber-500/10 border border-amber-500/20'
      )}>
        <div className="flex gap-2">
          <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-600 dark:text-amber-400">
            These are genetic predispositions only. Actual risk depends on lifestyle, environment, and other factors.
            Consult a healthcare provider for medical advice.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Elevated Risks */}
        {elevatedRisks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-red-400" />
              Elevated Genetic Risk
            </h4>
            <div className="space-y-2">
              {elevatedRisks.map((risk, index) => (
                <RiskBar key={risk.condition} risk={risk} index={index} />
              ))}
            </div>
          </div>
        )}

        {/* Protective Factors */}
        {protectiveFactors.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              Protective Genetic Factors
            </h4>
            <div className="space-y-2">
              {protectiveFactors.map((risk, index) => (
                <RiskBar key={risk.condition} risk={risk} index={index} isProtective />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RiskBar({ risk, index, isProtective = false }) {
  const percentage = Math.round(risk.relativeRisk * 100);
  const barWidth = Math.min(Math.abs(percentage - 100), 100);

  const getColorClass = () => {
    if (isProtective) return 'bg-emerald-500';
    if (risk.relativeRisk >= 2.0) return 'bg-red-500';
    if (risk.relativeRisk >= 1.5) return 'bg-orange-500';
    return 'bg-amber-500';
  };

  const getIcon = () => {
    if (isProtective) return <TrendingDown className="w-4 h-4 text-emerald-400" />;
    if (risk.relativeRisk >= 1.5) return <TrendingUp className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-amber-400" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className={clsx(
        'p-3 rounded-lg',
        'bg-gray-100 dark:bg-white/5',
        'border border-gray-200 dark:border-white/5'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {getIcon()}
          <span className="text-sm font-medium text-[var(--text-primary)]">
            {risk.condition}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx(
            'text-sm font-bold',
            isProtective ? 'text-emerald-400' : 'text-[var(--text-primary)]'
          )}>
            {percentage}%
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            of avg
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
        {/* Center marker at 100% */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-400 dark:bg-white/30 z-10" />

        {/* The bar */}
        <motion.div
          className={clsx(
            'absolute h-full rounded-full',
            getColorClass()
          )}
          style={{
            left: isProtective ? `${Math.max(percentage / 2, 0)}%` : '50%',
            width: 0
          }}
          animate={{
            width: `${barWidth / 2}%`
          }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
        />
      </div>

      {/* Confidence indicator */}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-[var(--text-secondary)]">
          Based on {risk.snpsFound}/{risk.totalSnps} genetic markers
        </span>
        <span className={clsx(
          'text-xs px-2 py-0.5 rounded-full',
          risk.confidence === 'high'
            ? 'bg-emerald-500/20 text-emerald-400'
            : risk.confidence === 'moderate'
            ? 'bg-amber-500/20 text-amber-400'
            : 'bg-gray-500/20 text-gray-400'
        )}>
          {risk.confidence} confidence
        </span>
      </div>
    </motion.div>
  );
}

export default HealthRisks;
