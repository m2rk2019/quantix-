'use client';

import { useEffect } from 'react';

import { normalizeThemeColor } from '@/lib/company/branding';

interface CompanyThemeProviderProps {
  themeColor: string;
}

function applyCompanyTheme(color: string): void {
  const root = document.documentElement;
  root.style.setProperty('--company-primary', color);
  root.style.setProperty('--primary', color);
  root.style.setProperty('--ring', color);
}

function clearCompanyTheme(): void {
  const root = document.documentElement;
  root.style.removeProperty('--company-primary');
  root.style.removeProperty('--primary');
  root.style.removeProperty('--ring');
}

export function CompanyThemeProvider({
  themeColor,
}: CompanyThemeProviderProps): null {
  useEffect(() => {
    const color = normalizeThemeColor(themeColor);
    applyCompanyTheme(color);
    return () => {
      clearCompanyTheme();
    };
  }, [themeColor]);

  return null;
}
