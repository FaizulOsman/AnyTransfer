import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Any Transfer - WebRTC P2P File Transfer',
  description: 'High-performance, zero-size-limit peer-to-peer WebRTC file sharing with local radar discovery and cross-network 6-digit code pairing.',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.png', type: 'image/png' },
    ],
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'Any Transfer - WebRTC P2P File Transfer',
    description: 'High-performance, zero-size-limit peer-to-peer WebRTC file sharing with local radar discovery and cross-network 6-digit code pairing.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-cyan-500/20 selection:text-cyan-300">
        {children}
      </body>
    </html>
  );
}
