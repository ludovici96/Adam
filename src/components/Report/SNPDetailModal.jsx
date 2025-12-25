import React from 'react';
import { clsx } from 'clsx';
import { ExternalLink, AlertTriangle, ThumbsUp, Minus, MapPin, Activity } from 'lucide-react';
import { Modal, ModalFooter } from '../common/Modal';
import { Button } from '../common/Button';
import { MagnitudeBadge, CategoryBadge, ReputeBadge } from '../common/Badge';

export function SNPDetailModal({ match, isOpen, onClose }) {
  if (!match) return null;

  const {
    rsid,
    userGenotype,
    magnitude = 0,
    repute,
    summary,
    category,
    chrom,
    pos
  } = match;

  const snpediaUrl = rsid ? `https://www.snpedia.com/index.php/${rsid}` : null;

  const getReputeInfo = () => {
    switch (repute) {
      case 'bad':
        return {
          icon: AlertTriangle,
          color: 'text-red-400',
          bg: 'bg-red-500/10',
          label: 'Risk Factor',
          description: 'This variant is associated with increased risk or negative effects.'
        };
      case 'good':
        return {
          icon: ThumbsUp,
          color: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          label: 'Protective',
          description: 'This variant is associated with beneficial effects or reduced risk.'
        };
      default:
        return {
          icon: Minus,
          color: 'text-gray-400',
          bg: 'bg-gray-500/10',
          label: 'Neutral',
          description: 'The significance of this variant is neutral or uncertain.'
        };
    }
  };

  const reputeInfo = getReputeInfo();
  const ReputeIcon = reputeInfo.icon;

  const getMagnitudeDescription = (mag) => {
    if (mag >= 4) return 'High clinical significance - consult a healthcare professional';
    if (mag >= 3) return 'Moderate clinical significance';
    if (mag >= 2) return 'Notable finding worth reviewing';
    if (mag >= 1) return 'Minor significance';
    return 'Very low or no clinical significance';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <code className="text-xl font-mono">{rsid}</code>
          <MagnitudeBadge magnitude={magnitude} />
        </div>
      }
      size="lg"
    >
      <div className="space-y-6">
        {/* Genotype and Location */}
        <div className="grid grid-cols-2 gap-4">
          <div className={clsx(
            'p-4 rounded-xl',
            'bg-white/5 border border-white/10'
          )}>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-2">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Your Genotype</span>
            </div>
            <p className="text-2xl font-mono font-bold text-[var(--text-primary)]">
              {userGenotype || 'Unknown'}
            </p>
          </div>

          <div className={clsx(
            'p-4 rounded-xl',
            'bg-white/5 border border-white/10'
          )}>
            <div className="flex items-center gap-2 text-[var(--text-secondary)] mb-2">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">Chromosome Location</span>
            </div>
            <p className="text-lg font-mono text-[var(--text-primary)]">
              {chrom ? `Chr${chrom}` : 'Unknown'}
              {pos && `:${pos.toLocaleString()}`}
            </p>
          </div>
        </div>

        {/* Repute Card */}
        <div className={clsx(
          'p-4 rounded-xl',
          reputeInfo.bg,
          'border border-white/10'
        )}>
          <div className="flex items-start gap-4">
            <div className={clsx(
              'p-3 rounded-xl',
              'bg-white/10'
            )}>
              <ReputeIcon className={clsx('w-6 h-6', reputeInfo.color)} />
            </div>
            <div>
              <h4 className={clsx(
                'text-lg font-semibold',
                reputeInfo.color
              )}>
                {reputeInfo.label}
              </h4>
              <p className="text-sm text-[var(--text-secondary)] mt-1">
                {reputeInfo.description}
              </p>
            </div>
          </div>
        </div>

        {/* Magnitude Explanation */}
        <div className={clsx(
          'p-4 rounded-xl',
          'bg-white/5 border border-white/10'
        )}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-[var(--text-primary)]">
              Magnitude Score
            </h4>
            <MagnitudeBadge magnitude={magnitude} size="lg" />
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {getMagnitudeDescription(magnitude)}
          </p>
          <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full',
                'bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500'
              )}
              style={{ width: `${Math.min(magnitude / 5 * 100, 100)}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-[var(--text-secondary)]">
            <span>0</span>
            <span>5+</span>
          </div>
        </div>

        {/* Summary */}
        <div>
          <h4 className="font-medium text-[var(--text-primary)] mb-2">
            Description
          </h4>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            {summary || 'No detailed description available for this variant.'}
          </p>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--text-secondary)]">Category:</span>
          <CategoryBadge category={category} />
        </div>

        {/* Disclaimer */}
        <div className={clsx(
          'p-4 rounded-xl',
          'bg-amber-500/10 border border-amber-500/20',
          'text-sm text-amber-300'
        )}>
          <strong>Disclaimer:</strong> This information is for educational purposes only.
          Genetic variants should be interpreted by qualified healthcare professionals
          in the context of your complete medical history.
        </div>

        {/* Footer Actions */}
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {snpediaUrl && (
            <Button
              variant="primary"
              icon={<ExternalLink className="w-4 h-4" />}
              iconPosition="right"
              onClick={() => window.open(snpediaUrl, '_blank')}
            >
              View on SNPedia
            </Button>
          )}
        </ModalFooter>
      </div>
    </Modal>
  );
}

export default SNPDetailModal;
