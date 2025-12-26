import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { ChevronDown, AlertTriangle } from 'lucide-react';
import { MagnitudeBadge, ReputeBadge } from '../common/Badge';

export function DiffViewer({ shared, different, unique1, unique2 }) {
    const [activeTab, setActiveTab] = useState('different');

    const tabs = [
        { id: 'different', label: 'Differences', count: different.length },
        { id: 'unique1', label: 'Unique to File 1', count: unique1.length },
        { id: 'unique2', label: 'Unique to File 2', count: unique2.length },
        { id: 'shared', label: 'Shared Matches', count: shared.length },
    ];

    return (
        <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-white/10 overflow-x-auto pb-1">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={clsx(
                            'px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors relative',
                            activeTab === tab.id
                                ? 'text-cyan-500'
                                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        )}
                    >
                        {tab.label}
                        <span className={clsx(
                            'ml-2 text-xs py-0.5 px-1.5 rounded-full',
                            activeTab === tab.id
                                ? 'bg-cyan-500/10 text-cyan-500'
                                : 'bg-gray-100 dark:bg-white/10'
                        )}>
                            {tab.count.toLocaleString()}
                        </span>
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabCompare"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-500"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="min-h-[300px]">
                {activeTab === 'different' && (
                    <DifferenceList items={different} />
                )}
                {activeTab === 'unique1' && (
                    <UniqueList items={unique1} fileLabel="File 1" />
                )}
                {activeTab === 'unique2' && (
                    <UniqueList items={unique2} fileLabel="File 2" />
                )}
                {activeTab === 'shared' && (
                    <SharedList items={shared} />
                )}
            </div>
        </div>
    );
}

function DifferenceList({ items }) {
    if (items.length === 0) return <EmptyState message="No differences found" />;

    return (
        <div className="space-y-2">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-sm font-medium text-[var(--text-secondary)]">
                <div className="col-span-2">RSID</div>
                <div className="col-span-3">File 1</div>
                <div className="col-span-3">File 2</div>
                <div className="col-span-4">Significance</div>
            </div>
            {items.slice(0, 100).map((item, i) => (
                <div
                    key={`${item.rsid}-${i}`}
                    className={clsx(
                        'grid grid-cols-12 gap-4 p-4 rounded-xl items-center',
                        'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10'
                    )}
                >
                    <div className="col-span-2 font-mono text-cyan-500 font-medium">
                        {item.rsid}
                    </div>
                    <div className="col-span-3 font-mono font-bold">
                        {item.match1.genotype}
                    </div>
                    <div className="col-span-3 font-mono font-bold text-amber-500">
                        {item.match2.genotype}
                    </div>
                    <div className="col-span-4 flex items-center gap-2">
                        <MagnitudeBadge magnitude={Math.max(item.match1.magnitude || 0, item.match2.magnitude || 0)} />
                        {item.match1.repute !== item.match2.repute && (
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                        )}
                    </div>
                </div>
            ))}
            {items.length > 100 && (
                <div className="text-center py-4 text-[var(--text-secondary)]">
                    And {items.length - 100} more differences...
                </div>
            )}
        </div>
    );
}

function UniqueList({ items, fileLabel }) {
    if (items.length === 0) return <EmptyState message={`No unique variants in ${fileLabel}`} />;

    return (
        <div className="space-y-2">
            {items.slice(0, 50).map((item, i) => (
                <div
                    key={`${item.rsid}-${i}`}
                    className={clsx(
                        'flex items-center gap-4 p-4 rounded-xl',
                        'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10'
                    )}
                >
                    <div className="font-mono text-cyan-500 w-24">{item.rsid}</div>
                    <div className="font-mono font-bold w-16">{item.genotype}</div>
                    <div className="flex-1">
                        <p className="text-sm text-[var(--text-secondary)] truncate">
                            {item.summary || 'No summary'}
                        </p>
                    </div>
                    <MagnitudeBadge magnitude={item.magnitude} />
                </div>
            ))}
            {items.length > 50 && (
                <div className="text-center py-4 text-[var(--text-secondary)]">
                    And {items.length - 50} more items...
                </div>
            )}
        </div>
    );
}

function SharedList({ items }) {
    if (items.length === 0) return <EmptyState message="No shared variants found" />;

    return (
        <div className="space-y-2">
            {items.slice(0, 50).map((item, i) => (
                <div
                    key={`${item.rsid}-${i}`}
                    className={clsx(
                        'flex items-center gap-4 p-4 rounded-xl',
                        'bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10'
                    )}
                >
                    <div className="font-mono text-cyan-500 w-24">{item.rsid}</div>
                    <div className="font-mono font-bold w-16 text-emerald-500">{item.match1.genotype}</div>
                    <div className="flex-1">
                        <p className="text-sm text-[var(--text-secondary)] truncate">
                            {item.match1.summary || 'No summary'}
                        </p>
                    </div>
                    <MagnitudeBadge magnitude={item.match1.magnitude} />
                </div>
            ))}
            {items.length > 50 && (
                <div className="text-center py-4 text-[var(--text-secondary)]">
                    And {items.length - 50} more shared items...
                </div>
            )}
        </div>
    );
}

function EmptyState({ message }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)]">
            <p>{message}</p>
        </div>
    );
}
