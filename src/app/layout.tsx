import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Kas & Uang Kadeudeuh 4 B Bilal Bin Rabah (2026/2027)',
  description: 'Aplikasi pencatatan dan transparansi kas kelas & uang kadeudeuh khusus wali murid dan pengurus Kelas 4 B Bilal Bin Rabah. Mudah digunakan di HP, tinggal submit!',
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
  themeColor: '#0f766e',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Kas 4 B Bilal',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0d9488',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
