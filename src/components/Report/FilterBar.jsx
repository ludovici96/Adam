import React, { useState, useMemo, useRef, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  X,
  Heart,
  Sparkles,
  Globe,
  Pill,
  Users,
  Grid,
  Clock,
  TrendingUp
} from 'lucide-react';
import { useUI } from '../../context/UIContext';
import { useAnalysis } from '../../context/AnalysisContext';

const categories = [
  { id: 'all', label: 'All', icon: Grid },
  { id: 'health', label: 'Health', icon: Heart },
  { id: 'traits', label: 'Traits', icon: Sparkles },
  { id: 'ancestry', label: 'Ancestry', icon: Globe },
  { id: 'pharmacogenomics', label: 'Pharma', icon: Pill },
  { id: 'carrier', label: 'Carrier', icon: Users }
];

const sortOptions = [
  { id: 'magnitude-desc', label: 'Highest Impact', field: 'magnitude', direction: 'desc' },
  { id: 'magnitude-asc', label: 'Lowest Impact', field: 'magnitude', direction: 'asc' },
  { id: 'repute-bad', label: 'Risk First', field: 'repute', direction: 'desc' },
  { id: 'repute-good', label: 'Beneficial First', field: 'repute', direction: 'asc' }
];

// Popular search terms for suggestions
const POPULAR_SEARCHES = [
  { term: 'APOE', description: "Alzheimer's risk" },
  { term: 'BRCA', description: 'Breast cancer' },
  { term: 'caffeine', description: 'Caffeine metabolism' },
  { term: 'lactose', description: 'Lactose intolerance' },
  { term: 'warfarin', description: 'Drug sensitivity' },
  { term: 'vitamin', description: 'Vitamin metabolism' },
  { term: 'diabetes', description: 'Type 2 diabetes' },
  { term: 'heart', description: 'Cardiovascular' }
];

