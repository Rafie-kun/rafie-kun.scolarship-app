import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Somnia',
  description:
    'Global student command center for university discovery, scholarships, admissions, and study-abroad planning.',
};

export const viewport: Viewport = {
  themeColor: '#08070d',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Nunito:ital,wght@0,400..800;1,400..700&family=Pixelify+Sans:wght@400..700&family=VT323&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
