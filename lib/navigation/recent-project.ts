export const RECENT_PROJECT_STORAGE_KEY = 'quantix.recentProjectId';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getRecentProjectId(): string | null {
  if (!canUseStorage()) {
    return null;
  }

  try {
    return window.localStorage.getItem(RECENT_PROJECT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setRecentProjectId(projectId: string): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(RECENT_PROJECT_STORAGE_KEY, projectId);
  } catch {
    // Ignore quota / privacy mode errors.
  }
}

export function clearRecentProjectId(): void {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.removeItem(RECENT_PROJECT_STORAGE_KEY);
  } catch {
    // Ignore storage errors.
  }
}
