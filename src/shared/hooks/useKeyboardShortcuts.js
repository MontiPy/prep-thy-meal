// src/hooks/useKeyboardShortcuts.js
import { useEffect } from 'react';

/**
 * Custom hook for registering keyboard shortcuts
 * @param {Object} shortcuts - Object mapping key combinations to handlers
 * @param {Array} dependencies - Dependencies array for the effect
 *
 * Example usage:
 * useKeyboardShortcuts({
 *   'ctrl+s': () => handleSave(),
 *   'ctrl+z': () => handleUndo(),
 *   'escape': () => handleClose()
 * }, [handleSave, handleUndo, handleClose]);
 */
export const useKeyboardShortcuts = (shortcuts, dependencies = []) => {
  const deps = Array.isArray(dependencies) ? dependencies : [];
  const depsKey = JSON.stringify(deps);
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable
      ) {
        // Allow Escape key even in input fields
        if (event.key !== 'Escape') {
          return;
        }
      }

      // Build key combination string
      const parts = [];
      if (event.ctrlKey || event.metaKey) parts.push('ctrl');
      if (event.altKey) parts.push('alt');
      if (event.shiftKey) parts.push('shift');

      // Normalize key name
      const key = event.key.toLowerCase();
      parts.push(key);

      const combination = parts.join('+');

      // Check if we have a handler for this combination
      if (shortcuts[combination]) {
        event.preventDefault();
        shortcuts[combination](event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, depsKey]);
};

/**
 * Hook for handling numeric key presses (1-9)
 */
export const useNumericShortcuts = (handlers, dependencies = []) => {
  const deps = Array.isArray(dependencies) ? dependencies : [];
  const depsKey = JSON.stringify(deps);
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Don't trigger in input fields
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'TEXTAREA' ||
        event.target.isContentEditable
      ) {
        return;
      }

      const num = parseInt(event.key);
      if (!isNaN(num) && num >= 1 && num <= 9 && handlers[num]) {
        event.preventDefault();
        handlers[num]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlers, depsKey]);
};

/**
 * Get platform-specific modifier key name (Cmd on Mac, Ctrl on Windows/Linux)
 */
export const getModifierKey = () => {
  const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
  return isMac ? '⌘' : 'Ctrl';
};

/**
 * Format shortcut for display
 */
export const formatShortcut = (shortcut) => {
  const parts = shortcut.split('+');
  return parts
    .map(part => {
      switch (part.toLowerCase()) {
        case 'ctrl':
          return getModifierKey();
        case 'alt':
          return 'Alt';
        case 'shift':
          return 'Shift';
        default:
          return part.toUpperCase();
      }
    })
    .join(' + ');
};
