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
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-gray-800 capitalize flex-1">
          {ingredient.name}
        </h3>
        {onRemove && (
          <button
            onClick={() => onRemove(ingredient.id)}
            className="text-red-600 hover:text-red-800 text-sm ml-2"
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
            className="w-11 h-11 flex items-center justify-center bg-red-100 hover:bg-red-200 text-red-700 rounded-lg font-bold touch-manipulation"
            aria-label={`Decrease ${ingredient.name} quantity`}
          >
            <Minus size={20} />
          </button>
          <div className="flex-1 text-center">
            <div className="text-2xl font-bold text-gray-800">
              {quantity}
            </div>
            <div className="text-xs text-gray-600">
              {ingredient.unit === 'unit' ? 'units' : `${totalGrams}g`}
            </div>
          </div>
          <button
            onClick={() => onIncrease(ingredient.id)}
            className="w-11 h-11 flex items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 rounded-lg font-bold touch-manipulation"
            aria-label={`Increase ${ingredient.name} quantity`}
          >
            <Plus size={20} />
          </button>
        </div>
      )}

      {/* Nutrition Info Grid */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-blue-50 rounded-lg p-2">
          <div className="text-xs text-gray-600 mb-1">Cal</div>
          <div className="font-semibold text-gray-800">
            {Math.round(ingredient.calories * quantity)}
          </div>
        </div>
        <div className="bg-red-50 rounded-lg p-2">
          <div className="text-xs text-gray-600 mb-1">P</div>
          <div className="font-semibold text-gray-800">
            {Math.round(ingredient.protein * quantity)}g
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-2">
          <div className="text-xs text-gray-600 mb-1">C</div>
          <div className="font-semibold text-gray-800">
            {Math.round(ingredient.carbs * quantity)}g
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-2">
          <div className="text-xs text-gray-600 mb-1">F</div>
          <div className="font-semibold text-gray-800">
            {Math.round(ingredient.fat * quantity)}g
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientCard;
