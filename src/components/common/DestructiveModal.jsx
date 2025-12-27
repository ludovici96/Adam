import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

export function DestructiveModal({ isOpen, onClose, onConfirm, title, description, confirmText = "Confirm Delete" }) {
    // Portal the modal to document.body to break out of z-index/transform constraints
    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-6 pb-0 flex items-start gap-4">
                            <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-bold font-serif text-stone-900 dark:text-white mb-2">
                                    {title}
                                </h3>
                                <p className="text-sm text-stone-600 dark:text-stone-400 leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-6 flex items-center justify-end gap-3 mt-2">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium shadow-lg shadow-rose-600/20 flex items-center gap-2 transition-transform active:scale-95"
                            >
                                <Trash2 className="w-4 h-4" />
                                {confirmText}
                            </button>
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 rounded-lg text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
}
