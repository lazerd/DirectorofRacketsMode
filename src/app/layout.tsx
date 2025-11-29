import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Director of Rackets - Club & Coach Management Platform',
  description: 'The complete platform for tennis clubs and coaches. Manage slots, send controlled email blasts, and fill every opening.',
  keywords: ['tennis', 'coaching', 'scheduling', 'club management', 'lessons', 'booking'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
