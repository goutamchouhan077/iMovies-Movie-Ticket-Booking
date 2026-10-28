import React, { useState, useEffect } from 'react';
import { Movie } from '../api/client.ts';
import { Star, Clock, Ticket, ChevronRight, ChevronLeft } from 'lucide-react';

interface HeroBannerProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ movies, onSelectMovie }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (movies.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % movies.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [movies.length]);

  if (!movies || movies.length === 0) return null;

  const currentMovie = movies[currentIndex] || movies[0];

  return (
    <div className="relative w-full bg-slate-950 border-b border-slate-800 overflow-hidden">
      {/* Background Ambience with Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={currentMovie.backdropUrl || currentMovie.posterUrl}
          alt={currentMovie.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-top opacity-25 filter blur-sm scale-105 transition-all duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-12 md:py-20 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Column: Movie Info & CTAs */}
          <div className="lg:col-span-7 flex flex-col items-start gap-4">
            {/* Clean unboxed metadata with dot separators */}
            <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
              <span className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="font-mono tabular-nums">{currentMovie.rating.toFixed(1)}</span> / 5.0
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-300">{currentMovie.genre.join(', ')}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="flex items-center gap-1 text-slate-300">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono tabular-nums">{currentMovie.duration}</span> min
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-400">{currentMovie.certification}</span>
            </div>

            {/* Headline with balance constraint */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white max-w-2xl text-balance">
              {currentMovie.title}
            </h1>

            {/* Synopsis */}
            <p className="text-sm md:text-base text-slate-300 leading-relaxed max-w-xl">
              {currentMovie.description}
            </p>

            {/* Cast & Director metadata */}
            <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 pt-1">
              <span>Director: <strong className="text-slate-200 font-medium">{currentMovie.director}</strong></span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>Starring: <strong className="text-slate-200 font-medium">{currentMovie.cast.slice(0, 3).join(', ')}</strong></span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 pt-4">
              <button
                onClick={() => onSelectMovie(currentMovie)}
                className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-lg shadow-amber-400/10 cursor-pointer"
              >
                <Ticket className="w-4 h-4" />
                <span>Book Tickets</span>
              </button>
              <button
                onClick={() => onSelectMovie(currentMovie)}
                className="px-5 py-3 text-sm font-medium text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors cursor-pointer"
              >
                View Showtimes
              </button>
            </div>

            {/* Carousel navigation dots */}
            <div className="flex items-center gap-2 pt-4">
              {movies.map((m, idx) => (
                <button
                  key={m._id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex ? 'w-8 bg-amber-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                  }`}
                  aria-label={`Slide to ${m.title}`}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Hero Poster Spotlight */}
          <div className="lg:col-span-5 hidden lg:flex justify-end">
            <div
              onClick={() => onSelectMovie(currentMovie)}
              className="group relative w-72 aspect-[3/4] rounded-2xl overflow-hidden border border-slate-700/60 shadow-2xl shadow-black/80 cursor-pointer transform hover:-translate-y-1 transition-all duration-300"
            >
              <img
                src={currentMovie.posterUrl}
                alt={currentMovie.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />
              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider block mb-1">
                  Now Showing
                </span>
                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors truncate">
                  {currentMovie.title}
                </h3>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      {movies.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + movies.length) % movies.length)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors hidden md:block"
            aria-label="Previous movie"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % movies.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/60 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-900 transition-colors hidden md:block"
            aria-label="Next movie"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}
    </div>
  );
};
