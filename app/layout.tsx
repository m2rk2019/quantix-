import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';

import { ThemeProvider } from '@/components/providers/theme-provider';
import {
  APP_TITLE,
  COMPANY_NAME,
  FAVICON_PATH,
  ICON_192_PATH,
  ICON_512_PATH,
  TAGLINE,
} from '@/lib/branding';

import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: {
    default: APP_TITLE,
    template: `%s | ${COMPANY_NAME}`,
  },
  description: TAGLINE,
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: FAVICON_PATH, type: 'image/svg+xml' },
      { url: ICON_192_PATH, sizes: '192x192', type: 'image/png' },
      { url: ICON_512_PATH, sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: ICON_192_PATH, sizes: '192x192', type: 'image/png' }],
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.JSX.Element {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} min-h-screen antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
