import React from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { NotificationBanner } from '../components/NotificationBanner';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-150">
      <Header />
      <NotificationBanner />
      <main className="flex-1 flex flex-col">{children}</main>
      <Footer />
    </div>
  );
};
