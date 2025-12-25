import React, { useState } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { Pill, AlertTriangle, CheckCircle, Info, ChevronDown, ChevronUp, Dna } from 'lucide-react';
import { useAnalysis } from '../../context/AnalysisContext';

export function DrugInteractions() {
  const { pharmaResults } = useAnalysis();
  const [expandedDrug, setExpandedDrug] = useState(null);

  if (!pharmaResults || pharmaResults.totalGenesAnalyzed === 0) {
    return null;
  }

  const { drugs, genes, summary } = pharmaResults;
  const hasActionable = drugs.actionable.length > 0;

  return (
    <div className={clsx(
      'p-6 rounded-2xl',
      'bg-gray-50 dark:bg-white/5 backdrop-blur-sm',
      'border border-gray-200 dark:border-white/10'
    )}>
      <div className="flex items-center gap-2 mb-4">
        <Pill className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Drug-Gene Interactions
        </h3>
      </div>

      {/* Summary Alert */}
      <div className={clsx(
        'mb-4 p-4 rounded-lg',
        hasActionable
          ? 'bg-amber-500/10 border border-amber-500/20'
          : 'bg-emerald-500/10 border border-emerald-500/20'
      )}>
        <div className="flex gap-3">
          {hasActionable ? (
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          )}
          <div>
            <p className={clsx(
              'text-sm font-medium',
              hasActionable ? 'text-amber-400' : 'text-emerald-400'
            )}>
              {summary.headline}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {summary.text}
            </p>
          </div>
        </div>
      </div>

      {/* Gene Status Summary */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
          <Dna className="w-4 h-4" />
          Your Metabolizer Status
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(genes).map(([geneName, geneData]) => (
            <GeneStatusBadge key={geneName} gene={geneName} data={geneData} />
          ))}
        </div>
      </div>

      {/* Actionable Drug Interactions */}
      {drugs.actionable.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Requires Attention ({drugs.actionable.length})
          </h4>
          <div className="space-y-2">
            {drugs.actionable.map((drug, index) => (
              <DrugCard
                key={drug.drug}
                drug={drug}
                index={index}
                isExpanded={expandedDrug === drug.drug}
                onToggle={() => setExpandedDrug(
                  expandedDrug === drug.drug ? null : drug.drug
                )}
                severity="high"
              />
            ))}
          </div>
        </div>
      )}

      {/* Informational Interactions */}
      {drugs.informative.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" />
            Good to Know ({drugs.informative.length})
          </h4>
          <div className="space-y-2">
            {drugs.informative.slice(0, 5).map((drug, index) => (
              <DrugCard
                key={drug.drug}
                drug={drug}
                index={index}
                isExpanded={expandedDrug === drug.drug}
                onToggle={() => setExpandedDrug(
                  expandedDrug === drug.drug ? null : drug.drug
                )}
                severity="moderate"
              />
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
        <p className="text-xs text-[var(--text-secondary)]">
          <Info className="w-3 h-3 inline mr-1" />
          Share these results with your healthcare provider before starting or changing medications.
          This is not medical advice.
        </p>
      </div>
    </div>
  );
}

function GeneStatusBadge({ gene, data }) {
  const { phenotype, phenotypeInfo } = data;

  const getBgColor = () => {
    switch (phenotype) {
      case 'poor': return 'bg-red-500/20 border-red-500/30';
      case 'intermediate': return 'bg-amber-500/20 border-amber-500/30';
      case 'ultrarapid': return 'bg-orange-500/20 border-orange-500/30';
      default: return 'bg-emerald-500/20 border-emerald-500/30';
    }
  };

  const getTextColor = () => {
    switch (phenotype) {
      case 'poor': return 'text-red-400';
      case 'intermediate': return 'text-amber-400';
      case 'ultrarapid': return 'text-orange-400';
      default: return 'text-emerald-400';
    }
  };

  return (
    <div className={clsx(
      'px-3 py-2 rounded-lg border text-center',
      getBgColor()
    )}>
      <div className="text-xs font-mono text-[var(--text-secondary)]">{gene}</div>
      <div className={clsx('text-xs font-medium', getTextColor())}>
        {phenotypeInfo?.label || phenotype}
      </div>
    </div>
  );
}

function DrugCard({ drug, index, isExpanded, onToggle, severity }) {
  const getSeverityStyles = () => {
    switch (severity) {
      case 'high':
        return 'border-red-500/30 bg-red-500/5';
      case 'moderate':
        return 'border-amber-500/30 bg-amber-500/5';
      default:
        return 'border-gray-200 dark:border-white/10 bg-white/5';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={clsx(
        'rounded-lg border overflow-hidden',
        getSeverityStyles()
      )}
    >
      <button
        onClick={onToggle}
        className="w-full p-3 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div className={clsx(
            'w-8 h-8 rounded-lg flex items-center justify-center',
            severity === 'high' ? 'bg-red-500/20' : 'bg-amber-500/20'
          )}>
            <Pill className={clsx(
              'w-4 h-4',
              severity === 'high' ? 'text-red-400' : 'text-amber-400'
            )} />
          </div>
          <div>
            <span className="text-sm font-medium text-[var(--text-primary)]">
              {drug.drug}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-[var(--text-secondary)]">
                {drug.drugClass}
              </span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-[var(--text-secondary)]">
                {drug.gene}
              </span>
            </div>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-[var(--text-secondary)]" />
        ) : (
          <ChevronDown className="w-4 h-4 text-[var(--text-secondary)]" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 space-y-2 border-t border-gray-200 dark:border-white/10 pt-3">
              <div>
                <span className="text-xs font-medium text-[var(--text-secondary)]">Your Status:</span>
                <p className="text-sm text-[var(--text-primary)]">
                  {drug.phenotype.charAt(0).toUpperCase() + drug.phenotype.slice(1)} Metabolizer
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-[var(--text-secondary)]">Recommendation:</span>
                <p className="text-sm text-[var(--text-primary)]">
                  {drug.recommendation}
                </p>
              </div>
              <div className="pt-2 border-t border-gray-200 dark:border-white/10">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Clinical Notes:</span>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  {drug.notes}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default DrugInteractions;
