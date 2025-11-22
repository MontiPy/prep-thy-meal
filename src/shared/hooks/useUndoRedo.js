// src/shared/hooks/useUndoRedo.js
import { useState, useCallback } from 'react';

/**
 * Custom hook for undo/redo functionality
 * @param {any} initialState - Initial state value
 * @param {number} maxHistory - Maximum number of history states to keep (default: 20)
 * @returns {Object} - { state, setState, undo, redo, canUndo, canRedo, clearHistory }
 *
 * Example usage:
 * const { state, setState, undo, redo, canUndo, canRedo } = useUndoRedo(initialMeals, 20);
 */
export const useUndoRedo = (initialState, maxHistory = 20) => {
  const [state, setStateInternal] = useState(initialState);
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const setState = useCallback((newState) => {
    // If it's a function, call it with current state
    const resolvedState = typeof newState === 'function' ? newState(state) : newState;

    // Add current state to past history
    setPast((prev) => {
      const newPast = [...prev, state];
      // Limit history size
      if (newPast.length > maxHistory) {
        return newPast.slice(-maxHistory);
      }
      return newPast;
    });

    // Clear future when new action is performed
    setFuture([]);

    // Set new state
    setStateInternal(resolvedState);
  }, [state, maxHistory]);

  const undo = useCallback(() => {
    if (past.length === 0) return;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    setPast(newPast);
    setFuture((prev) => [state, ...prev]);
    setStateInternal(previous);
  }, [past, state]);

  const redo = useCallback(() => {
    if (future.length === 0) return;

    const next = future[0];
    const newFuture = future.slice(1);

    setPast((prev) => [...prev, state]);
    setFuture(newFuture);
    setStateInternal(next);
  }, [future, state]);

  const clearHistory = useCallback(() => {
    setPast([]);
    setFuture([]);
  }, []);

  const canUndo = past.length > 0;
  const canRedo = future.length > 0;

  return {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    historyLength: past.length,
    futureLength: future.length,
  };
};

export default useUndoRedo;
