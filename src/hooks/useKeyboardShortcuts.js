import { useEffect, useCallback, useRef } from 'react';

const SHORTCUT_DESCRIPTIONS = {
    '/': 'Focus search',
    'Escape': 'Close modal / Clear search',
    'j': 'Next SNP (in modal)',
    'k': 'Previous SNP (in modal)',
    '?': 'Show keyboard shortcuts',
    'g h': 'Go to dashboard',
    'g r': 'Go to report',
    'ArrowLeft': 'Previous SNP',
    'ArrowRight': 'Next SNP',
};

export function useKeyboardShortcuts(shortcuts = {}, options = {}) {
    const { enabled = true, ignoreInputs = true } = options;
    const sequenceRef = useRef('');
    const sequenceTimeoutRef = useRef(null);

    const handleKeyDown = useCallback((event) => {
        if (!enabled) return;

        if (ignoreInputs) {
            const target = event.target;
            const tagName = target.tagName.toLowerCase();
            if (tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable) {
                if (event.key !== 'Escape') return;
            }
        }

        const key = event.key;
        const ctrl = event.ctrlKey || event.metaKey;
        const shift = event.shiftKey;
        const alt = event.altKey;

        let combo = '';
        if (ctrl) combo += 'ctrl+';
        if (shift) combo += 'shift+';
        if (alt) combo += 'alt+';
        combo += key.toLowerCase();

        if (shortcuts[combo]) {
            event.preventDefault();
            shortcuts[combo](event);
            return;
        }

        if (shortcuts[key]) {
            event.preventDefault();
            shortcuts[key](event);
            return;
        }

        sequenceRef.current += key.toLowerCase();
        clearTimeout(sequenceTimeoutRef.current);

        if (shortcuts[sequenceRef.current]) {
            event.preventDefault();
            shortcuts[sequenceRef.current](event);
            sequenceRef.current = '';
            return;
        }

        sequenceTimeoutRef.current = setTimeout(() => {
            sequenceRef.current = '';
        }, 500);

    }, [enabled, ignoreInputs, shortcuts]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return { descriptions: SHORTCUT_DESCRIPTIONS };
}

export function useFocusTrap(ref, isActive) {
    useEffect(() => {
        if (!isActive || !ref.current) return;

        const element = ref.current;
        const focusableElements = element.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        const handleTabKey = (e) => {
            if (e.key !== 'Tab') return;

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        };

        firstElement.focus();
        element.addEventListener('keydown', handleTabKey);
        return () => element.removeEventListener('keydown', handleTabKey);
    }, [ref, isActive]);
}

export function useAnnounce() {
    const announce = useCallback((message, priority = 'polite') => {
        const announcer = document.getElementById('sr-announcer') || createAnnouncer();
        announcer.setAttribute('aria-live', priority);
        announcer.textContent = '';
        setTimeout(() => {
            announcer.textContent = message;
        }, 50);
    }, []);

    return announce;
}

function createAnnouncer() {
    const announcer = document.createElement('div');
    announcer.id = 'sr-announcer';
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.style.cssText = 'position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;';
    document.body.appendChild(announcer);
    return announcer;
}

export default useKeyboardShortcuts;
