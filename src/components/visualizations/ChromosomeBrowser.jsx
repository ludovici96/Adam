import React, { useMemo, useState } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn } from 'lucide-react';

// Human chromosome lengths (GRCh38) in base pairs
const CHROMOSOME_DATA = {
  '1': { length: 248956422, centromere: 123400000 },
  '2': { length: 242193529, centromere: 93900000 },
  '3': { length: 198295559, centromere: 90900000 },
  '4': { length: 190214555, centromere: 50000000 },
  '5': { length: 181538259, centromere: 48800000 },
  '6': { length: 170805979, centromere: 59800000 },
  '7': { length: 159345973, centromere: 60100000 },
  '8': { length: 145138636, centromere: 45200000 },
  '9': { length: 138394717, centromere: 43000000 },
  '10': { length: 133797422, centromere: 39800000 },
  '11': { length: 135086622, centromere: 53400000 },
  '12': { length: 133275309, centromere: 35500000 },
  '13': { length: 114364328, centromere: 17700000 },
  '14': { length: 107043718, centromere: 17200000 },
  '15': { length: 101991189, centromere: 19000000 },
  '16': { length: 90338345, centromere: 36800000 },
  '17': { length: 83257441, centromere: 25100000 },
  '18': { length: 80373285, centromere: 18500000 },
  '19': { length: 58617616, centromere: 26200000 },
  '20': { length: 64444167, centromere: 28100000 },
  '21': { length: 46709983, centromere: 12000000 },
  '22': { length: 50818468, centromere: 15000000 },
  'X': { length: 156040895, centromere: 61000000 },
  'Y': { length: 57227415, centromere: 10400000 },
  'MT': { length: 16569, centromere: 0 }
};

const MAX_LENGTH = 248956422; // Chromosome 1

function getMagnitudeColor(magnitude) {
  if (magnitude >= 4) return '#FF3B30'; // Critical - red
  if (magnitude >= 3) return '#FF9500'; // High - orange
  if (magnitude >= 2) return '#FFCC00'; // Moderate - yellow
  if (magnitude >= 1) return '#34C759'; // Low - green
  return '#8E8E93'; // Benign - gray
}

function getReputeColor(repute) {
  if (repute?.toLowerCase() === 'bad') return '#FF3B30';
  if (repute?.toLowerCase() === 'good') return '#34C759';
  return '#8E8E93';
}

