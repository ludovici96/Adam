import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useKeyboardShortcuts, useAnnounce } from '../../hooks/useKeyboardShortcuts';
import {
  ExternalLink,
  AlertTriangle,
  ThumbsUp,
  Minus,
  MapPin,
  Activity,
  Copy,
  Check,
  Share2,
  BookOpen,
  Link2,
  Dna,
  ChevronRight,
  ChevronLeft,
  Printer,
  Database
} from 'lucide-react';
import { Modal, ModalFooter } from '../common/Modal';
import { Button } from '../common/Button';
import { MagnitudeBadge, CategoryBadge, ReputeBadge } from '../common/Badge';
import { useAnalysis } from '../../context/AnalysisContext';

export function SNPDetailModal({
  match,
  isOpen,
  onClose,
  onSelectSNP,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const { matches } = useAnalysis();
  const announce = useAnnounce();

  // Reset tab when match changes
  useEffect(() => {
    setActiveTab('overview');
    if (match) {
      announce(`Viewing ${match.rsid}, ${match.userGenotype || 'unknown genotype'}, magnitude ${match.magnitude}`);
    }
  }, [match?.rsid]);

  // Keyboard navigation
  useKeyboardShortcuts({
    'ArrowRight': () => hasNext && onNext(),
    'ArrowLeft': () => hasPrevious && onPrevious(),
    'j': () => hasNext && onNext(),
    'k': () => hasPrevious && onPrevious(),
    'Escape': onClose
  }, { enabled: isOpen });

  if (!match) return null;

  const {
    rsid,
    userGenotype,
    magnitude = 0,
    repute,
    summary,
    category,
    chrom,
    pos,
    source,
    gwasAssociations
  } = match;

  const snpediaUrl = rsid ? `https://www.snpedia.com/index.php/${rsid}` : null;
  const ncbiUrl = rsid ? `https://www.ncbi.nlm.nih.gov/snp/${rsid}` : null;
  const clinvarUrl = rsid ? `https://www.ncbi.nlm.nih.gov/clinvar/?term=${rsid}` : null;

  // Find related SNPs (same chromosome, nearby position, or similar category)
  const relatedSNPs = useMemo(() => {
    if (!matches || !chrom) return [];
    return matches
      .filter(m =>
        m.rsid !== rsid && (
          m.chrom === chrom ||
          m.category === category
        )
      )
      .sort((a, b) => (b.magnitude || 0) - (a.magnitude || 0))
      .slice(0, 5);
  }, [matches, rsid, chrom, category]);

  const handleCopyRSID = async () => {
    try {
      await navigator.clipboard.writeText(rsid);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      announce('RSID copied to clipboard');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShare = async () => {
    const shareText = `${rsid} - Genotype: ${userGenotype}\n${summary || 'No summary'}\n\nView on SNPedia: ${snpediaUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `DNA Finding: ${rsid}`,
          text: shareText
        });
      } catch (err) {
        // User cancelled or share failed
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        announce('Share text copied to clipboard');
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const getReputeInfo = () => {
    // Magnitude 0 = always neutral
    if (magnitude === 0 || magnitude < 0.5) {
      return {
        icon: Minus,
        color: 'text-gray-400',
        bg: 'bg-gray-500/10',
        label: 'Neutral',
        description: 'This variant has minimal or no known clinical significance.'
      };
    }

    const r = repute?.toLowerCase();
    switch (r) {
      case 'bad':
        return {
          icon: AlertTriangle,
          color: 'text-red-500',
          bg: 'bg-red-500/10',
          label: 'Risk Factor',
          description: 'This variant is associated with increased risk or negative effects.'
        };
      case 'good':
        return {
          icon: ThumbsUp,
          color: 'text-teal-500',
          bg: 'bg-teal-500/10',
          label: 'Protective',
          description: 'This variant is associated with beneficial effects or reduced risk.'
        };
      default:
        return {
          icon: Minus,
          color: 'text-gray-400',
          bg: 'bg-gray-500/10',
          label: 'Neutral',
          description: 'The significance of this variant is neutral or uncertain.'
        };
    }
  };

  const reputeInfo = getReputeInfo();
  const ReputeIcon = reputeInfo.icon;

  const getMagnitudeDescription = (mag, rep) => {
    const r = rep?.toLowerCase();

    // For good/beneficial traits
    if (r === 'good') {
      if (mag >= 4) return 'Strong beneficial effect - highly significant positive trait';
      if (mag >= 3) return 'Moderate beneficial effect';
      if (mag >= 2) return 'Notable positive finding';
      if (mag >= 1) return 'Minor positive effect';
      return 'Very low significance';
    }

    // For bad/risk traits
    if (r === 'bad') {
      if (mag >= 4) return 'High clinical significance - consult a healthcare professional';
      if (mag >= 3) return 'Moderate clinical significance';
      if (mag >= 2) return 'Notable finding worth reviewing';
      if (mag >= 1) return 'Minor significance';
      return 'Very low clinical significance';
    }

    // Neutral/unknown
    if (mag >= 4) return 'High significance';
    if (mag >= 3) return 'Moderate significance';
    if (mag >= 2) return 'Notable finding';
    if (mag >= 1) return 'Minor significance';
    return 'Very low or no clinical significance';
  };

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'resources', label: 'Resources' },
    { id: 'related', label: `Related (${relatedSNPs.length})` }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center justify-between w-full pr-8">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <code className="text-xl font-mono">{rsid}</code>
              <button
                onClick={handleCopyRSID}
                className={clsx(
                  'p-1.5 rounded-lg transition-colors',
                  'hover:bg-gray-200 dark:hover:bg-white/10',
                  'text-[var(--text-secondary)]'
                )}
                title="Copy RSID"
                aria-label="Copy RSID to clipboard"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <MagnitudeBadge magnitude={magnitude} repute={repute} />
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                hasPrevious
                  ? 'text-[var(--text-secondary)] hover:bg-gray-200 dark:hover:bg-white/10 hover:text-[var(--text-primary)]'
                  : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
              )}
              title="Previous SNP (Left Arrow / K)"
              aria-label="Previous SNP"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                hasNext
                  ? 'text-[var(--text-secondary)] hover:bg-gray-200 dark:hover:bg-white/10 hover:text-[var(--text-primary)]'
                  : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'
              )}
              title="Next SNP (Right Arrow / J)"
              aria-label="Next SNP"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      }
      size="lg"
    >
      <div className="space-y-6">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 dark:border-white/10 -mx-6 px-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'px-4 py-2 text-sm font-medium transition-colors relative',
                activeTab === tab.id
                  ? 'text-cyan-500'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"
                />
              )}
            </button>
          ))}
        </div>
        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Genotype and Location */}
              <div className="grid grid-cols-2 gap-4">
                <div className={clsx(
                  'p-4 rounded-xl',
                  'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10'
                )}>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-2">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">Your Genotype</span>
                  </div>
                  <p className="text-2xl font-mono font-bold text-[var(--text-primary)]">
                    {userGenotype || 'Unknown'}
                  </p>
                </div>

                <div className={clsx(
                  'p-4 rounded-xl',
                  'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10'
                )}>
                  <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-2">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">Chromosome Location</span>
                  </div>
                  <p className="text-lg font-mono text-[var(--text-primary)]">
                    {chrom ? `Chr${chrom}` : 'Unknown'}
                    {pos && `:${pos.toLocaleString()}`}
                  </p>
                </div>
              </div>

              {/* Repute Card */}
              <div className={clsx(
                'p-4 rounded-xl',
                reputeInfo.bg,
                'border border-gray-200 dark:border-white/10'
              )}>
                <div className="flex items-start gap-4">
                  <div className={clsx(
                    'p-3 rounded-xl',
                    'bg-white/20 dark:bg-white/10'
                  )}>
                    <ReputeIcon className={clsx('w-6 h-6', reputeInfo.color)} />
                  </div>
                  <div>
                    <h4 className={clsx(
                      'text-lg font-semibold',
                      reputeInfo.color
                    )}>
                      {reputeInfo.label}
                    </h4>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                      {reputeInfo.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* Magnitude Explanation */}
              <div className={clsx(
                'p-4 rounded-xl',
                'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10'
              )}>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-[var(--text-primary)]">
                    Magnitude Score
                  </h4>
                  <MagnitudeBadge magnitude={magnitude} repute={repute} size="lg" />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  {getMagnitudeDescription(magnitude, repute)}
                </p>
                <div className="mt-3 h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                  <div
                    className={clsx(
                      'h-full rounded-full',
                      repute?.toLowerCase() === 'good' && 'bg-gradient-to-r from-teal-300 to-teal-600',
                      repute?.toLowerCase() === 'bad' && 'bg-gradient-to-r from-amber-400 to-red-600',
                      (!repute || repute?.toLowerCase() === 'neutral') && 'bg-gradient-to-r from-gray-300 to-gray-500'
                    )}
                    style={{ width: `${Math.min(magnitude / 5 * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-xs text-[var(--text-secondary)]">
                  <span>0</span>
                  <span>5+</span>
                </div>
              </div>

              {/* Summary */}
              <div>
                <h4 className="font-medium text-[var(--text-primary)] mb-2">
                  Description
                </h4>
                <p className="text-[var(--text-secondary)] leading-relaxed">
                  {summary || 'No detailed description available for this variant.'}
                </p>
              </div>

              {/* Category */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--text-secondary)]">Category:</span>
                <CategoryBadge category={category} />
                {source && (
                  <span className={clsx(
                    'px-2 py-0.5 rounded text-xs font-medium ml-2',
                    source === 'snpedia' && 'bg-cyan-500/10 text-cyan-400',
                    source === 'clinvar' && 'bg-amber-500/10 text-amber-400',
                    source === 'gwas' && 'bg-indigo-500/10 text-indigo-400'
                  )}>
                    {source === 'snpedia' ? 'SNPedia' : source === 'clinvar' ? 'ClinVar' : 'GWAS'}
                  </span>
                )}
              </div>

              {/* GWAS Trait Associations */}
              {gwasAssociations && gwasAssociations.length > 0 && (
                <div className={clsx(
                  'p-4 rounded-xl',
                  'bg-indigo-500/5 border border-indigo-500/10'
                )}>
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="w-5 h-5 text-indigo-400" />
                    <h4 className="font-medium text-indigo-400">
                      GWAS Trait Associations ({gwasAssociations.length})
                    </h4>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] mb-4">
                    Genome-wide association studies linking this variant to traits and diseases.
                  </p>
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {gwasAssociations.map((assoc, idx) => (
                      <div
                        key={idx}
                        className={clsx(
                          'p-3 rounded-lg',
                          'bg-white/50 dark:bg-white/5',
                          'border border-indigo-500/10'
                        )}
                      >
                        <div className="font-medium text-[var(--text-primary)] mb-1">
                          {assoc.trait}
                        </div>
                        <div className="flex flex-wrap gap-3 text-xs">
                          {assoc.pValue && (
                            <span className="text-indigo-400">
                              P-value: {assoc.pValue.toExponential(2)}
                            </span>
                          )}
                          {assoc.orBeta && (
                            <span className="text-stone-400">
                              OR/Beta: {assoc.orBeta.toFixed(2)}
                            </span>
                          )}
                          {assoc.riskAllele && (
                            <span className="text-amber-400">
                              Risk allele: {assoc.riskAllele}
                            </span>
                          )}
                          {assoc.pubmedId && (
                            <a
                              href={`https://pubmed.ncbi.nlm.nih.gov/${assoc.pubmedId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                              onClick={(e) => e.stopPropagation()}
                            >
                              PubMed
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'resources' && (
            <motion.div
              key="resources"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              <p className="text-sm text-[var(--text-secondary)]">
                Learn more about this genetic variant from trusted scientific sources:
              </p>

              {/* External Links */}
              <div className="space-y-3">
                {snpediaUrl && (
                  <a
                    href={snpediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                      'flex items-center gap-4 p-4 rounded-xl',
                      'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10',
                      'hover:bg-gray-200 dark:hover:bg-white/10 transition-colors group'
                    )}
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/20">
                      <BookOpen className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--text-primary)]">SNPedia</div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        Community-curated wiki for human genetics
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-cyan-500 transition-colors" />
                  </a>
                )}

                {ncbiUrl && (
                  <a
                    href={ncbiUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                      'flex items-center gap-4 p-4 rounded-xl',
                      'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10',
                      'hover:bg-gray-200 dark:hover:bg-white/10 transition-colors group'
                    )}
                  >
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Dna className="w-5 h-5 text-blue-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--text-primary)]">dbSNP (NCBI)</div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        Official NIH SNP database
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-cyan-500 transition-colors" />
                  </a>
                )}

                {clinvarUrl && (
                  <a
                    href={clinvarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={clsx(
                      'flex items-center gap-4 p-4 rounded-xl',
                      'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10',
                      'hover:bg-gray-200 dark:hover:bg-white/10 transition-colors group'
                    )}
                  >
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Activity className="w-5 h-5 text-purple-500" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-[var(--text-primary)]">ClinVar</div>
                      <div className="text-xs text-[var(--text-secondary)]">
                        Clinical significance database
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-cyan-500 transition-colors" />
                  </a>
                )}
              </div>

              {/* Share Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-white/10">
                <button
                  onClick={handleShare}
                  className={clsx(
                    'flex items-center gap-3 w-full p-4 rounded-xl',
                    'bg-cyan-500/10 border border-cyan-500/20',
                    'hover:bg-cyan-500/20 transition-colors'
                  )}
                >
                  <Share2 className="w-5 h-5 text-cyan-500" />
                  <span className="font-medium text-cyan-500">Share this finding</span>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'related' && (
            <motion.div
              key="related"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {relatedSNPs.length > 0 ? (
                <>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Other findings on chromosome {chrom} or in the {category || 'same'} category:
                  </p>
                  <div className="space-y-2">
                    {relatedSNPs.map((snp, i) => (
                      <button
                        key={snp.rsid}
                        onClick={() => {
                          onClose();
                          onSelectSNP?.(snp);
                        }}
                        className={clsx(
                          'w-full flex items-center gap-4 p-4 rounded-xl text-left',
                          'bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10',
                          'hover:bg-gray-200 dark:hover:bg-white/10 transition-colors group'
                        )}
                      >
                        <MagnitudeBadge magnitude={snp.magnitude} repute={snp.repute} />
                        <div className="flex-1 min-w-0">
                          <div className="font-mono text-sm text-cyan-500">{snp.rsid}</div>
                          <div className="text-xs text-[var(--text-secondary)] truncate">
                            {snp.summary?.slice(0, 60) || 'No summary'}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[var(--text-secondary)] group-hover:text-cyan-500 transition-colors" />
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-[var(--text-secondary)]">
                  <Dna className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No related findings found</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Disclaimer - Always visible */}
        <div className={clsx(
          'p-4 rounded-xl',
          'bg-amber-500/10 border border-amber-500/20',
          'text-sm text-amber-600 dark:text-amber-300'
        )}>
          <strong>Disclaimer:</strong> This information is for educational purposes only.
          Genetic variants should be interpreted by qualified healthcare professionals
          in the context of your complete medical history.
        </div>

        {/* Footer Actions */}
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {snpediaUrl && (
            <Button
              variant="primary"
              icon={<ExternalLink className="w-4 h-4" />}
              iconPosition="right"
              onClick={() => window.open(snpediaUrl, '_blank')}
            >
              View on SNPedia
            </Button>
          )}
        </ModalFooter>
      </div>
    </Modal>
  );
}

export default SNPDetailModal;
