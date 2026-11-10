import StoreProvider from '@/components/StoreProvider';
import { JsonLd, defaultMetadata } from '@/lib/seo';
import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = defaultMetadata;

export const viewport: Viewport = {
  themeColor: '#020617',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <JsonLd />
        <StoreProvider>
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
