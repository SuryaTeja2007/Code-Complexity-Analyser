import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Code2, Sun, Moon, Terminal, LayoutDashboard, Home } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export const Header: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Analyzer', path: '/analyzer', icon: Terminal },
    { label: 'Results', path: '/results', icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link
          to="/"
          id="nav-brand-link"
          className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md py-1"
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-900 dark:bg-emerald-500/10 border border-zinc-800 dark:border-emerald-500/30 flex items-center justify-center text-emerald-400 dark:text-emerald-400 group-hover:scale-105 transition-transform duration-150">
            <Code2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              Code Complexity Analyzer
              <span className="hidden md:inline-flex text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                Phase 1
              </span>
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-zinc-400 hidden sm:block">
              AI-Powered Static & Complexity Analysis
            </span>
          </div>
        </Link>

        {/* Navigation links & Theme toggle */}
        <div className="flex items-center gap-1 sm:gap-4">
          <nav className="flex items-center gap-1" aria-label="Main Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  id={`nav-link-${item.label.toLowerCase()}`}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="h-5 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            id="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            className="p-2 rounded-md text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 transition-colors"
            title={`Toggle ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
