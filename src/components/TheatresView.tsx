import React, { useState, useEffect } from 'react';
import { Theatre, Show, Movie, api } from '../api/client.ts';
import { MapPin, Film, Calendar, Clock, MonitorPlay } from 'lucide-react';

interface TheatresViewProps {
  onSelectShow: (show: Show) => void;
  onSelectMovie: (movie: Movie) => void;
}

export const TheatresView: React.FC<TheatresViewProps> = ({ onSelectShow, onSelectMovie }) => {
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [tRes, sRes] = await Promise.all([api.getTheatres(), api.getShows()]);
        if (tRes.success) setTheatres(tRes.theatres);
        if (sRes.success) setShows(sRes.shows);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="pb-8 border-b border-slate-800">
        <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
          Multiplex Partners
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Our Cinema Locations &amp; Screens
        </h2>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-slate-400">Loading cinema locations...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
          {theatres.map((th) => {
            const theatreShows = shows.filter((s) => s.theatreId === th._id);

            return (
              <div
                key={th._id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 space-y-6 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-white">{th.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>{th.location}, {th.city}</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-amber-300">
                      {th.screens.length} Screens
                    </span>
                  </div>

                  {/* Screens badges */}
                  <div className="flex flex-wrap gap-2 pt-1">
                    {th.screens.map((sc) => (
                      <span
                        key={sc.screenNumber}
                        className="text-xs px-2.5 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 flex items-center gap-1.5"
                      >
                        <MonitorPlay className="w-3 h-3 text-amber-400" />
                        <span>{sc.name} ({sc.type})</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Today's Screenings at this Cinema */}
                <div className="pt-4 border-t border-slate-800/80 space-y-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Available Showtimes Today
                  </span>

                  {theatreShows.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No showtimes currently scheduled.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2.5">
                      {theatreShows.map((s) => {
                        const timeStr = new Date(s.startTime).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        });
                        return (
                          <button
                            key={s._id}
                            onClick={() => onSelectShow(s)}
                            className="px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-amber-400 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer text-left"
                          >
                            <span className="font-semibold text-white">{s.movie?.title}</span>
                            <span className="font-mono text-amber-300 font-bold">{timeStr}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
