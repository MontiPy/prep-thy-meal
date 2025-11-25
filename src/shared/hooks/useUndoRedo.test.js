// src/shared/hooks/useUndoRedo.test.js
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useUndoRedo } from './useUndoRedo';

describe('useUndoRedo', () => {
  it('should initialize with the given state', () => {
    const { result } = renderHook(() => useUndoRedo({ value: 'initial' }));

    expect(result.current.state).toEqual({ value: 'initial' });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
  });

  it('should update state and enable undo', () => {
    const { result } = renderHook(() => useUndoRedo({ value: 'initial' }));

    act(() => {
      result.current.setState({ value: 'updated' });
    });

    expect(result.current.state).toEqual({ value: 'updated' });
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should undo to previous state', () => {
    const { result } = renderHook(() => useUndoRedo({ value: 'initial' }));

    act(() => {
      result.current.setState({ value: 'updated' });
    });

    act(() => {
      result.current.undo();
    });

    expect(result.current.state).toEqual({ value: 'initial' });
    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(true);
  });

  it('should redo to next state', () => {
    const { result } = renderHook(() => useUndoRedo({ value: 'initial' }));

    act(() => {
      result.current.setState({ value: 'updated' });
    });

    act(() => {
      result.current.undo();
    });

    act(() => {
      result.current.redo();
    });

    expect(result.current.state).toEqual({ value: 'updated' });
    expect(result.current.canUndo).toBe(true);
    expect(result.current.canRedo).toBe(false);
  });

  it('should clear future when new action is performed after undo', () => {
    const { result } = renderHook(() => useUndoRedo({ value: 'initial' }));

    act(() => {
      result.current.setState({ value: 'first' });
    });

    act(() => {
      result.current.setState({ value: 'second' });
    });

    act(() => {
      result.current.undo();
    });

    expect(result.current.canRedo).toBe(true);

    act(() => {
      result.current.setState({ value: 'third' });
    });

    expect(result.current.canRedo).toBe(false);
    expect(result.current.state).toEqual({ value: 'third' });
  });

  it('should limit history size', () => {
    const maxHistory = 3;
    const { result } = renderHook(() => useUndoRedo(0, maxHistory));

    // Add more states than max history
    for (let i = 1; i <= 5; i++) {
      act(() => {
        result.current.setState(i);
      });
    }

    expect(result.current.state).toBe(5);

    // Should only be able to undo maxHistory times
    let undoCount = 0;
    while (result.current.canUndo) {
      act(() => {
        result.current.undo();
      });
      undoCount++;
    }

    expect(undoCount).toBe(maxHistory);
  });

  it('should support functional updates', () => {
    const { result } = renderHook(() => useUndoRedo(0));

    act(() => {
      result.current.setState((prev) => prev + 1);
    });

    expect(result.current.state).toBe(1);

    act(() => {
      result.current.setState((prev) => prev + 10);
    });

    expect(result.current.state).toBe(11);
  });

  it('should clear history when clearHistory is called', () => {
    const { result } = renderHook(() => useUndoRedo({ value: 'initial' }));

    act(() => {
      result.current.setState({ value: 'first' });
    });

    act(() => {
      result.current.setState({ value: 'second' });
    });

    expect(result.current.canUndo).toBe(true);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.canUndo).toBe(false);
    expect(result.current.canRedo).toBe(false);
    expect(result.current.state).toEqual({ value: 'second' });
  });

  it('should track history length correctly', () => {
    const { result } = renderHook(() => useUndoRedo(0));

    expect(result.current.historyLength).toBe(0);

    act(() => {
      result.current.setState(1);
    });

    expect(result.current.historyLength).toBe(1);

    act(() => {
      result.current.setState(2);
    });

    expect(result.current.historyLength).toBe(2);

    act(() => {
      result.current.undo();
    });

    expect(result.current.historyLength).toBe(1);
    expect(result.current.futureLength).toBe(1);
  });
});
