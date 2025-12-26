import React, { useMemo, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Download, FileText, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';
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
  const [chartFilteredMatches, setChartFilteredMatches] = useState(null);
  const filterBarRef = React.useRef(null);

  // Handler for when user clicks on a chart bucket
  const handleChartBucketClick = (bucketMatches) => {
    setChartFilteredMatches(bucketMatches);
    setVisibleCount(ITEMS_PER_PAGE);
    // Scroll to the filter bar / results section
    setTimeout(() => {
      filterBarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // Clear chart filter
  const clearChartFilter = () => {
    setChartFilteredMatches(null);
  };

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filters, activeCategory, sort]);

  // Filter and sort matches
  const filteredMatches = useMemo(() => {
    // If chart filter is active, use those matches
    let result = chartFilteredMatches ? [...chartFilteredMatches] : [...matches];

    // Only apply other filters if not using chart filter
    if (!chartFilteredMatches) {
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
        result = result.filter(match => match.repute?.toLowerCase() === filters.repute.toLowerCase());
      }

      // Filter by magnitude
      if (filters.magnitudeMin > 0) {
        result = result.filter(match => (match.magnitude || 0) >= filters.magnitudeMin);
      }
    }

    // Sort
    result.sort((a, b) => {
      if (sort.field === 'magnitude') {
        const diff = (b.magnitude || 0) - (a.magnitude || 0);
        return sort.direction === 'desc' ? diff : -diff;
      }
      if (sort.field === 'repute') {
        const order = { bad: 3, neutral: 2, good: 1 };
        const aRepute = a.repute?.toLowerCase();
        const bRepute = b.repute?.toLowerCase();
        const diff = (order[bRepute] || 0) - (order[aRepute] || 0);
        return sort.direction === 'desc' ? diff : -diff;
      }
      return 0;
    });

    return result;
  }, [matches, categories, activeCategory, filters, sort, chartFilteredMatches]);

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Visualizations Toggle */}
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
      </div>

      {/* Visualizations Section */}
      <AnimatePresence>
        {showVisualizations && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-6">
              {/* Chromosome Browser - Full Width */}
              <ChromosomeBrowser matches={matches} onSelectSNP={selectSNP} />

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <MagnitudeChart matches={matches} onBucketClick={handleChartBucketClick} />
                <CategoryChart categories={categories} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Bar */}
      <div ref={filterBarRef}>
        <FilterBar
          resultCount={filteredMatches.length}
          chartFilteredMatches={chartFilteredMatches}
          onClearChartFilter={clearChartFilter}
        />
      </div>

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
            key={`results-${sort.field}-${sort.direction}-${activeCategory}-${filters.search}-${chartFilteredMatches?.length || 0}`}
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
