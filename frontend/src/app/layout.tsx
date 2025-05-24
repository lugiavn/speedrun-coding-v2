import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Providers from './providers';
import Layout from '@/components/Layout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Speedrun Coding v2',
  description: 'A LeetCode-style web application focused on coding speed',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-touch-icon.png' },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Get environment variables
  const env = {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8005/api',
    JWT_TOKEN_KEY: process.env.NEXT_PUBLIC_JWT_TOKEN_KEY || 'speedrun_token',
    JWT_REFRESH_TOKEN_KEY: process.env.NEXT_PUBLIC_JWT_REFRESH_TOKEN_KEY || 'speedrun_refresh_token',
  };

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers env={env}>
          <Layout>
            {children}
          </Layout>
        </Providers>
      </body>
    </html>
  );
} 