import React, { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dna,
  Shield,
  FileCheck,
  BarChart3,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles
} from 'lucide-react';

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    icon: Dna,
    iconColor: 'text-cyan-500',
    iconBg: 'bg-cyan-500/20',
    title: 'Welcome to DNA Genesis',
    subtitle: 'Your Personal Genetic Explorer',
    description: 'Discover insights hidden in your DNA. Upload your genetic data file and explore thousands of genetic variants linked to health, traits, and ancestry.',
    visual: 'dna'
  },
  {
    id: 'privacy',
    icon: Shield,
    iconColor: 'text-emerald-500',
    iconBg: 'bg-emerald-500/20',
    title: '100% Private Analysis',
    subtitle: 'Your Data Never Leaves Your Device',
    description: 'Unlike other services, DNA Genesis runs entirely in your browser. Your genetic data is processed locally and never uploaded to any server. Complete privacy, guaranteed.',
    visual: 'shield'
  },
  {
    id: 'formats',
    icon: FileCheck,
    iconColor: 'text-purple-500',
    iconBg: 'bg-purple-500/20',
    title: 'All Major Formats Supported',
    subtitle: 'Works With Your Testing Provider',
    description: 'We support raw data exports from 23andMe, AncestryDNA, FTDNA, MyHeritage, and standard VCF files. Just upload your file and we\'ll auto-detect the format.',
    providers: ['23andMe', 'AncestryDNA', 'FTDNA', 'MyHeritage', 'VCF'],
    visual: 'formats'
  },
  {
    id: 'insights',
    icon: BarChart3,
    iconColor: 'text-orange-500',
    iconBg: 'bg-orange-500/20',
    title: 'Comprehensive Insights',
    subtitle: 'Powered by SNPedia Database',
    description: 'Explore health risks, physical traits, drug responses, ancestry markers, and carrier status. Each finding includes scientific context and relevant research links.',
    categories: [
      { name: 'Health Risks', color: 'bg-red-500' },
      { name: 'Traits', color: 'bg-purple-500' },
      { name: 'Drug Response', color: 'bg-blue-500' },
      { name: 'Ancestry', color: 'bg-orange-500' }
    ],
    visual: 'insights'
  }
];

const STORAGE_KEY = 'dna-genesis-onboarded';

export function OnboardingFlow({ onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const step = ONBOARDING_STEPS[currentStep];
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
    setTimeout(() => onComplete?.(), 300);
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!isVisible) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={clsx(
        'fixed inset-0 z-50',
        'bg-black/60 backdrop-blur-sm',
        'flex items-center justify-center p-4'
      )}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={clsx(
          'relative w-full max-w-lg',
          'bg-white dark:bg-gray-900',
          'rounded-3xl shadow-2xl',
          'overflow-hidden'
        )}
      >
        {/* Skip button */}
        <button
          onClick={handleSkip}
          className={clsx(
            'absolute top-4 right-4 z-10',
            'p-2 rounded-full',
            'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200',
            'hover:bg-gray-100 dark:hover:bg-white/10',
            'transition-colors'
          )}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="p-8 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="text-center"
            >
              {/* Icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className={clsx(
                  'w-20 h-20 mx-auto mb-6 rounded-2xl',
                  'flex items-center justify-center',
                  step.iconBg
                )}
              >
                <step.icon className={clsx('w-10 h-10', step.iconColor)} />
              </motion.div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                {step.title}
              </h2>
              <p className={clsx('text-sm font-medium mb-4', step.iconColor)}>
                {step.subtitle}
              </p>

              {/* Description */}
              <p className="text-[var(--text-secondary)] mb-6 leading-relaxed">
                {step.description}
              </p>

              {/* Step-specific content */}
              {step.providers && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {step.providers.map(provider => (
                    <span
                      key={provider}
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-sm font-medium',
                        'bg-gray-100 dark:bg-white/10',
                        'text-[var(--text-secondary)]'
                      )}
                    >
                      {provider}
                    </span>
                  ))}
                </div>
              )}

              {step.categories && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  {step.categories.map(category => (
                    <span
                      key={category.name}
                      className={clsx(
                        'px-3 py-1.5 rounded-full text-sm font-medium',
                        'text-white',
                        category.color
                      )}
                    >
                      {category.name}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress indicators */}
        <div className="flex justify-center gap-2 pb-4">
          {ONBOARDING_STEPS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={clsx(
                'w-2 h-2 rounded-full transition-all duration-300',
                index === currentStep
                  ? 'w-8 bg-cyan-500'
                  : index < currentStep
                  ? 'bg-cyan-500/50'
                  : 'bg-gray-300 dark:bg-gray-600'
              )}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className={clsx(
          'flex items-center justify-between p-4',
          'border-t border-gray-200 dark:border-white/10',
          'bg-gray-50 dark:bg-white/5'
        )}>
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className={clsx(
              'flex items-center gap-2 px-4 py-2 rounded-xl',
              'text-sm font-medium transition-colors',
              isFirstStep
                ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                : 'text-[var(--text-secondary)] hover:bg-gray-200 dark:hover:bg-white/10'
            )}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <button
            onClick={handleNext}
            className={clsx(
              'flex items-center gap-2 px-6 py-2.5 rounded-xl',
              'text-sm font-medium transition-all',
              'bg-cyan-500 hover:bg-cyan-600 text-white',
              'shadow-lg shadow-cyan-500/25'
            )}
          >
            {isLastStep ? (
              <>
                <Sparkles className="w-4 h-4" />
                Get Started
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Hook to check if onboarding should be shown
export function useOnboarding() {
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasOnboarded = localStorage.getItem(STORAGE_KEY);
    if (!hasOnboarded) {
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  const resetOnboarding = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowOnboarding(true);
  };

  return { showOnboarding, completeOnboarding, resetOnboarding };
}

export default OnboardingFlow;
