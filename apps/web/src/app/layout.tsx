import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/features/context/AuthContext';
import { DemoProvider } from '@/features/context/DemoContext';

export const metadata: Metadata = {
  title: 'AICTE FlowGuard',
  description: 'AICTE Approval Workflow Automation & Compliance System',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#FAF8F5] text-[#1A1816]">
        <AuthProvider>
          <DemoProvider>{children}</DemoProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
