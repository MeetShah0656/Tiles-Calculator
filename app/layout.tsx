import type { Metadata, Viewport } from 'next';
import './globals.css';
import PWARegister from '@/components/PWARegister';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: 'Yash Marble | Tiles Calculator & Quotation Suite',
  description: 'Production-ready square footage calculator and quotation builder for tile, marble, granite, stone, and fabrication projects. Powered by Yash Marble.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Yash Marble',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light h-full">
      <body className="h-full bg-white text-slate-900 font-sans selection:bg-red-500/10 selection:text-red-900">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
