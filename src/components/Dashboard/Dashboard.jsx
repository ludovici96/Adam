import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { SummaryCards } from './SummaryCards';
import { QuickInsights } from './QuickInsights';
import { HealthRisks } from './HealthRisks';
import { DrugInteractions } from './DrugInteractions';
import { EmotionalRadar } from './EmotionalRadar';
import { Button } from '../common/Button';
import { useAnalysis } from '../../context/AnalysisContext';
import { useApp } from '../../context/AppContext';
import { useUI } from '../../context/UIContext';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export function Dashboard({ onViewReport, onReset, onSelectSNP }) {
  const {
    stats,
    matches,
    notableCount,
    positiveCount
  } = useAnalysis();

  const { processingDuration, fileName } = useApp();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      <motion.div variants={itemVariants} className="text-center">
        <h2 className={clsx(
          'text-3xl sm:text-4xl font-bold',
          'text-[var(--text-primary)]',
          'mb-2'
        )}>
          Analysis Complete
        </h2>
        {fileName && (
          <p className="text-[var(--text-secondary)]">
            Results for <span className="font-mono text-cyan-400">{fileName}</span>
          </p>
        )}
      </motion.div>

      <motion.div variants={itemVariants}>
        <SummaryCards
          totalVariants={stats.totalVariants}
          totalMatches={stats.totalMatches}
          notableCount={notableCount}
          positiveCount={positiveCount}
          processingTime={processingDuration}
        />
      </motion.div>

      <motion.div variants={itemVariants}>
        <QuickInsights
          matches={matches}
          maxItems={5}
        />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HealthRisks />
        <DrugInteractions />
      </motion.div>

      <motion.div variants={itemVariants}>
        <EmotionalRadar />
      </motion.div>

      <motion.div
        variants={itemVariants}
        className="flex flex-col sm:flex-row items-center justify-center gap-4"
      >
        <Button
          variant="primary"
          size="lg"
          icon={<ArrowRight className="w-5 h-5" />}
          iconPosition="right"
          onClick={onViewReport}
        >
          View Full Report
        </Button>

        <Button
          variant="ghost"
          size="lg"
          icon={<RotateCcw className="w-5 h-5" />}
          onClick={onReset}
        >
          Analyze Another File
        </Button>
      </motion.div>

      <motion.div variants={itemVariants}>
        <CategoryDistribution />
      </motion.div>
    </motion.div>
  );
}

function CategoryDistribution() {
  const { categories } = useAnalysis();

  const categoryData = [
    { name: 'Health', count: categories.health?.length || 0, color: 'bg-red-500' },
    { name: 'Traits', count: categories.traits?.length || 0, color: 'bg-purple-500' },
    { name: 'Ancestry', count: categories.ancestry?.length || 0, color: 'bg-orange-500' },
    { name: 'Pharma', count: categories.pharmacogenomics?.length || 0, color: 'bg-blue-500' },
    { name: 'Carrier', count: categories.carrier?.length || 0, color: 'bg-pink-500' },
    { name: 'Other', count: categories.other?.length || 0, color: 'bg-gray-500' }
  ].filter(c => c.count > 0);

  const total = categoryData.reduce((sum, c) => sum + c.count, 0);

  if (total === 0) return null;

  return (
    <div className={clsx(
      'p-6 rounded-2xl',
      'bg-gray-50 dark:bg-white/5 backdrop-blur-sm',
      'border border-gray-200 dark:border-white/10'
    )}>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
        Results by Category
      </h3>

      <div className="h-4 rounded-full overflow-hidden bg-gray-200 dark:bg-white/5 flex">
        {categoryData.map((category, index) => (
          <motion.div
            key={category.name}
            className={clsx(category.color)}
            initial={{ width: 0 }}
            animate={{ width: `${(category.count / total) * 100}%` }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-4">
        {categoryData.map((category) => (
          <div key={category.name} className="flex items-center gap-2">
            <div className={clsx('w-3 h-3 rounded-full', category.color)} />
            <span className="text-sm text-[var(--text-secondary)]">
              {category.name} ({category.count})
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
