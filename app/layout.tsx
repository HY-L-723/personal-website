import type { Metadata } from 'next';
import { DataProvider } from '@/components/site/data-provider';
import { ThemeProvider } from '@/components/site/theme-provider';
import { VisitTracker } from '@/components/site/visit-tracker';
import './globals.css';
import './admin.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://pvl-notes.hl7894687.chatgpt.site'),
  title: {
    default: 'PVL随记',
    template: '%s · PVL随记',
  },
  description: 'PVL 的个人主页，记录学习、生活与沿途风景。过去无可挽回，未来可以改变。',
  keywords: ['PVL随记', '个人网站', '博客', '学习笔记', '生活记录'],
  authors: [{ name: 'PVL' }],
  creator: 'PVL',
  icons: { icon: '/favicon.svg' },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    url: '/',
    siteName: 'PVL随记',
    title: 'PVL随记',
    description: '过去无可挽回，未来可以改变。记录学习、生活与沿途风景。',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'PVL随记' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PVL随记',
    description: '过去无可挽回，未来可以改变。',
    images: ['/og.png'],
  },
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
          <DataProvider>
            <VisitTracker />
            {children}
          </DataProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
