import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Zap, Eye, Lock, Server, Cloud } from 'lucide-react';
import { DropZone } from './DropZone';
import { ProcessingIndicator } from './ProcessingIndicator';
import { useApp } from '../../context/AppContext';

export function UploadView({ onFileSelect, useAPI, apiStats }) {
  const { appState, progress, APP_STATES } = useApp();

  const isProcessing = [
    APP_STATES.UPLOADING,
    APP_STATES.PARSING,
    APP_STATES.ANALYZING
  ].includes(appState);

  // Dynamic features based on API availability
  const snpCount = useAPI && apiStats?.totalCount
    ? `${(apiStats.totalCount / 1000000).toFixed(1)}M+ SNPs`
    : '70,000+ SNPs';

  const features = [
    {
      icon: Lock,
      title: '100% Private',
      description: useAPI ? 'Self-hosted server' : 'Your DNA never leaves your device'
    },
    {
      icon: Zap,
      title: 'Instant Analysis',
      description: 'Results in seconds, not days'
    },
    {
      icon: useAPI ? Server : Eye,
      title: snpCount,
      description: useAPI ? 'SNPedia + ClinVar databases' : 'Comprehensive SNPedia database'
    }
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      {!isProcessing && (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            {/* Privacy Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 mb-8 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-600 dark:text-emerald-400 text-sm font-medium"
            >
              <Shield className="w-4 h-4" />
              <span>Your DNA data never leaves your browser</span>
            </motion.div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
              <span className="text-[var(--text-primary)]">Discover Your </span>
              <span className="bg-gradient-to-r from-cyan-500 dark:from-cyan-400 via-indigo-500 dark:via-indigo-400 to-purple-500 dark:to-purple-400 bg-clip-text text-transparent">
                Genetic Story
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto">
              Upload your raw DNA file from 23andMe, AncestryDNA, or FTDNA.
              Get instant insights about health, traits, and ancestry.
            </p>
          </motion.div>

          {/* Upload Zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full mb-16"
          >
            <DropZone onFileSelect={onFileSelect} />
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-3xl"
          >
            {features.map((feature) => (
              <motion.div
                key={feature.title}
                className="p-6 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-center transition-colors duration-300 hover:bg-gray-100 dark:hover:bg-white/10 hover:border-gray-300 dark:hover:border-white/20"
                whileHover={{ y: -4 }}
              >
                <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-cyan-500 dark:text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)]">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}

      {/* Processing State */}
      {isProcessing && (
        <ProcessingIndicator
          stage={appState}
          progress={progress.percent}
          message={progress.message}
        />
      )}
    </div>
  );
}

export default UploadView;
