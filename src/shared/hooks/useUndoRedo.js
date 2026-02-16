// src/shared/hooks/useUndoRedo.js
import { useState, useCallback, useRef, useEffect } from 'react';

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

  // Use ref to track current state (fixes stale closure issue)
  const stateRef = useRef(state);

  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const setState = useCallback((newState) => {
    // If it's a function, call it with current state from ref
    const resolvedState = typeof newState === 'function' ? newState(stateRef.current) : newState;

    // Add current state to past history
    setPast((prev) => {
      const newPast = [...prev, stateRef.current];
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
  }, [maxHistory]); // No dependency on state - callback is now stable

  const undo = useCallback(() => {
    setPast((prevPast) => {
      if (prevPast.length === 0) return prevPast;

      const previous = prevPast[prevPast.length - 1];
      const newPast = prevPast.slice(0, -1);

      setFuture((prev) => [stateRef.current, ...prev]);
      setStateInternal(previous);

      return newPast;
    });
  }, []); // Stable - no dependencies

  const redo = useCallback(() => {
    setFuture((prevFuture) => {
      if (prevFuture.length === 0) return prevFuture;

      const next = prevFuture[0];
      const newFuture = prevFuture.slice(1);

      setPast((prev) => [...prev, stateRef.current]);
      setStateInternal(next);

      return newFuture;
    });
  }, []); // Stable - no dependencies

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
