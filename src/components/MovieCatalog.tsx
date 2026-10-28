import React, { useState } from 'react';
import { Movie } from '../api/client.ts';
import { Search, Star, Clock, Film } from 'lucide-react';

interface MovieCatalogProps {
  movies: Movie[];
  onSelectMovie: (movie: Movie) => void;
}

const GENRES = ['All', 'Sci-Fi', 'Action', 'Thriller', 'Adventure', 'Fantasy', 'Crime'];
const LANGUAGES = ['All', 'English', 'Spanish', 'Hindi', 'Japanese'];

export const MovieCatalog: React.FC<MovieCatalogProps> = ({ movies, onSelectMovie }) => {
  const [search, setSearch] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [selectedLanguage, setSelectedLanguage] = useState('All');

  const filteredMovies = movies.filter((movie) => {
    const matchesSearch =
      !search ||
      movie.title.toLowerCase().includes(search.toLowerCase()) ||
      movie.description.toLowerCase().includes(search.toLowerCase()) ||
      movie.director.toLowerCase().includes(search.toLowerCase()) ||
      movie.cast.some((c) => c.toLowerCase().includes(search.toLowerCase()));

    const matchesGenre =
      selectedGenre === 'All' ||
      movie.genre.some((g) => g.toLowerCase() === selectedGenre.toLowerCase());

    const matchesLang =
      selectedLanguage === 'All' ||
      movie.language.toLowerCase() === selectedLanguage.toLowerCase();

    return matchesSearch && matchesGenre && matchesLang;
  });

  return (
    <section className="py-12 px-6 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
            Now in Theatres
          </span>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
            Explore Current Features
          </h2>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, actor, director..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 focus:border-amber-400 focus:outline-none rounded-lg text-sm text-slate-200 placeholder-slate-500 transition-colors"
          />
        </div>
      </div>

      {/* Filter Bar: Interactive Segmented Controls & Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-4 py-6">
        {/* Genre Segmented Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800/80 rounded-xl overflow-x-auto max-w-full">
          {GENRES.map((genre) => (
            <button
              key={genre}
              onClick={() => setSelectedGenre(genre)}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                selectedGenre === genre
                  ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {genre}
            </button>
          ))}
        </div>

        {/* Language Filter */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Language:</span>
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:border-amber-400 focus:outline-none text-xs"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Movie Grid */}
      {filteredMovies.length === 0 ? (
        <div className="py-20 text-center">
          <Film className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-medium text-slate-300">No movies found</h3>
          <p className="text-xs text-slate-500 mt-1">Try clearing your filters or search keywords.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedGenre('All');
              setSelectedLanguage('All');
            }}
            className="mt-4 px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMovies.map((movie) => (
            <div
              key={movie._id}
              onClick={() => onSelectMovie(movie)}
              className="group bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden hover:border-slate-700 transition-all duration-300 flex flex-col cursor-pointer"
            >
              {/* Poster Container */}
              <div className="relative aspect-[3/4] w-full bg-slate-950 overflow-hidden">
                <img
                  src={movie.posterUrl}
                  alt={movie.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    // Fallback container if image fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
                {/* Fallback container behind img */}
                <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center -z-10">
                  <Film className="w-10 h-10 text-amber-400/40 mb-2" />
                  <span className="text-sm font-semibold text-slate-300">{movie.title}</span>
                </div>

                {/* Scrim Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-70 group-hover:opacity-40 transition-opacity" />

                {/* Rating badge */}
                <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-md px-2 py-1 flex items-center gap-1 text-xs font-semibold text-white">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-mono tabular-nums">{movie.rating.toFixed(1)}</span>
                </div>
              </div>

              {/* Card Details */}
              <div className="p-4 flex flex-col flex-1 justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-white group-hover:text-amber-400 transition-colors truncate">
                    {movie.title}
                  </h3>
                  
                  {/* Clean unboxed metadata */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <span>{movie.genre.slice(0, 2).join(', ')}</span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="font-mono tabular-nums">{movie.duration}m</span>
                    </span>
                    <span aria-hidden="true" className="text-slate-600">·</span>
                    <span>{movie.certification}</span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                    {movie.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Lang: <span className="text-slate-200 font-medium">{movie.language}</span>
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectMovie(movie);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors"
                  >
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
