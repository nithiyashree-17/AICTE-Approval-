import type { Metadata } from 'next';
import './globals.css';
import { DemoProvider } from '@/features/context/DemoContext';

export const metadata: Metadata = {
  title: 'AICTE FlowGuard - Approval Workflow Automation & Compliance System',
  description:
    'Integrated AICTE Approval Workflow Automation, Compliance Monitoring and Alert Management System (Problem Statement ID: 26262)',
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
        <DemoProvider>{children}</DemoProvider>
      </body>
    </html>
  );
}
