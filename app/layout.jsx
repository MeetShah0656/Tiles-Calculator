import './globals.css';
import PWARegister from '@/components/PWARegister';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: 'TIVERA | Natural Stone & Tiles Estimator',
  description: 'Square footage calculator and quotation builder for granite, marble, tiles, and Kota stone projects. Powered by TIVERA.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'TIVERA',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="light h-full">
      <body className="h-full bg-white text-slate-900 font-sans selection:bg-slate-900 selection:text-white">
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
