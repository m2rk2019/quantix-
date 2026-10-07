import { useCallback, useState } from 'react';

interface UndoRedoState<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useUndoRedo<T>(initial: T) {
  const [state, setState] = useState<UndoRedoState<T>>({
    past: [],
    present: initial,
    future: [],
  });

  const set = useCallback((next: T | ((current: T) => T)) => {
    setState((current) => {
      const present =
        typeof next === 'function'
          ? (next as (value: T) => T)(current.present)
          : next;

      return {
        past: [...current.past, current.present],
        present,
        future: [],
      };
    });
  }, []);

  const replace = useCallback((next: T) => {
    setState((current) => ({
      ...current,
      present: next,
    }));
  }, []);

  const undo = useCallback(() => {
    setState((current) => {
      if (current.past.length === 0) {
        return current;
      }

      const previous = current.past[current.past.length - 1]!;
      return {
        past: current.past.slice(0, -1),
        present: previous,
        future: [current.present, ...current.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setState((current) => {
      if (current.future.length === 0) {
        return current;
      }

      const next = current.future[0]!;
      return {
        past: [...current.past, current.present],
        present: next,
        future: current.future.slice(1),
      };
    });
  }, []);

  const reset = useCallback((next: T) => {
    setState({ past: [], present: next, future: [] });
  }, []);

  return {
    state: state.present,
    set,
    replace,
    reset,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  };
}
