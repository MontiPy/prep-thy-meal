import React from 'react';
import { Plus, Minus } from 'lucide-react';

const IngredientCard = ({
  ingredient,
  onIncrease,
  onDecrease,
  onRemove,
  showQuantity = true,
}) => {
  const totalGrams = ingredient.grams || ingredient.gramsPerUnit || 100;
  const quantity = ingredient.quantity || 1;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 capitalize flex-1">
          {ingredient.name}
        </h3>
        {onRemove && (
          <button
            onClick={() => onRemove(ingredient.id)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm ml-2"
            aria-label={`Remove ${ingredient.name}`}
          >
            ✕
          </button>
        )}
      </div>

      {/* Quantity Controls */}
      {showQuantity && (
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => onDecrease(ingredient.id)}
            className="w-11 h-11 flex items-center justify-center bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 text-red-700 dark:text-red-300 rounded-lg font-bold touch-manipulation"
            aria-label={`Decrease ${ingredient.name} quantity`}
          >
            <Minus size={20} />
          </button>
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">
              {quantity}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {ingredient.unit === 'unit' ? 'units' : `${totalGrams}g`}
            </div>
          </div>
          <button
            onClick={() => onIncrease(ingredient.id)}
            className="w-11 h-11 flex items-center justify-center bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 text-green-700 dark:text-green-300 rounded-lg font-bold touch-manipulation"
            aria-label={`Increase ${ingredient.name} quantity`}
          >
            <Plus size={20} />
          </button>
        </div>
      )}

      {/* Nutrition Info Grid */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-2">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Cal</div>
          <div className="font-semibold text-gray-800 dark:text-gray-200">
            {Math.round(ingredient.calories * quantity)}
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900 rounded-lg p-2">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">P</div>
          <div className="font-semibold text-gray-800 dark:text-gray-200">
            {Math.round(ingredient.protein * quantity)}g
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-2">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">C</div>
          <div className="font-semibold text-gray-800 dark:text-gray-200">
            {Math.round(ingredient.carbs * quantity)}g
          </div>
        </div>
        <div className="bg-green-50 dark:bg-green-900 rounded-lg p-2">
          <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">F</div>
          <div className="font-semibold text-gray-800 dark:text-gray-200">
            {Math.round(ingredient.fat * quantity)}g
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientCard;
