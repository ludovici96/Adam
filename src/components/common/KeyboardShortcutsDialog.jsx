import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { Modal } from './Modal';

const SHORTCUTS = [
    {
        category: 'Navigation',
        items: [
            { keys: ['g', 'h'], description: 'Go to Dashboard' },
            { keys: ['g', 'r'], description: 'Go to Report' },
        ]
    },
    {
        category: 'Search & Filter',
        items: [
            { keys: ['/'], description: 'Focus search' },
            { keys: ['Esc'], description: 'Close modal / Clear search' },
        ]
    },
    {
        category: 'SNP Navigation',
        items: [
            { keys: ['j'], description: 'Next SNP (when modal open)' },
            { keys: ['k'], description: 'Previous SNP (when modal open)' },
            { keys: ['→'], description: 'Next SNP' },
            { keys: ['←'], description: 'Previous SNP' },
        ]
    },
    {
        category: 'General',
        items: [
            { keys: ['?'], description: 'Show this help' },
            { keys: ['p'], description: 'Print current view' },
        ]
    },
];

function KeyboardKey({ children }) {
    return (
        <kbd className={clsx(
            'inline-flex items-center justify-center',
            'min-w-[24px] h-6 px-2',
            'text-xs font-mono font-medium',
            'bg-gray-100 dark:bg-white/10',
            'border border-gray-300 dark:border-white/20',
            'rounded-md shadow-sm',
            'text-[var(--text-primary)]'
        )}>
            {children}
        </kbd>
    );
}

export function KeyboardShortcutsDialog({ isOpen, onClose }) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-2">
                    <Keyboard className="w-5 h-5 text-cyan-400" />
                    <span>Keyboard Shortcuts</span>
                </div>
            }
            size="md"
        >
            <div className="space-y-6">
                {SHORTCUTS.map((section) => (
                    <div key={section.category}>
                        <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                            {section.category}
                        </h3>
                        <div className="space-y-2">
                            {section.items.map((item, index) => (
                                <div
                                    key={index}
                                    className={clsx(
                                        'flex items-center justify-between',
                                        'py-2 px-3 rounded-lg',
                                        'bg-gray-50 dark:bg-white/5'
                                    )}
                                >
                                    <span className="text-sm text-[var(--text-primary)]">
                                        {item.description}
                                    </span>
                                    <div className="flex items-center gap-1">
                                        {item.keys.map((key, keyIndex) => (
                                            <React.Fragment key={keyIndex}>
                                                {keyIndex > 0 && (
                                                    <span className="text-xs text-[var(--text-secondary)]">then</span>
                                                )}
                                                <KeyboardKey>{key}</KeyboardKey>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <div className={clsx(
                    'p-3 rounded-lg',
                    'bg-cyan-500/10 border border-cyan-500/20',
                    'text-sm text-cyan-400'
                )}>
                    <strong>Tip:</strong> Press <KeyboardKey>?</KeyboardKey> anywhere to show this dialog
                </div>
            </div>
        </Modal>
    );
}

export default KeyboardShortcutsDialog;
