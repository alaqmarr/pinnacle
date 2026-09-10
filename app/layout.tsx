import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { getGlobalSettings } from '@/lib/settings';
import { MarketingHeadScripts } from '@/components/MarketingHeadScripts';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  fallback: ['system-ui', 'sans-serif'],
});

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: '%s | Pinnacle Distributing',
    default: 'Pinnacle Distributing | Industrial Packaging & Janitorial Supplies',
  },
  description:
    'Leading wholesale distributor of heavy-duty corrugated shipping cartons, stretch films, strapping, industrial degreasers, sanitizers, and commercial janitorial essentials.',
  keywords: [
    'industrial packaging',
    'janitorial supplies',
    'corrugated boxes',
    'stretch wrap',
    'commercial cleaning chemicals',
    'Pinnacle Distributing',
  ],
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getGlobalSettings();

  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <MarketingHeadScripts scripts={settings?.headScripts} />
      </head>
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 antialiased font-sans">
        {settings?.bodyTopScripts && (
          settings.bodyTopScripts.trim().startsWith("<") ? (
            <div
              id="marketing-body-top-scripts"
              suppressHydrationWarning
              dangerouslySetInnerHTML={{ __html: settings.bodyTopScripts }}
            />
          ) : (
            <script
              id="marketing-body-top-scripts"
              type="text/javascript"
              dangerouslySetInnerHTML={{ __html: settings.bodyTopScripts }}
            />
          )
        )}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
