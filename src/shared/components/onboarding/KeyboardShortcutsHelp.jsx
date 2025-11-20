// src/components/KeyboardShortcutsHelp.jsx
import React from 'react';
import { X, Keyboard } from 'lucide-react';
import { getModifierKey } from '../../shared/hooks/useKeyboardShortcuts';

const KeyboardShortcutsHelp = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const mod = getModifierKey();

  const shortcuts = [
    {
      category: 'Navigation',
      items: [
        { keys: ['1', '2', '3', '4', '5'], description: 'Switch between tabs' },
        { keys: ['Esc'], description: 'Close dialogs/cancel' },
      ]
    },
    {
      category: 'Meal Planning',
      items: [
        { keys: [mod, 'S'], description: 'Save current plan' },
        { keys: [mod, 'E'], description: 'Export to PDF' },
        { keys: [mod, 'N'], description: 'Create new plan' },
        { keys: [mod, 'Z'], description: 'Undo last action' },
        { keys: [mod, 'Y'], description: 'Redo action' },
        { keys: ['+'], description: 'Increase ingredient quantity' },
        { keys: ['-'], description: 'Decrease ingredient quantity' },
      ]
    },
    {
      category: 'Search & Navigation',
      items: [
        { keys: [mod, 'F'], description: 'Focus search' },
        { keys: [mod, 'K'], description: 'Quick search ingredients' },
      ]
    },
    {
      category: 'General',
      items: [
        { keys: ['?'], description: 'Show this help' },
      ]
    }
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Keyboard className="text-blue-600 dark:text-blue-400" size={24} />
            <h2 id="shortcuts-title" className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            aria-label="Close shortcuts help"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">
                {section.category}
              </h3>
              <div className="space-y-3">
                {section.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <span className="text-gray-600 dark:text-gray-400">
                      {item.description}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((key, keyIndex) => (
                        <React.Fragment key={keyIndex}>
                          {keyIndex > 0 && (
                            <span className="text-gray-400 dark:text-gray-500 mx-1">
                              +
                            </span>
                          )}
                          <kbd className="px-2 py-1 text-sm font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 p-4 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Press <kbd className="px-2 py-1 text-xs font-semibold bg-gray-200 dark:bg-gray-700 rounded">?</kbd> anytime to open this help
          </p>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
