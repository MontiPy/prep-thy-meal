import React from 'react';
import { X } from 'lucide-react';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger" // danger, warning, info
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const variantStyles = {
    danger: {
      button: "bg-red-600 hover:bg-red-700 text-white",
      icon: "text-red-600"
    },
    warning: {
      button: "bg-yellow-600 hover:bg-yellow-700 text-white",
      icon: "text-yellow-600"
    },
    info: {
      button: "bg-blue-600 hover:bg-blue-700 text-white",
      icon: "text-blue-600"
    }
  };

  const styles = variantStyles[variant] || variantStyles.danger;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
          aria-label="Close dialog"
        >
          <X size={20} />
        </button>

        <h2
          id="confirm-dialog-title"
          className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-4 pr-8"
        >
          {title}
        </h2>

        <p className="text-gray-600 dark:text-gray-400 mb-6 whitespace-pre-line">
          {message}
        </p>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-md font-medium ${styles.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