export function ChromosomeBrowser({ matches, onSelectSNP }) {
  const [selectedChrom, setSelectedChrom] = useState(null);
  const [hoveredSNP, setHoveredSNP] = useState(null);

  // Group matches by chromosome
  const chromosomeMatches = useMemo(() => {
    const grouped = {};

    // Initialize all chromosomes
    Object.keys(CHROMOSOME_DATA).forEach(chrom => {
      grouped[chrom] = [];
    });

    // Group matches
    matches.forEach(match => {
      const chrom = match.chrom?.toString().replace(/^chr/i, '').toUpperCase();
      if (grouped[chrom]) {
        grouped[chrom].push(match);
      }
    });

    return grouped;
  }, [matches]);

  // Get notable matches for selected chromosome
  const selectedChromMatches = selectedChrom
    ? chromosomeMatches[selectedChrom]?.sort((a, b) => (b.magnitude || 0) - (a.magnitude || 0))
    : [];

  return (
    <div className={clsx(
      'p-6 rounded-2xl',
      'bg-gray-50 dark:bg-white/5 backdrop-blur-sm',
      'border border-gray-200 dark:border-white/10'
    )}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ZoomIn className="w-5 h-5 text-cyan-500" />
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Chromosome Browser
          </h3>
        </div>
        <div className="text-xs text-[var(--text-secondary)]">
          Click a chromosome to explore
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF3B30]" />
          <span className="text-[var(--text-secondary)]">High Impact</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FF9500]" />
          <span className="text-[var(--text-secondary)]">Moderate</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#FFCC00]" />
          <span className="text-[var(--text-secondary)]">Notable</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#34C759]" />
          <span className="text-[var(--text-secondary)]">Low</span>
        </div>
      </div>

      {/* Chromosome Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2">
        {Object.entries(CHROMOSOME_DATA).map(([chrom, data]) => (
          <ChromosomeIdeogram
            key={chrom}
            chromosome={chrom}
            data={data}
            matches={chromosomeMatches[chrom] || []}
            isSelected={selectedChrom === chrom}
            onClick={() => setSelectedChrom(selectedChrom === chrom ? null : chrom)}
            onSNPHover={setHoveredSNP}
          />
        ))}
      </div>

      {/* Selected Chromosome Detail */}
      <AnimatePresence>
        {selectedChrom && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-[var(--text-primary)]">
                  Chromosome {selectedChrom}
                  <span className="ml-2 text-xs font-normal text-[var(--text-secondary)]">
                    {selectedChromMatches.length} findings
                  </span>
                </h4>
                <button
                  onClick={() => setSelectedChrom(null)}
                  className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
              </div>

              {/* Detailed chromosome view */}
              <ChromosomeDetail
                chromosome={selectedChrom}
                data={CHROMOSOME_DATA[selectedChrom]}
                matches={selectedChromMatches}
                onSelectSNP={onSelectSNP}
              />

              {/* SNP List */}
              {selectedChromMatches.length > 0 && (
                <div className="mt-4 max-h-48 overflow-y-auto space-y-1">
                  {selectedChromMatches.slice(0, 20).map((match, index) => (
                    <motion.button
                      key={`${match.rsid}-${index}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      onClick={() => onSelectSNP?.(match)}
                      className={clsx(
                        'w-full p-2 rounded-lg text-left',
                        'bg-gray-100 dark:bg-white/5',
                        'hover:bg-gray-200 dark:hover:bg-white/10',
                        'transition-colors flex items-center gap-3'
                      )}
                    >
                      <div
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: getMagnitudeColor(match.magnitude) }}
                      />
                      <span className="font-mono text-xs text-cyan-500">
                        {match.rsid}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)] truncate flex-1">
                        {match.summary?.slice(0, 50) || 'No summary'}...
                      </span>
                      <span className={clsx(
                        'text-xs px-1.5 py-0.5 rounded',
                        match.magnitude >= 3 ? 'bg-red-500/20 text-red-400' :
                          match.magnitude >= 2 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-gray-500/20 text-gray-400'
                      )}>
                        {match.magnitude?.toFixed(1) || '0'}
                      </span>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hover Tooltip */}
      <AnimatePresence>
        {hoveredSNP && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className={clsx(
              'fixed z-50 p-3 rounded-lg shadow-lg max-w-xs',
              'bg-gray-900 text-white',
              'pointer-events-none'
            )}
            style={{
              left: hoveredSNP.x + 10,
              top: hoveredSNP.y + 10
            }}
          >
            <div className="font-mono text-cyan-400 text-sm">{hoveredSNP.match.rsid}</div>
            <div className="text-xs text-gray-300 mt-1">{hoveredSNP.match.summary?.slice(0, 100)}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ChromosomeIdeogram({ chromosome, data, matches, isSelected, onClick }) {
  const height = Math.max(30, (data.length / MAX_LENGTH) * 120);
  const width = 20;
  const centromereY = (data.centromere / data.length) * height;

  // Count notable matches
  const notableCount = matches.filter(m => (m.magnitude || 0) >= 2).length;
  const hasHighImpact = matches.some(m => (m.magnitude || 0) >= 3);

  return (
    <motion.button
      onClick={onClick}
      className={clsx(
        'flex flex-col items-center p-2 rounded-lg transition-colors',
        isSelected
          ? 'bg-cyan-500/20 ring-2 ring-cyan-500'
          : 'hover:bg-gray-200 dark:hover:bg-white/10'
      )}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <svg width={width + 4} height={height + 4} className="overflow-visible">
        {/* P arm (top) */}
        <path
          d={`
            M ${width / 2 + 2} 2
            Q ${width + 2} 2, ${width + 2} 8
            L ${width + 2} ${centromereY}
            Q ${width + 2} ${centromereY + 4}, ${width / 2 + 2} ${centromereY + 4}
            Q 2 ${centromereY + 4}, 2 ${centromereY}
            L 2 8
            Q 2 2, ${width / 2 + 2} 2
          `}
          className={clsx(
            'transition-colors stroke-gray-400 dark:stroke-gray-500',
            isSelected ? 'fill-cyan-500/40' : 'fill-gray-300 dark:fill-gray-600'
          )}
          strokeWidth="1"
        />

        {/* Q arm (bottom) */}
        <path
          d={`
            M ${width / 2 + 2} ${centromereY + 4}
            Q ${width + 2} ${centromereY + 4}, ${width + 2} ${centromereY + 8}
            L ${width + 2} ${height - 4}
            Q ${width + 2} ${height + 2}, ${width / 2 + 2} ${height + 2}
            Q 2 ${height + 2}, 2 ${height - 4}
            L 2 ${centromereY + 8}
            Q 2 ${centromereY + 4}, ${width / 2 + 2} ${centromereY + 4}
          `}
          className={clsx(
            'transition-colors stroke-gray-400 dark:stroke-gray-500',
            isSelected ? 'fill-cyan-500/60' : 'fill-gray-400 dark:fill-gray-500'
          )}
          strokeWidth="1"
        />

        {/* SNP markers */}
        {matches.slice(0, 10).map((match, i) => {
          const y = (match.pos / data.length) * height + 2;
          const color = getMagnitudeColor(match.magnitude);
          return (
            <circle
              key={`${match.rsid}-${i}`}
              cx={width / 2 + 2}
              cy={Math.max(4, Math.min(height, y))}
              r={2}
              fill={color}
              opacity={0.8}
            />
          );
        })}
      </svg>

      {/* Label */}
      <span className={clsx(
        'text-xs mt-1 font-medium',
        isSelected ? 'text-cyan-400' : 'text-[var(--text-secondary)]'
      )}>
        {chromosome}
      </span>

      {/* Match indicator */}
      {notableCount > 0 && (
        <span className={clsx(
          'text-[10px] px-1 rounded-full',
          hasHighImpact ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
        )}>
          {notableCount}
        </span>
      )}
    </motion.button>
  );
}

function ChromosomeDetail({ chromosome, data, matches }) {
  const width = '100%';
  const height = 40;

  return (
    <div className="relative">
      <svg width={width} height={height} className="w-full">
        {/* Chromosome bar */}
        <rect
          x="0"
          y="10"
          width="100%"
          height="20"
          rx="10"
          className="fill-gray-200 dark:fill-gray-700"
        />

        {/* Centromere */}
        <rect
          x={`${(data.centromere / data.length) * 100}%`}
          y="8"
          width="4"
          height="24"
          className="fill-gray-400 dark:fill-gray-500"
        />

        {/* SNP markers */}
        {matches.map((match, i) => {
          const x = (match.pos / data.length) * 100;
          const color = getMagnitudeColor(match.magnitude);
          return (
            <circle
              key={`detail-${match.rsid}-${i}`}
              cx={`${x}%`}
              cy="20"
              r={3 + Math.min(match.magnitude || 0, 3)}
              fill={color}
              opacity={0.7}
              className="cursor-pointer hover:opacity-100"
            />
          );
        })}
      </svg>

      {/* Position labels */}
      <div className="flex justify-between text-[10px] text-[var(--text-secondary)] mt-1">
        <span>0 Mb</span>
        <span>{Math.round(data.length / 1000000)} Mb</span>
      </div>
    </div>
  );
}

export default ChromosomeBrowser;
