import React, { useState, useEffect } from 'react';
import { Movie, Show, api } from '../api/client.ts';
import { X, Star, Clock, Calendar, MapPin, Film, Sparkles } from 'lucide-react';

interface MovieDetailsModalProps {
  movie: Movie;
  onClose: () => void;
  onSelectShow: (show: Show) => void;
}

export const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
  movie,
  onClose,
  onSelectShow,
}) => {
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDateOffset, setSelectedDateOffset] = useState<number>(0);

  useEffect(() => {
    async function loadShows() {
      try {
        setLoading(true);
        const res = await api.getShows({ movieId: movie._id });
        if (res.success) {
          setShows(res.shows);
        }
      } catch (err) {
        console.error('Failed to load shows', err);
      } finally {
        setLoading(false);
      }
    }
    loadShows();
  }, [movie._id]);

  // Format date buttons
  const dateOptions = [0, 1, 2].map((offset) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return {
      offset,
      dayName: offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateFormatted: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isoDate: d.toISOString().split('T')[0],
    };
  });

  const activeDate = dateOptions[selectedDateOffset].isoDate;

  // Filter shows by selected date
  const filteredShows = shows.filter((s) => s.startTime.startsWith(activeDate));

  // Group shows by Theatre
  const showsByTheatre = filteredShows.reduce<Record<string, { theatreName: string; location: string; shows: Show[] }>>(
    (acc, show) => {
      const thId = show.theatreId;
      const thName = show.theatre?.name || 'IMovies Multiplex';
      const thLoc = show.theatre?.location || 'Downtown';
      if (!acc[thId]) {
        acc[thId] = { theatreName: thName, location: thLoc, shows: [] };
      }
      acc[thId].shows.push(show);
      return acc;
    },
    {}
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-950/60 border border-slate-700/60 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Backdrop Header */}
        <div className="relative h-64 sm:h-72 w-full bg-slate-950 overflow-hidden">
          <img
            src={movie.backdropUrl || movie.posterUrl}
            alt={movie.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-top opacity-35 filter blur-[1px]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
          
          <div className="absolute bottom-6 left-6 right-6 flex items-end gap-6">
            <div className="w-28 sm:w-36 aspect-[3/4] rounded-xl overflow-hidden border-2 border-slate-700/80 shadow-xl shrink-0 hidden sm:block bg-slate-950">
              <img
                src={movie.posterUrl}
                alt={movie.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span className="font-mono tabular-nums">{movie.rating.toFixed(1)}</span> / 5.0
                </span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-slate-300">{movie.certification}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="font-mono tabular-nums">{movie.duration}</span> min
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {movie.title}
              </h2>
              <div className="text-xs text-slate-400">
                <span>{movie.genre.join(', ')}</span>
                <span className="mx-2 text-slate-600">·</span>
                <span>Language: <strong className="text-slate-200">{movie.language}</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Synopsis & Credits */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Synopsis
            </h4>
            <p className="text-sm text-slate-300 leading-relaxed">
              {movie.description}
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800">
              <span>Director: <strong className="text-slate-200">{movie.director}</strong></span>
              <span>Cast: <strong className="text-slate-200">{movie.cast.join(', ')}</strong></span>
              <span>Release Date: <strong className="text-slate-200">{movie.releaseDate}</strong></span>
            </div>
          </div>

          {/* Date Selector Segmented Bar */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-white uppercase tracking-wider mb-3">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Select Date</span>
            </div>

            <div className="flex items-center gap-2">
              {dateOptions.map((opt) => (
                <button
                  key={opt.offset}
                  onClick={() => setSelectedDateOffset(opt.offset)}
                  className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors flex flex-col items-center gap-0.5 ${
                    selectedDateOffset === opt.offset
                      ? 'bg-amber-400 text-slate-950 font-semibold shadow-md'
                      : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span>{opt.dayName}</span>
                  <span className="text-[11px] opacity-80">{opt.dateFormatted}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Showtimes by Cinema */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Available Cinemas &amp; Showtimes
            </h4>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400">Loading cinema schedules...</div>
            ) : Object.keys(showsByTheatre).length === 0 ? (
              <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 p-6">
                <Film className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No shows scheduled for {dateOptions[selectedDateOffset].dayName}.</p>
                <p className="text-[11px] text-slate-500 mt-1">Please check another date or cinema.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(showsByTheatre).map(([theatreId, { theatreName, location, shows: tShows }]) => (
                  <div
                    key={theatreId}
                    className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <h5 className="text-sm font-semibold text-white">{theatreName}</h5>
                        <span className="text-xs text-slate-500 hidden sm:inline">({location})</span>
                      </div>
                    </div>

                    {/* Showtime Buttons */}
                    <div className="flex flex-wrap items-center gap-3">
                      {tShows.map((s) => {
                        const timeStr = new Date(s.startTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        return (
                          <button
                            key={s._id}
                            onClick={() => onSelectShow(s)}
                            className="group px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-400/80 hover:bg-slate-850 transition-all text-left flex flex-col gap-0.5 cursor-pointer"
                          >
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-white group-hover:text-amber-400 font-mono">
                                {timeStr}
                              </span>
                              <span className="text-[10px] text-amber-300/90 font-medium">
                                {s.screenType}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {s.screenName} · <span className="font-mono tabular-nums text-slate-300">from ${s.pricing.silver}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
