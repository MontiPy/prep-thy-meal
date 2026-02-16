// src/shared/context/MacroTargetsContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const MacroTargetsContext = createContext();

/**
 * MacroTargetsProvider - Context for transferring macro targets from CalorieCalculator to MealPrepCalculator
 *
 * Replaces the fragile localStorage event listener pattern with a proper React context.
 *
 * Usage:
 * - CalorieCalculator calls setTargets() when "Send to Planner" is clicked
 * - MealPrepCalculator calls consumePendingTargets() on mount/focus to apply targets
 */
export const MacroTargetsProvider = ({ children }) => {
  const [pendingTargets, setPendingTargets] = useState(null);

  /**
   * Set macro targets to be consumed by the meal planner
   * @param {Object} targets - { calories, protein, fat, carbs }
   */
  const setTargets = useCallback((targets) => {
    setPendingTargets({
      ...targets,
      timestamp: Date.now()
    });
  }, []);

  /**
   * Consume pending targets (clears them after retrieval)
   * @returns {Object|null} - Pending targets or null if none
   */
  const consumePendingTargets = useCallback(() => {
    const targets = pendingTargets;
    setPendingTargets(null);
    return targets;
  }, [pendingTargets]);

  /**
   * Check if there are pending targets without consuming them
   * @returns {boolean}
   */
  const hasPendingTargets = useCallback(() => {
    return pendingTargets !== null;
  }, [pendingTargets]);

  return (
    <MacroTargetsContext.Provider value={{
      pendingTargets,
      setTargets,
      consumePendingTargets,
      hasPendingTargets,
    }}>
      {children}
    </MacroTargetsContext.Provider>
  );
};

/**
 * Hook to access macro targets context
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useMacroTargets = () => {
  const context = useContext(MacroTargetsContext);
  if (!context) {
    throw new Error('useMacroTargets must be used within MacroTargetsProvider');
  }
  return context;
};

export default MacroTargetsContext;
