import React from 'react';
import { motion } from 'framer-motion';
import { Percent, CheckCircle, XCircle, FileDiff } from 'lucide-react';
import { clsx } from 'clsx';

export function SimilarityScore({ identityRate, stats }) {
    const percentage = Math.round(identityRate * 100);

    let interpretation = '';
    let color = '';

    if (percentage >= 99.9) {
        interpretation = 'Identical DNA';
        color = 'text-emerald-500';
    } else if (percentage >= 50) {
        interpretation = 'Parent/Child or Sibling';
        color = 'text-blue-500';
    } else if (percentage >= 25) {
        interpretation = 'Grandparent/Grandchild or Aunt/Uncle';
        color = 'text-cyan-500';
    } else if (percentage >= 12.5) {
        interpretation = 'First Cousin';
        color = 'text-purple-500';
    } else {
        interpretation = 'Distant or Unrelated';
        color = 'text-gray-500';
    }

    return (
        <div className={clsx(
            'p-6 rounded-2xl mb-6',
            'bg-gray-50 dark:bg-white/5',
            'border border-gray-200 dark:border-white/10'
        )}>
            <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Score Circle */}
                <div className="relative">
                    <svg className="w-32 h-32 transform -rotate-90">
                        <circle
                            cx="64"
                            cy="64"
                            r="60"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className="text-gray-200 dark:text-gray-700"
                        />
                        <motion.circle
                            cx="64"
                            cy="64"
                            r="60"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="transparent"
                            className={color}
                            initial={{ strokeDasharray: "377 377", strokeDashoffset: 377 }}
                            animate={{ strokeDashoffset: 377 - (377 * percentage) / 100 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={clsx("text-3xl font-bold", color)}>{percentage}%</span>
                        <span className="text-xs text-[var(--text-secondary)]">Shared</span>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="flex-1 w-full">
                    <h3 className={clsx("text-xl font-semibold mb-1", color)}>
                        {interpretation}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-4">
                        Based on {stats.totalCompared.toLocaleString()} comparable SNPs
                    </p>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={CheckCircle}
                            label="Identical"
                            value={stats.identical}
                            color="text-emerald-500"
                            bg="bg-emerald-500/10"
                        />
                        <StatCard
                            icon={XCircle}
                            label="Different"
                            value={stats.different}
                            color="text-red-500"
                            bg="bg-red-500/10"
                        />
                        <StatCard
                            icon={FileDiff}
                            label="Unique to File 1"
                            value={stats.unique1}
                            color="text-blue-500"
                            bg="bg-blue-500/10"
                        />
                        <StatCard
                            icon={FileDiff}
                            label="Unique to File 2"
                            value={stats.unique2}
                            color="text-purple-500"
                            bg="bg-purple-500/10"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, label, value, color, bg }) {
    return (
        <div className={clsx(
            'p-3 rounded-xl flex items-center gap-3',
            'bg-white dark:bg-white/5',
            'border border-gray-100 dark:border-white/5'
        )}>
            <div className={clsx('p-2 rounded-lg', bg)}>
                <Icon className={clsx('w-5 h-5', color)} />
            </div>
            <div>
                <div className="text-lg font-bold text-[var(--text-primary)]">
                    {value.toLocaleString()}
                </div>
                <div className="text-xs text-[var(--text-secondary)]">
                    {label}
                </div>
            </div>
        </div>
    );
}
