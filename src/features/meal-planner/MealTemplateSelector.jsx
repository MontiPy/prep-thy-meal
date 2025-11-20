// src/components/MealTemplateSelector.jsx
import React, { useState } from 'react';
import { X, Plus, Save, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import {
  getTemplatesByCategory,
  applyTemplate,
  saveCustomTemplate,
  deleteCustomTemplate
} from './mealTemplates';
import toast from 'react-hot-toast';

const MealTemplateSelector = ({ isOpen, onClose, mealType, allIngredients, onApplyTemplate, currentMealIngredients }) => {
  const [expandedTemplate, setExpandedTemplate] = useState(null);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');

  if (!isOpen) return null;

  const templates = getTemplatesByCategory(mealType);

  const handleApplyTemplate = (template) => {
    const ingredients = applyTemplate(template, allIngredients);

    // Check for missing ingredients
    const missingCount = ingredients.filter(ing => ing.notFound).length;
    if (missingCount > 0) {
      toast.error(`${missingCount} ingredient(s) not found in your library. They'll be added as placeholders.`);
    } else {
      toast.success(`Applied template: ${template.name}`);
    }

    onApplyTemplate(ingredients);
    onClose();
  };

  const handleSaveCurrentAsTemplate = () => {
    if (!currentMealIngredients || currentMealIngredients.length === 0) {
      toast.error('Add some ingredients first!');
      return;
    }

    if (!newTemplateName.trim()) {
      toast.error('Please enter a template name');
      return;
    }

    try {
      const template = {
        name: newTemplateName,
        description: newTemplateDescription,
        category: mealType,
        ingredients: currentMealIngredients.map(ing => ({
          name: ing.name,
          quantity: ing.quantity,
          gramsPerUnit: ing.gramsPerUnit
        }))
      };

      saveCustomTemplate(template);
      toast.success('Template saved!');
      setShowSaveDialog(false);
      setNewTemplateName('');
      setNewTemplateDescription('');
      onClose();
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleDeleteTemplate = (templateId, event) => {
    event.stopPropagation();
    if (window.confirm('Delete this template?')) {
      deleteCustomTemplate(templateId);
      toast.success('Template deleted');
      // Force re-render by closing and reopening (or use state to track templates)
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-title"
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-start justify-between">
            <div>
              <h2 id="template-title" className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-1">
                Meal Templates
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                {mealType} templates
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              aria-label="Close templates"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Save current meal as template */}
          {!showSaveDialog && currentMealIngredients && currentMealIngredients.length > 0 && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-1">
                    Save Current Meal as Template
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {currentMealIngredients.length} ingredient(s) in current {mealType}
                  </p>
                </div>
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                >
                  <Save size={16} />
                  Save as Template
                </button>
              </div>
            </div>
          )}

          {/* Save template dialog */}
          {showSaveDialog && (
            <div className="mb-6 p-4 bg-white dark:bg-gray-700 rounded-lg border-2 border-blue-500">
              <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                New Template
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g., My Favorite Breakfast"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description (optional)
                  </label>
                  <input
                    type="text"
                    value={newTemplateDescription}
                    onChange={(e) => setNewTemplateDescription(e.target.value)}
                    placeholder="Brief description..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveCurrentAsTemplate}
                    className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                  >
                    Save Template
                  </button>
                  <button
                    onClick={() => {
                      setShowSaveDialog(false);
                      setNewTemplateName('');
                      setNewTemplateDescription('');
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Templates list */}
          <div className="space-y-3">
            {templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <p>No templates available for {mealType}.</p>
                <p className="text-sm mt-2">Create your first template by adding ingredients to your meal!</p>
              </div>
            ) : (
              templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
                >
                  <button
                    onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                    className="w-full p-4 flex items-start justify-between text-left hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                          {template.name}
                        </h3>
                        {template.isCustom && (
                          <span className="px-2 py-0.5 text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded">
                            Custom
                          </span>
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {template.description}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {template.ingredients.length} ingredient(s)
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {template.isCustom && (
                        <button
                          onClick={(e) => handleDeleteTemplate(template.id, e)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded"
                          aria-label="Delete template"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {expandedTemplate === template.id ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Expanded details */}
                  {expandedTemplate === template.id && (
                    <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                      <div className="mt-3 space-y-2">
                        {template.ingredients.map((ing, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between text-sm py-1"
                          >
                            <span className="text-gray-700 dark:text-gray-300 capitalize">
                              {ing.name}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">
                              {ing.quantity} × {ing.gramsPerUnit}g
                            </span>
                          </div>
                        ))}
                      </div>
                      <button
                        onClick={() => handleApplyTemplate(template)}
                        className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                      >
                        <Plus size={16} />
                        Apply Template
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Templates apply all ingredients at once. You can adjust quantities after applying.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MealTemplateSelector;
