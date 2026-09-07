import type { Metadata } from 'next';
import '@fontsource/dm-serif-display/400.css';
import '@fontsource/geist/400.css';
import '@fontsource/geist/500.css';
import '@fontsource/geist/600.css';
import './globals.css';
export const metadata: Metadata = { title: 'Odette — Small routines, softer days', description: 'A little space for your daily rituals. Build gentle routines and watch yourself grow.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
