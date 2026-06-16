import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    // Check local storage or system preference on mount
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('mitrashare_theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true; // Default to dark mode
  });

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      // Standard Tailwind dark class on <html>
      root.classList.add('dark');
      // Legacy classes used in your app for existing elements
      document.body.classList.add('dark-theme', 'vault-dark-theme');
      localStorage.setItem('mitrashare_theme', 'dark');
    } else {
      root.classList.remove('dark');
      document.body.classList.remove('dark-theme', 'vault-dark-theme');
      localStorage.setItem('mitrashare_theme', 'light');
    }
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark(!isDark)}
      className={`
        relative w-16 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500
        ${isDark ? 'bg-slate-800' : 'bg-sky-200'}
      `}
      aria-label="Toggle Theme"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
    >
      {/* Track Icons: Positioned behind the thumb */}
      <div className="absolute inset-0 flex justify-between items-center px-1.5 pointer-events-none">
        {/* Moon is on the left, revealed in Dark Mode */}
        <Moon 
          size={16} 
          className="text-indigo-200 transition-opacity duration-300"
          fill="currentColor"
        />
        {/* Sun is on the right, revealed in Light Mode */}
        <Sun 
          size={16} 
          className="text-amber-500 transition-opacity duration-300"
          fill="currentColor"
        />
      </div>

      {/* Sliding Thumb */}
      <div
        className={`
          relative w-6 h-6 rounded-full bg-white shadow-md transform transition-transform duration-300 ease-in-out z-10
          ${isDark ? 'translate-x-8' : 'translate-x-0'}
        `}
      />
    </button>
  );
}
