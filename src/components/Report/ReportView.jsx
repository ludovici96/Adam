import React, { useMemo, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, FileText, ChevronDown, ChevronUp, BarChart2, Info } from 'lucide-react';
import { FilterBar } from './FilterBar';
import { SNPCard } from './SNPCard';
import { SNPDetailModal } from './SNPDetailModal';
import { Button } from '../common/Button';
import { ChromosomeBrowser, MagnitudeChart, CategoryChart } from '../visualizations';
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
  const [showVisualizations, setShowVisualizations] = useState(true);
  const [showExperimental, setShowExperimental] = useState(false);
  const [chartFilteredMatches, setChartFilteredMatches] = useState(null);
  const filterBarRef = React.useRef(null);

  const handleChartBucketClick = (bucketMatches) => {
    setChartFilteredMatches(bucketMatches);
    setVisibleCount(ITEMS_PER_PAGE);
    setTimeout(() => {
      filterBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const clearChartFilter = () => {
    setChartFilteredMatches(null);
  };

  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filters, activeCategory, sort]);

  const filteredMatches = useMemo(() => {
    let result = chartFilteredMatches ? [...chartFilteredMatches] : [...matches];

    // Filter out coordinate/experimental matches unless toggle is on
    if (!chartFilteredMatches && !showExperimental) {
      result = result.filter(match => match.matchMethod !== 'coordinate');
    }

    if (!chartFilteredMatches) {
      if (activeCategory && activeCategory !== 'all') {
        result = categories[activeCategory] || [];
      }

      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        result = result.filter(match =>
          match.rsid?.toLowerCase().includes(searchLower) ||
          match.summary?.toLowerCase().includes(searchLower)
        );
      }

      if (filters.repute && filters.repute !== 'all') {
        result = result.filter(match => match.repute?.toLowerCase() === filters.repute.toLowerCase());
      }

      if (filters.magnitudeMin > 0) {
        result = result.filter(match => (match.magnitude || 0) >= filters.magnitudeMin);
      }
    }

    result.sort((a, b) => {
      if (sort.field === 'magnitude') {
        const diff = (b.magnitude || 0) - (a.magnitude || 0);
        return sort.direction === 'desc' ? diff : -diff;
      }
      if (sort.field === 'repute') {
        // Put items with no repute at the bottom
        const aRepute = a.repute?.toLowerCase();
        const bRepute = b.repute?.toLowerCase();

        // If one has repute and other doesn't, repute wins
        if (aRepute && !bRepute) return -1;
        if (!aRepute && bRepute) return 1;
        if (!aRepute && !bRepute) {
          // Both have no repute, sort by magnitude desc
          return (b.magnitude || 0) - (a.magnitude || 0);
        }

        const order = { bad: 3, neutral: 2, good: 1 };
        const diff = (order[bRepute] || 0) - (order[aRepute] || 0);
        if (diff !== 0) return sort.direction === 'desc' ? diff : -diff;

        // Same repute, sort by magnitude desc
        return (b.magnitude || 0) - (a.magnitude || 0);
      }
      return 0;
    });

    return result;
  }, [matches, categories, activeCategory, filters, sort, chartFilteredMatches, showExperimental]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            icon={<ArrowLeft className="w-4 h-4" />}
            onClick={onBack}
          >
            Back to Summary
          </Button>
          {chartFilteredMatches && (
            <Button
              variant="secondary"
              size="sm"
              onClick={clearChartFilter}
            >
              Clear Filter ({chartFilteredMatches.length} shown)
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowVisualizations(!showVisualizations)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl transition-colors',
            'text-sm font-medium',
            showVisualizations
              ? 'bg-stone-500/10 text-stone-700 dark:text-stone-300 border border-stone-500/20'
              : 'bg-gray-100 dark:bg-white/5 text-[var(--text-secondary)] border border-gray-200 dark:border-white/10'
          )}
        >
          <BarChart2 className="w-4 h-4" />
          Visualizations
          {showVisualizations ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => setShowExperimental(!showExperimental)}
          className={clsx(
            'flex items-center gap-2 px-4 py-2 rounded-xl transition-colors',
            'text-sm font-medium',
            showExperimental
              ? 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20'
              : 'bg-gray-100 dark:bg-white/5 text-[var(--text-secondary)] border border-gray-200 dark:border-white/10'
          )}
        >
          <Info className="w-4 h-4" />
          Experimental Matches
        </button>
      </div>

      <AnimatePresence>
        {showVisualizations && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-6">
              <ChromosomeBrowser matches={matches} onSelectSNP={selectSNP} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MagnitudeChart matches={matches} onBucketClick={handleChartBucketClick} />
                <CategoryChart categories={categories} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={filterBarRef}>
        <FilterBar
          resultCount={filteredMatches.length}
          chartFilteredMatches={chartFilteredMatches}
          onClearChartFilter={clearChartFilter}
        />
      </div>

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
            key={`results-${sort.field}-${sort.direction}-${activeCategory}-${filters.search}-${chartFilteredMatches?.length || 0}-${showExperimental}`}
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

      {filteredMatches.length > 0 && filteredMatches.length <= visibleCount && (
        <p className="text-center text-sm text-[var(--text-secondary)] pt-4">
          Showing all {filteredMatches.length} results
        </p>
      )}

      {selectedSNP && (
        <SNPDetailModal
          match={selectedSNP}
          isOpen={!!selectedSNP}
          onClose={closeModal}
          onNext={() => {
            const index = filteredMatches.indexOf(selectedSNP);
            if (index < filteredMatches.length - 1) {
              selectSNP(filteredMatches[index + 1]);
            }
          }}
          onPrevious={() => {
            const index = filteredMatches.indexOf(selectedSNP);
            if (index > 0) {
              selectSNP(filteredMatches[index - 1]);
            }
          }}
          hasNext={filteredMatches.indexOf(selectedSNP) < filteredMatches.length - 1}
          hasPrevious={filteredMatches.indexOf(selectedSNP) > 0}
        />
      )}
    </div>
  );
}

export default ReportView;
