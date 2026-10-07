/**
 * Undo/Redo command stack — architecture ready for takeoff measurements.
 */

export type TakeoffHistoryCommand<TState> = {
  label: string;
  undo: (state: TState) => TState;
  redo: (state: TState) => TState;
};

export class TakeoffHistoryStack<TState> {
  private undoStack: TakeoffHistoryCommand<TState>[] = [];
  private redoStack: TakeoffHistoryCommand<TState>[] = [];
  private readonly maxSize: number;

  constructor(maxSize = 100) {
    this.maxSize = maxSize;
  }

  get canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  get canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  get undoLabel(): string | null {
    return this.undoStack.at(-1)?.label ?? null;
  }

  get redoLabel(): string | null {
    return this.redoStack.at(-1)?.label ?? null;
  }

  push(command: TakeoffHistoryCommand<TState>, state: TState): TState {
    const next = command.redo(state);
    this.undoStack.push(command);
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }
    this.redoStack = [];
    return next;
  }

  undo(state: TState): TState {
    const command = this.undoStack.pop();
    if (!command) return state;
    this.redoStack.push(command);
    return command.undo(state);
  }

  redo(state: TState): TState {
    const command = this.redoStack.pop();
    if (!command) return state;
    this.undoStack.push(command);
    return command.redo(state);
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

/** Keyboard shortcut map — Phase 3 measurement engine. */
export const TAKEOFF_SHORTCUTS = {
  pan: 'Space / H',
  select: 'V',
  line: 'L',
  polyline: 'P',
  area: 'A',
  rectangle: 'R',
  circle: 'C',
  count: 'N',
  text: 'T',
  calibrate: 'K',
  delete: 'Delete',
  copy: 'Ctrl+C',
  paste: 'Ctrl+V',
  undo: 'Ctrl+Z',
  redo: 'Ctrl+Y',
  redoAlt: 'Ctrl+Shift+Z',
  duplicate: 'Ctrl+D',
  rotate: 'Ctrl+Shift+R',
  scaleUp: ']',
  scaleDown: '[',
  zoomIn: '+ / =',
  zoomOut: '-',
  fit: '0',
  finish: 'Enter',
  cancel: 'Escape',
} as const;
