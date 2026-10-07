/**
 * Master Template version helpers — immutable versioned templates.
 * Format: "1.0", "1.1", "1.2" (display as v1.0, v1.1, …).
 */

export function normalizeTemplateVersion(value: string | null | undefined): string {
  const raw = String(value ?? '')
    .trim()
    .replace(/^v/i, '');
  if (!raw) return '1.0';
  const parts = raw.split('.');
  const major = Number.parseInt(parts[0] ?? '1', 10);
  const minor = Number.parseInt(parts[1] ?? '0', 10);
  if (!Number.isFinite(major) || major < 0) return '1.0';
  const safeMinor = Number.isFinite(minor) && minor >= 0 ? minor : 0;
  return `${major}.${safeMinor}`;
}

export function formatTemplateVersionLabel(version: string | null | undefined): string {
  return `v${normalizeTemplateVersion(version)}`;
}

/** First version for a new template family. */
export function initialTemplateVersion(): string {
  return '1.0';
}

/**
 * Next version after an existing one (minor bump): 1.0 → 1.1 → 1.2.
 */
export function nextTemplateVersion(latest: string | null | undefined): string {
  if (!latest) return initialTemplateVersion();
  const current = normalizeTemplateVersion(latest);
  const [majorStr, minorStr] = current.split('.');
  const major = Number.parseInt(majorStr, 10);
  const minor = Number.parseInt(minorStr, 10);
  return `${major}.${minor + 1}`;
}

/** Compare two versions; positive if a > b. */
export function compareTemplateVersions(a: string, b: string): number {
  const na = normalizeTemplateVersion(a);
  const nb = normalizeTemplateVersion(b);
  const [aMaj, aMin] = na.split('.').map((n) => Number.parseInt(n, 10));
  const [bMaj, bMin] = nb.split('.').map((n) => Number.parseInt(n, 10));
  if (aMaj !== bMaj) return aMaj - bMaj;
  return aMin - bMin;
}
