import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth/context';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Case Hub — Discover. Share. Compete.',
  description:
    'Premier competition discovery, publishing, and collaboration platform for MBA and business school students. Discover business cases, hackathons, consulting challenges, and find teammates.',
  keywords: [
    'Case Hub',
    'MBA Competitions',
    'Case Competitions',
    'Business School',
    'Consulting Challenges',
    'Student Competitions',
    'Team Finder',
    'Unstop Competitions',
  ],
  authors: [{ name: 'Case Hub Team' }],
  openGraph: {
    title: 'Case Hub — Discover. Share. Compete.',
    description: 'Premier competition discovery, publishing, and collaboration platform for business students.',
    siteName: 'Case Hub',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col bg-ivory text-neutral-text antialiased selection:bg-brass selection:text-white">
        <AuthProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
