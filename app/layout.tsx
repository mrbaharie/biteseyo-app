import type { Metadata } from 'next';
import './globals.css';
import { CartProvider } from '@/components/CartProvider';

export const metadata: Metadata = {
  title: 'BiteSeyo — jajanan Korea rumahan',
  description: 'Pesan jajanan Korea rumahan BiteSeyo, tanpa perlu login.',
  generator: 'AKSARA+',
  openGraph: {
    title: 'BiteSeyo — jajanan Korea rumahan',
    description: 'Pesan jajanan Korea rumahan BiteSeyo, tanpa perlu login. Didukung oleh AKSARA+.',
    siteName: 'BiteSeyo',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Baloo+2:wght@400;500;600;700&family=Nanum+Pen+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
