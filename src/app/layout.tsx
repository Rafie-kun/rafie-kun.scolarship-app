import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ScholarPath',
  description:
    'Global student command center for university discovery, scholarships, admissions, and study-abroad planning.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
