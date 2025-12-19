
import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/providers/theme-provider"
import NextTopLoader from 'nextjs-toploader';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/react';
import { KeyboardShortcuts } from "@/components/layout/keyboard-shortcuts";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | BagBill Warehouse Manager',
    default: 'BagBill - Smart Warehouse Management'
  },
  description: 'Professional agricultural warehouse management system for inventory, billing, and rent tracking.',
  keywords: ['warehouse', 'agriculture', 'inventory', 'billing', 'rent', 'management', 'saas'],
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming on inputs, common for "app-like" feel
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} font-body antialiased bg-background`}>
        <ThemeProvider>
          <NextTopLoader color="#1DA1F2" showSpinner={false} height={3} />
          {children}
          <Toaster />
          <SpeedInsights />
          <Analytics />
          <KeyboardShortcuts />
        </ThemeProvider>
      </body>
    </html>
  );
}
