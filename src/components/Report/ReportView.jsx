import React, { useMemo, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, FileText, ChevronDown } from 'lucide-react';
import { FilterBar } from './FilterBar';
import { SNPCard } from './SNPCard';
import { SNPDetailModal } from './SNPDetailModal';
import { Button } from '../common/Button';
import { useAnalysis } from '../../context/AnalysisContext';
import { useUI } from '../../context/UIContext';

const ITEMS_PER_PAGE = 50;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03
    }
  }
};

export function ReportView({ onBack, onExport }) {
  const { matches, categories } = useAnalysis();
  const {
    filters,
    sort,
    activeCategory,
    selectedSNP,
    selectSNP,
    closeModal
  } = useUI();

  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filters, activeCategory, sort]);

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    let result = [...matches];

    // Filter by category
    if (activeCategory && activeCategory !== 'all') {
      result = categories[activeCategory] || [];
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(match =>
        match.rsid?.toLowerCase().includes(searchLower) ||
        match.summary?.toLowerCase().includes(searchLower)
      );
    }

    // Filter by repute
    if (filters.repute && filters.repute !== 'all') {
      result = result.filter(match => match.repute === filters.repute);
    }

    // Filter by magnitude
    if (filters.magnitudeMin > 0) {
      result = result.filter(match => (match.magnitude || 0) >= filters.magnitudeMin);
    }

    // Sort
    result.sort((a, b) => {
      if (sort.field === 'magnitude') {
        const diff = (b.magnitude || 0) - (a.magnitude || 0);
        return sort.direction === 'desc' ? diff : -diff;
      }
      if (sort.field === 'repute') {
        const order = { bad: 3, neutral: 2, good: 1 };
        const diff = (order[b.repute] || 0) - (order[a.repute] || 0);
        return sort.direction === 'desc' ? diff : -diff;
      }
      return 0;
    });

    return result;
  }, [matches, categories, activeCategory, filters, sort]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={onBack}
        >
          Back to Summary
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<Download className="w-4 h-4" />}
            onClick={() => onExport?.('csv')}
          >
            Export CSV
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={<FileText className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <FilterBar resultCount={filteredMatches.length} />

      {/* Results */}
      <AnimatePresence mode="wait">
        {filteredMatches.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={clsx(
              'p-12 rounded-2xl text-center',
              'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10'
            )}
          >
            <p className="text-lg text-[var(--text-secondary)]">
              No results match your filters
            </p>
            <p className="text-sm text-[var(--text-secondary)]/60 mt-2">
              Try adjusting your search or category filters
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid gap-4"
          >
            {filteredMatches.slice(0, visibleCount).map((match, index) => (
              <SNPCard
                key={`${match.rsid}-${match.chrom}-${match.pos}-${index}`}
                match={match}
                onClick={() => selectSNP(match)}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Load more button for large lists */}
      {filteredMatches.length > visibleCount && (
        <div className="flex flex-col items-center gap-3 pt-4">
          <p className="text-sm text-[var(--text-secondary)]">
            Showing {visibleCount} of {filteredMatches.length} results
          </p>
          <Button
            variant="secondary"
            size="md"
            icon={<ChevronDown className="w-4 h-4" />}
            onClick={() => setVisibleCount(prev => prev + ITEMS_PER_PAGE)}
          >
            Load More
          </Button>
        </div>
      )}

      {/* All results loaded indicator */}
      {filteredMatches.length > 0 && filteredMatches.length <= visibleCount && (
        <p className="text-center text-sm text-[var(--text-secondary)] pt-4">
          Showing all {filteredMatches.length} results
        </p>
      )}

      {/* Detail Modal */}
      <SNPDetailModal
        match={selectedSNP}
        isOpen={!!selectedSNP}
        onClose={closeModal}
      />
    </div>
  );
}

export default ReportView;
