import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
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
  Grid
} from 'lucide-react';
import { useUI } from '../../context/UIContext';

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
        {/* Search */}
        <div className="relative flex-1">
          <Search className={clsx(
            'absolute left-3 top-1/2 -translate-y-1/2',
            'w-5 h-5 text-[var(--text-secondary)]'
          )} />
          <input
            type="text"
            placeholder="Search by RSID or keyword..."
            value={filters.search}
            onChange={(e) => setFilter({ search: e.target.value })}
            className={clsx(
              'w-full pl-10 pr-4 py-2.5',
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
                'absolute right-3 top-1/2 -translate-y-1/2',
                'p-1 rounded-full',
                'text-[var(--text-secondary)] hover:text-[var(--text-primary)]',
                'hover:bg-gray-100 dark:hover:bg-white/10',
                'transition-colors duration-200'
              )}
            >
              <X className="w-4 h-4" />
            </button>
          )}
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
