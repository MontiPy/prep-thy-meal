// src/hooks/useUndoRedo.js
import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for undo/redo functionality
 * @param {*} initialState - Initial state value
 * @param {number} maxHistory - Maximum history length (default: 20)
 * @returns {Object} { state, setState, undo, redo, canUndo, canRedo, clearHistory }
 */
export const useUndoRedo = (initialState, maxHistory = 20) => {
  const [state, setStateInternal] = useState(initialState);
  const [history, setHistory] = useState([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoRedoAction = useRef(false);

  const setState = useCallback((newState) => {
    // If this is an undo/redo action, don't add to history
    if (isUndoRedoAction.current) {
      setStateInternal(newState);
      return;
    }

    setHistory(prevHistory => {
      // Remove any "future" states if we're not at the end
      const truncatedHistory = prevHistory.slice(0, currentIndex + 1);

      // Add new state
      const newHistory = [...truncatedHistory, newState];

      // Limit history size
      if (newHistory.length > maxHistory) {
        return newHistory.slice(-maxHistory);
      }

      return newHistory;
    });

    setCurrentIndex(prev => {
      const newIndex = Math.min(prev + 1, maxHistory - 1);
      return newIndex;
    });

    setStateInternal(newState);
  }, [currentIndex, maxHistory]);

  const undo = useCallback(() => {
    if (currentIndex > 0) {
      isUndoRedoAction.current = true;
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setStateInternal(history[newIndex]);
      // Reset flag after state update
      setTimeout(() => {
        isUndoRedoAction.current = false;
      }, 0);
      return history[newIndex];
    }
    return state;
  }, [currentIndex, history, state]);

  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      isUndoRedoAction.current = true;
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setStateInternal(history[newIndex]);
      // Reset flag after state update
      setTimeout(() => {
        isUndoRedoAction.current = false;
      }, 0);
      return history[newIndex];
    }
    return state;
  }, [currentIndex, history, state]);

  const clearHistory = useCallback(() => {
    setHistory([state]);
    setCurrentIndex(0);
  }, [state]);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  return {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    historyLength: history.length,
    currentIndex
  };
};
