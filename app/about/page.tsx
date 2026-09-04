import type { Metadata } from 'next';
import { AboutPage } from '@/components/site/about-page';

export const metadata: Metadata = {
  title: '关于',
  description: '认识 PVL，以及这个小站的来由。',
};

export default function Page() {
  return <AboutPage />;
}
