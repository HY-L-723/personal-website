import type { Metadata } from 'next';
import { DataProvider } from '@/components/site/data-provider';
import { ThemeProvider } from '@/components/site/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'PVL随记',
    template: '%s · PVL随记',
  },
  description: 'PVL 的个人主页，记录学习、生活与沿途风景。过去无可挽回，未来可以改变。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <DataProvider>{children}</DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
