import React from 'react';
import { Film } from 'lucide-react';

export const Footer: React.FC<{ onSelectTab: (tab: 'movies' | 'theatres' | 'bookings' | 'admin') => void }> = ({
  onSelectTab,
}) => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 py-12 px-6 text-xs text-slate-500">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-amber-400" />
          <span className="font-bold tracking-tight text-white text-sm">IMOVIES</span>
          <span className="text-slate-600">·</span>
          <span>Cinema Ticketing &amp; Theatre Management Platform</span>
        </div>

        <div className="flex items-center gap-6">
          <button
            onClick={() => onSelectTab('movies')}
            className="hover:text-slate-300 transition-colors"
          >
            Movies
          </button>
          <button
            onClick={() => onSelectTab('theatres')}
            className="hover:text-slate-300 transition-colors"
          >
            Cinemas
          </button>
          <button
            onClick={() => onSelectTab('bookings')}
            className="hover:text-slate-300 transition-colors"
          >
            My Bookings
          </button>
        </div>

        <div className="text-[11px] text-slate-600">
          &copy; {new Date().getFullYear()} IMovies Entertainment Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
