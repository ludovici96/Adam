import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { PieChart, Heart, Sparkles, Globe, Pill, Users, HelpCircle } from 'lucide-react';

const CATEGORY_CONFIG = {
  health: {
    label: 'Health',
    color: '#FF3B30',
    icon: Heart,
    description: 'Disease risk & medical conditions'
  },
  traits: {
    label: 'Traits',
    color: '#AF52DE',
    icon: Sparkles,
    description: 'Physical & behavioral characteristics'
  },
  ancestry: {
    label: 'Ancestry',
    color: '#FF9500',
    icon: Globe,
    description: 'Population genetics & origins'
  },
  pharmacogenomics: {
    label: 'Drug Response',
    color: '#007AFF',
    icon: Pill,
    description: 'Medication metabolism'
  },
  carrier: {
    label: 'Carrier',
    color: '#FF2D55',
    icon: Users,
    description: 'Recessive disease carrier status'
  },
  other: {
    label: 'Other',
    color: '#8E8E93',
    icon: HelpCircle,
    description: 'Miscellaneous findings'
  }
};

export function CategoryChart({ categories, onCategoryClick }) {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const chartData = useMemo(() => {
    const data = [];
    let total = 0;

    Object.entries(categories).forEach(([key, matches]) => {
      if (matches.length > 0 && CATEGORY_CONFIG[key]) {
        data.push({
          key,
          ...CATEGORY_CONFIG[key],
          count: matches.length,
          matches
        });
        total += matches.length;
      }
    });

    // Calculate percentages and angles
    let currentAngle = 0;
    data.forEach(item => {
      item.percent = total > 0 ? (item.count / total) * 100 : 0;
      item.startAngle = currentAngle;
      item.endAngle = currentAngle + (item.percent / 100) * 360;
      currentAngle = item.endAngle;
    });

    return { items: data, total };
  }, [categories]);

  const handleCategoryClick = (category) => {
    setSelectedCategory(selectedCategory === category.key ? null : category.key);
    onCategoryClick?.(category.matches);
  };

  return (
    <div className={clsx(
      'p-6 rounded-2xl',
      'bg-gray-50 dark:bg-white/5 backdrop-blur-sm',
      'border border-gray-200 dark:border-white/10'
    )}>
      <div className="flex items-center gap-2 mb-6">
        <PieChart className="w-5 h-5 text-indigo-500" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Results by Category
        </h3>
      </div>

      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Donut Chart */}
        <div className="relative w-48 h-48 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            {chartData.items.map((item, index) => (
              <DonutSegment
                key={item.key}
                item={item}
                index={index}
                isHovered={hoveredCategory === item.key}
                isSelected={selectedCategory === item.key}
                onHover={() => setHoveredCategory(item.key)}
                onLeave={() => setHoveredCategory(null)}
                onClick={() => handleCategoryClick(item)}
              />
            ))}

            {/* Center circle for donut effect */}
            <circle
              cx="50"
              cy="50"
              r="28"
              className="fill-gray-50 dark:fill-[#1a1a1a]"
            />
          </svg>

          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <AnimatePresence mode="wait">
              {hoveredCategory ? (
                <motion.div
                  key={hoveredCategory}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  <div className="text-2xl font-bold text-[var(--text-primary)]">
                    {chartData.items.find(i => i.key === hoveredCategory)?.count || 0}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {chartData.items.find(i => i.key === hoveredCategory)?.label}
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="total"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-center"
                >
                  <div className="text-2xl font-bold text-[var(--text-primary)]">
                    {chartData.total}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    Total
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2">
          {chartData.items.map((item, index) => {
            const Icon = item.icon;
            const isActive = hoveredCategory === item.key || selectedCategory === item.key;

            return (
              <motion.button
                key={item.key}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => handleCategoryClick(item)}
                onMouseEnter={() => setHoveredCategory(item.key)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={clsx(
                  'w-full flex items-center gap-3 p-3 rounded-xl transition-all',
                  isActive
                    ? 'bg-gray-200 dark:bg-white/10 scale-[1.02]'
                    : 'hover:bg-gray-100 dark:hover:bg-white/5'
                )}
              >
                {/* Color dot and icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${item.color}20` }}
                >
                  <Icon className="w-4 h-4" style={{ color: item.color }} />
                </div>

                {/* Label and description */}
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    {item.label}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {item.description}
                  </div>
                </div>

                {/* Count and percentage */}
                <div className="text-right">
                  <div className="text-sm font-bold" style={{ color: item.color }}>
                    {item.count}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">
                    {item.percent.toFixed(1)}%
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Selected Category Detail */}
      <AnimatePresence>
        {selectedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-4 border-t border-gray-200 dark:border-white/10">
              <CategoryDetail
                category={chartData.items.find(i => i.key === selectedCategory)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DonutSegment({ item, index, isHovered, isSelected, onHover, onLeave, onClick }) {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeLength = (item.percent / 100) * circumference;
  const strokeOffset = circumference - (item.startAngle / 360) * circumference;

  return (
    <motion.circle
      cx="50"
      cy="50"
      r={radius}
      fill="none"
      stroke={item.color}
      strokeWidth={isHovered || isSelected ? 14 : 12}
      strokeDasharray={`${strokeLength} ${circumference}`}
      strokeDashoffset={strokeOffset}
      strokeLinecap="round"
      className="cursor-pointer transition-all duration-200"
      style={{ opacity: isHovered || isSelected ? 1 : 0.8 }}
      initial={{ strokeDasharray: `0 ${circumference}` }}
      animate={{ strokeDasharray: `${strokeLength} ${circumference}` }}
      transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    />
  );
}

function CategoryDetail({ category }) {
  if (!category) return null;

  const topMatches = category.matches
    .sort((a, b) => (b.magnitude || 0) - (a.magnitude || 0))
    .slice(0, 5);

  return (
    <div>
      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: category.color }}
        />
        Top {category.label} Findings
      </h4>

      <div className="space-y-2">
        {topMatches.map((match, i) => (
          <div
            key={`${match.rsid}-${i}`}
            className={clsx(
              'p-2 rounded-lg flex items-center gap-3',
              'bg-gray-100 dark:bg-white/5'
            )}
          >
            <span className="font-mono text-xs text-cyan-500">{match.rsid}</span>
            <span className="text-xs text-[var(--text-secondary)] flex-1 truncate">
              {match.summary?.slice(0, 60) || 'No summary'}
            </span>
            <span className={clsx(
              'text-xs px-1.5 py-0.5 rounded font-medium',
              (match.magnitude || 0) >= 3 ? 'bg-red-500/20 text-red-400' :
              (match.magnitude || 0) >= 2 ? 'bg-amber-500/20 text-amber-400' :
              'bg-gray-500/20 text-gray-400'
            )}>
              {(match.magnitude || 0).toFixed(1)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default CategoryChart;
