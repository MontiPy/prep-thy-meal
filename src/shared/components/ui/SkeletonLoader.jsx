// src/components/SkeletonLoader.jsx
import React from 'react';

/**
 * Base skeleton component with shimmer animation
 */
export const Skeleton = ({ className = '', width, height }) => {
  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
};

/**
 * Skeleton for ingredient card
 */
export const IngredientCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
    <div className="flex items-start justify-between mb-3">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-4 rounded-full" />
    </div>
    <div className="flex items-center gap-3 mb-3">
      <Skeleton className="w-11 h-11 rounded-lg" />
      <div className="flex-1">
        <Skeleton className="h-8 w-full mb-1" />
        <Skeleton className="h-3 w-20" />
      </div>
      <Skeleton className="w-11 h-11 rounded-lg" />
    </div>
    <div className="grid grid-cols-4 gap-2">
      {[...Array(4)].map((_, i) => (
        <Skeleton key={i} className="h-16 rounded-lg" />
      ))}
    </div>
  </div>
);

/**
 * Skeleton for table row
 */
export const TableRowSkeleton = ({ columns = 5 }) => (
  <tr className="border-b border-gray-200 dark:border-gray-700">
    {[...Array(columns)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
);

/**
 * Skeleton for stat card
 */
export const StatCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
    <Skeleton className="h-4 w-24 mb-2" />
    <Skeleton className="h-8 w-16 mb-1" />
    <Skeleton className="h-3 w-32" />
  </div>
);

/**
 * Skeleton for meal section
 */
export const MealSectionSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-9 w-24 rounded-lg" />
    </div>
    <div className="space-y-3">
      {[...Array(3)].map((_, i) => (
        <IngredientCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

/**
 * Skeleton for plan card
 */
export const PlanCardSkeleton = () => (
  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
    <div className="flex items-start justify-between mb-3">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-8 w-8 rounded" />
    </div>
    <div className="space-y-2">
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
    </div>
    <div className="flex gap-2 mt-4">
      <Skeleton className="h-9 flex-1 rounded-lg" />
      <Skeleton className="h-9 w-9 rounded-lg" />
    </div>
  </div>
);

/**
 * Skeleton for search result
 */
export const SearchResultSkeleton = () => (
  <div className="flex items-center gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
    <Skeleton className="w-12 h-12 rounded" />
    <div className="flex-1">
      <Skeleton className="h-4 w-48 mb-2" />
      <Skeleton className="h-3 w-32" />
    </div>
    <Skeleton className="h-9 w-20 rounded-lg" />
  </div>
);

/**
 * Full page skeleton for initial load
 */
export const PageSkeleton = () => (
  <div className="calculator space-y-6">
    <div className="card">
      <div className="center mb-6">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96" />
      </div>
      <div className="grid md:grid-cols-3 gap-4 mb-6">
        {[...Array(3)].map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="space-y-6">
        {[...Array(2)].map((_, i) => (
          <MealSectionSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

export default Skeleton;