export function FilterBar({ resultCount = 0 }) {
  const {
    filters,
    sort,
    setFilter,
    setSort,
    resetFilters,
    activeCategory,
    setActiveCategory
  } = useUI();

  const { matches } = useAnalysis();
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dna-recent-searches') || '[]');
    } catch {
      return [];
    }
  });
  const searchRef = useRef(null);
  const inputRef = useRef(null);

  // Generate suggestions based on current input
  const suggestions = useMemo(() => {
    const query = filters.search.toLowerCase().trim();
    if (!query) return [];

    // Search in matches for RSID and summary matches
    const matchingSNPs = matches
      .filter(m =>
        m.rsid?.toLowerCase().includes(query) ||
        m.summary?.toLowerCase().includes(query)
      )
      .slice(0, 5)
      .map(m => ({
        type: 'snp',
        term: m.rsid,
        description: m.summary?.slice(0, 50) || 'No summary'
      }));

    // Add popular searches that match
    const matchingPopular = POPULAR_SEARCHES
      .filter(p => p.term.toLowerCase().includes(query))
      .slice(0, 3)
      .map(p => ({ type: 'popular', ...p }));

    return [...matchingSNPs, ...matchingPopular];
  }, [filters.search, matches]);

  // Handle search selection
  const handleSearchSelect = (term) => {
    setFilter({ search: term });
    setShowSuggestions(false);

    // Add to recent searches
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('dna-recent-searches', JSON.stringify(updated));
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasActiveFilters = filters.search || filters.category !== 'all' ||
    filters.repute !== 'all' || filters.magnitudeMin > 0;

  return (
    <div className={clsx(
      'p-4 rounded-2xl',
      'bg-gray-50 dark:bg-white/5 backdrop-blur-sm',
      'border border-gray-200 dark:border-white/10',
      'space-y-4'
    )}>
      {/* Top Row: Search and Sort */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search with Suggestions */}
        <div className="relative flex-1" ref={searchRef}>
          <Search className={clsx(
            'absolute left-3 top-1/2 -translate-y-1/2 z-10',
            'w-5 h-5 text-[var(--text-secondary)]'
          )} />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search by RSID or keyword..."
            value={filters.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            onFocus={() => setShowSuggestions(true)}
            className={clsx(
              'w-full pl-10 pr-10 py-2.5',
              'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10',
              'rounded-xl',
              'text-[var(--text-primary)]',
              'placeholder:text-[var(--text-secondary)]',
              'focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400/50',
              'focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-400/20',
              'transition-all duration-200'
            )}
          />
          {filters.search && (
            <button
              onClick={() => setFilter({ search: '' })}
              className={clsx(
                'absolute right-3 top-1/2 -translate-y-1/2 z-10',
                'p-1 rounded-full',
                'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                'hover:bg-gray-100 dark:hover:bg-white/10',
                'transition-colors duration-200'
              )}
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && (suggestions.length > 0 || recentSearches.length > 0) && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={clsx(
                  'absolute top-full left-0 right-0 mt-2 z-50',
                  'bg-white dark:bg-gray-800',
                  'rounded-xl shadow-lg',
                  'border border-gray-200 dark:border-white/10',
                  'overflow-hidden max-h-80 overflow-y-auto'
                )}
              >
                {/* Recent Searches */}
                {!filters.search && recentSearches.length > 0 && (
                  <div className="p-2 border-b border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-2 px-2 py-1 text-xs text-[var(--text-secondary)]">
                      <Clock className="w-3 h-3" />
                      Recent Searches
                    </div>
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearchSelect(term)}
                        className={clsx(
                          'w-full px-3 py-2 text-left rounded-lg',
                          'text-sm text-[var(--text-primary)]',
                          'hover:bg-gray-100 dark:hover:bg-white/5',
                          'transition-colors'
                        )}
                      >
                        {term}
                      </button>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="p-2">
                    {filters.search && (
                      <div className="flex items-center gap-2 px-2 py-1 text-xs text-[var(--text-secondary)]">
                        <TrendingUp className="w-3 h-3" />
                        Suggestions
                      </div>
                    )}
                    {suggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearchSelect(suggestion.term)}
                        className={clsx(
                          'w-full px-3 py-2 text-left rounded-lg',
                          'hover:bg-gray-100 dark:hover:bg-white/5',
                          'transition-colors flex items-center gap-3'
                        )}
                      >
                        <span className={clsx(
                          'font-mono text-sm',
                          suggestion.type === 'snp' ? 'text-cyan-500' : 'text-purple-500'
                        )}>
                          {suggestion.term}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)] truncate">
                          {suggestion.description}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Popular Searches when empty */}
                {!filters.search && recentSearches.length === 0 && (
                  <div className="p-2">
                    <div className="flex items-center gap-2 px-2 py-1 text-xs text-[var(--text-secondary)]">
                      <TrendingUp className="w-3 h-3" />
                      Popular Searches
                    </div>
                    {POPULAR_SEARCHES.slice(0, 5).map((item, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearchSelect(item.term)}
                        className={clsx(
                          'w-full px-3 py-2 text-left rounded-lg',
                          'hover:bg-gray-100 dark:hover:bg-white/5',
                          'transition-colors flex items-center gap-3'
                        )}
                      >
                        <span className="text-sm font-medium text-[var(--text-primary)]">
                          {item.term}
                        </span>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {item.description}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sort */}
        <div className="relative">
          <ArrowUpDown className={clsx(
            'absolute left-3 top-1/2 -translate-y-1/2',
            'w-4 h-4 text-[var(--text-secondary)]',
            'pointer-events-none'
          )} />
          <select
            value={`${sort.field}-${sort.direction}`}
            onChange={(e) => {
              const option = sortOptions.find(o => o.id === e.target.value);
              if (option) {
                setSort({ field: option.field, direction: option.direction });
              }
            }}
            className={clsx(
              'pl-9 pr-8 py-2.5',
              'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10',
              'rounded-xl',
              'text-[var(--text-primary)]',
              'focus:outline-none focus:border-cyan-500 dark:focus:border-cyan-400/50',
              'focus:ring-2 focus:ring-cyan-500/20 dark:focus:ring-cyan-400/20',
              'appearance-none cursor-pointer',
              'transition-all duration-200'
            )}
          >
            {sortOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => {
          const isActive = activeCategory === category.id;
          const Icon = category.icon;

          return (
            <motion.button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={clsx(
                'flex items-center gap-2',
                'px-3 py-1.5 rounded-full',
                'text-sm font-medium',
                'transition-all duration-200',
                isActive
                  ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30'
                  : 'bg-gray-100 dark:bg-white/5 text-[var(--text-secondary)] border border-transparent hover:bg-gray-200 dark:hover:bg-white/10'
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Icon className="w-4 h-4" />
              <span>{category.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Results count and reset */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-white/5">
        <p className="text-sm text-[var(--text-secondary)]">
          Showing <span className="font-medium text-[var(--text-primary)]">{resultCount.toLocaleString()}</span> results
        </p>

        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            className={clsx(
              'flex items-center gap-1',
              'text-sm text-cyan-400',
              'hover:text-cyan-300',
              'transition-colors duration-200'
            )}
          >
            <X className="w-4 h-4" />
            <span>Clear filters</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default FilterBar;
