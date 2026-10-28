import React, { useState, useEffect } from 'react';
import {
  Movie,
  Theatre,
  Show,
  Booking,
  AdminStats,
  api,
} from '../api/client.ts';
import { useToast } from '../context/ToastContext.tsx';
import {
  Film,
  Building,
  Calendar,
  DollarSign,
  Ticket,
  Plus,
  Trash2,
  Users,
  Search,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'overview' | 'movies' | 'theatres' | 'shows' | 'bookings'>('overview');

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theatres, setTheatres] = useState<Theatre[]>([]);
  const [shows, setShows] = useState<Show[]>([]);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showAddMovieModal, setShowAddMovieModal] = useState(false);
  const [showAddTheatreModal, setShowAddTheatreModal] = useState(false);
  const [showAddShowModal, setShowAddShowModal] = useState(false);

  // New Movie Form
  const [movieForm, setMovieForm] = useState({
    title: '',
    description: '',
    genre: 'Sci-Fi, Action',
    language: 'English',
    duration: 120,
    posterUrl: '/src/assets/images/movie_poster_odyssey_1793122537758.jpg',
    releaseDate: '2026-11-01',
    rating: 4.8,
    certification: 'PG-13',
    director: '',
    cast: '',
  });

  // New Theatre Form
  const [theatreForm, setTheatreForm] = useState({
    name: '',
    location: '',
    city: 'New York',
  });

  // New Show Form
  const [showForm, setShowForm] = useState({
    movieId: '',
    theatreId: '',
    screenNumber: 1,
    screenName: 'Screen 1 - IMAX',
    screenType: 'IMAX' as 'IMAX' | 'Dolby Atmos' | '4DX' | 'Standard',
    startTime: '',
    pricing: {
      vip: 20,
      gold: 15,
      silver: 10,
    },
  });

  const [bookingSearch, setBookingSearch] = useState('');

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [statsRes, moviesRes, theatresRes, showsRes, bookingsRes] = await Promise.all([
        api.getAdminStats(),
        api.getMovies(),
        api.getTheatres(),
        api.getShows(),
        api.getAllBookings(),
      ]);

      if (statsRes.success) setStats(statsRes.stats);
      if (moviesRes.success) setMovies(moviesRes.movies);
      if (theatresRes.success) setTheatres(theatresRes.theatres);
      if (showsRes.success) setShows(showsRes.shows);
      if (bookingsRes.success) setAllBookings(bookingsRes.bookings);

      // Pre-select defaults for show form
      if (moviesRes.movies.length > 0 && !showForm.movieId) {
        setShowForm((prev) => ({ ...prev, movieId: moviesRes.movies[0]._id }));
      }
      if (theatresRes.theatres.length > 0 && !showForm.theatreId) {
        setShowForm((prev) => ({ ...prev, theatreId: theatresRes.theatres[0]._id }));
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load administration data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Handlers
  const handleCreateMovie = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createMovie({
        ...movieForm,
        genre: movieForm.genre.split(',').map((g) => g.trim()),
        cast: movieForm.cast.split(',').map((c) => c.trim()),
      });
      if (res.success) {
        showToast('Movie added successfully!', 'success');
        setShowAddMovieModal(false);
        loadAllData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add movie', 'error');
    }
  };

  const handleDeleteMovie = async (id: string) => {
    if (!window.confirm('Delete this movie and all associated shows and seats?')) return;
    try {
      await api.deleteMovie(id);
      showToast('Movie deleted', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const handleCreateTheatre = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createTheatre(theatreForm);
      if (res.success) {
        showToast('Cinema theatre added!', 'success');
        setShowAddTheatreModal(false);
        loadAllData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to add cinema', 'error');
    }
  };

  const handleDeleteTheatre = async (id: string) => {
    if (!window.confirm('Delete this cinema theatre and all scheduled shows?')) return;
    try {
      await api.deleteTheatre(id);
      showToast('Cinema removed', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const handleCreateShow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createShow(showForm);
      if (res.success) {
        showToast('Show scheduled & 48 seats generated!', 'success');
        setShowAddShowModal(false);
        loadAllData();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to schedule show', 'error');
    }
  };

  const handleDeleteShow = async (id: string) => {
    if (!window.confirm('Remove this scheduled showtime?')) return;
    try {
      await api.deleteShow(id);
      showToast('Show deleted', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const handleAdminCancelBooking = async (id: string) => {
    if (!window.confirm('Cancel this customer booking and release seats?')) return;
    try {
      await api.cancelBooking(id);
      showToast('Booking cancelled by Admin', 'success');
      loadAllData();
    } catch (err: any) {
      showToast(err.message || 'Cancellation failed', 'error');
    }
  };

  const filteredBookings = allBookings.filter(
    (b) =>
      b.movieTitle.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      b.ticketCode.toLowerCase().includes(bookingSearch.toLowerCase()) ||
      (b.userName && b.userName.toLowerCase().includes(bookingSearch.toLowerCase())) ||
      (b.userEmail && b.userEmail.toLowerCase().includes(bookingSearch.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      {/* Admin Suite Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
            Cinema Management Suite
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Administration Control Center
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'overview' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('movies')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'movies' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Movies ({movies.length})
          </button>
          <button
            onClick={() => setActiveTab('theatres')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'theatres' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cinemas ({theatres.length})
          </button>
          <button
            onClick={() => setActiveTab('shows')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'shows' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Showtimes ({shows.length})
          </button>
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'bookings' ? 'bg-amber-400 text-slate-950 font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Bookings ({allBookings.length})
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-8 pt-8">
          {/* 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Box Office</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                ${stats.totalRevenue.toFixed(2)}
              </div>
              <p className="text-[11px] text-slate-500">Gross ticket revenue</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Total Bookings</span>
                <Ticket className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {stats.totalBookings}
              </div>
              <p className="text-[11px] text-slate-500">Tickets issued</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Active Features</span>
                <Film className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {stats.totalMovies}
              </div>
              <p className="text-[11px] text-slate-500">Movies catalog</p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span>Partner Cinemas</span>
                <Building className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl font-bold font-mono text-white tabular-nums">
                {stats.totalTheatres}
              </div>
              <p className="text-[11px] text-slate-500">Theatres &amp; auditoriums</p>
            </div>
          </div>

          {/* Quick Recent Activity */}
          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Recent Transactions
            </h3>
            {stats.recentBookings.length === 0 ? (
              <p className="text-xs text-slate-500">No recent transactions.</p>
            ) : (
              <div className="divide-y divide-slate-800 text-xs">
                {stats.recentBookings.map((b) => (
                  <div key={b._id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-white">{b.movieTitle}</p>
                      <p className="text-slate-400">
                        {b.userName || 'Customer'} · Code: <span className="font-mono">{b.ticketCode}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-emerald-400 tabular-nums">
                        +${b.totalAmount.toFixed(2)}
                      </span>
                      <p className="text-[10px] text-slate-500 uppercase">{b.bookingStatus}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MOVIES TAB */}
      {activeTab === 'movies' && (
        <div className="pt-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Movie Catalog Management</h3>
            <button
              onClick={() => setShowAddMovieModal(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add New Movie
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {movies.map((m) => (
              <div
                key={m._id}
                className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex gap-4 items-start"
              >
                <img
                  src={m.posterUrl}
                  alt={m.title}
                  className="w-20 aspect-[3/4] object-cover rounded-lg bg-slate-950 shrink-0 border border-slate-800"
                />
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-bold text-white truncate">{m.title}</h4>
                  <div className="text-xs text-slate-400">
                    {m.genre.join(', ')} · <span className="font-mono">{m.duration}m</span>
                  </div>
                  <div className="text-xs text-slate-500 line-clamp-2">{m.description}</div>
                  <div className="pt-2 flex justify-end">
                    <button
                      onClick={() => handleDeleteMovie(m._id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
                      title="Delete movie"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* THEATRES TAB */}
      {activeTab === 'theatres' && (
        <div className="pt-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Cinema Theatres</h3>
            <button
              onClick={() => setShowAddTheatreModal(true)}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Theatre
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {theatres.map((th) => (
              <div key={th._id} className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-base font-bold text-white">{th.name}</h4>
                    <p className="text-xs text-slate-400">{th.location}, {th.city}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteTheatre(th._id)}
                    className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-xs font-semibold text-slate-400 block mb-2">Auditorium Screens:</span>
                  <div className="flex flex-wrap gap-2">
                    {th.screens.map((sc) => (
                      <span
                        key={sc.screenNumber}
                        className="text-xs px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-slate-300"
                      >
                        {sc.name} ({sc.type}) · {sc.totalSeats} seats
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SHOWTIMES TAB */}
      {activeTab === 'shows' && (
        <div className="pt-8 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-white">Scheduled Showtimes</h3>
            <button
              onClick={() => {
                // Set default ISO date for now + 2 hours
                const d = new Date();
                d.setHours(d.getHours() + 2, 0, 0, 0);
                setShowForm((prev) => ({ ...prev, startTime: d.toISOString().slice(0, 16) }));
                setShowAddShowModal(true);
              }}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Schedule Show
            </button>
          </div>

          <div className="divide-y divide-slate-800 bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            {shows.map((s) => {
              const movie = movies.find((m) => m._id === s.movieId);
              const theatre = theatres.find((t) => t._id === s.theatreId);
              const showDate = new Date(s.startTime).toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              });
              const showTime = new Date(s.startTime).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div key={s._id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">{movie?.title || 'Movie'}</h4>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{theatre?.name} ({s.screenName})</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span>{showDate}</span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="font-mono text-amber-300 font-bold">{showTime}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-xs text-slate-300 font-mono">
                      VIP: ${s.pricing.vip} · Gold: ${s.pricing.gold} · Silver: ${s.pricing.silver}
                    </div>
                    <button
                      onClick={() => handleDeleteShow(s._id)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded transition-colors"
                      title="Remove show"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ALL BOOKINGS TAB */}
      {activeTab === 'bookings' && (
        <div className="pt-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h3 className="text-lg font-bold text-white">All Platform Bookings</h3>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={bookingSearch}
                onChange={(e) => setBookingSearch(e.target.value)}
                placeholder="Search ticket code, user, film..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="overflow-x-auto bg-slate-900/60 border border-slate-800 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Ticket Code</th>
                  <th className="py-3 px-4">Movie</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Seats</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {filteredBookings.map((b) => (
                  <tr key={b._id} className="hover:bg-slate-850/50">
                    <td className="py-3 px-4 font-mono font-bold text-amber-300">{b.ticketCode}</td>
                    <td className="py-3 px-4 font-semibold text-white">{b.movieTitle}</td>
                    <td className="py-3 px-4">
                      {b.userName || 'Alex Rivera'}<br />
                      <span className="text-[11px] text-slate-400">{b.userEmail}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">{b.selectedSeats.map((s) => s.seatNumber).join(', ')}</td>
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-emerald-400">
                      ${b.totalAmount.toFixed(2)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          b.bookingStatus === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {b.bookingStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {b.bookingStatus === 'confirmed' && (
                        <button
                          onClick={() => handleAdminCancelBooking(b._id)}
                          className="px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ADD MOVIE MODAL */}
      {showAddMovieModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Add Feature Movie</h3>
            <form onSubmit={handleCreateMovie} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Movie Title</label>
                <input
                  type="text"
                  required
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Synopsis</label>
                <textarea
                  required
                  rows={2}
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Duration (mins)</label>
                  <input
                    type="number"
                    value={movieForm.duration}
                    onChange={(e) => setMovieForm({ ...movieForm, duration: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Genre (comma-separated)</label>
                  <input
                    type="text"
                    value={movieForm.genre}
                    onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Director</label>
                  <input
                    type="text"
                    value={movieForm.director}
                    onChange={(e) => setMovieForm({ ...movieForm, director: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Certification</label>
                  <input
                    type="text"
                    value={movieForm.certification}
                    onChange={(e) => setMovieForm({ ...movieForm, certification: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Poster Image URL / Path</label>
                <input
                  type="text"
                  value={movieForm.posterUrl}
                  onChange={(e) => setMovieForm({ ...movieForm, posterUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddMovieModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-lg"
                >
                  Save Movie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD THEATRE MODAL */}
      {showAddTheatreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Add Cinema Theatre</h3>
            <form onSubmit={handleCreateTheatre} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Theatre Name</label>
                <input
                  type="text"
                  required
                  value={theatreForm.name}
                  onChange={(e) => setTheatreForm({ ...theatreForm, name: e.target.value })}
                  placeholder="e.g. IMovies City Centre"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  value={theatreForm.location}
                  onChange={(e) => setTheatreForm({ ...theatreForm, location: e.target.value })}
                  placeholder="e.g. 700 Fifth Avenue"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">City</label>
                <input
                  type="text"
                  required
                  value={theatreForm.city}
                  onChange={(e) => setTheatreForm({ ...theatreForm, city: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddTheatreModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-lg"
                >
                  Save Cinema
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SCHEDULE SHOW MODAL */}
      {showAddShowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Schedule Movie Showtime</h3>
            <form onSubmit={handleCreateShow} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Select Movie</label>
                <select
                  value={showForm.movieId}
                  onChange={(e) => setShowForm({ ...showForm, movieId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  {movies.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.title} ({m.duration}m)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Select Cinema</label>
                <select
                  value={showForm.theatreId}
                  onChange={(e) => setShowForm({ ...showForm, theatreId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                >
                  {theatres.map((t) => (
                    <option key={t._id} value={t._id}>
                      {t.name} - {t.city}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Screen Format</label>
                  <select
                    value={showForm.screenType}
                    onChange={(e) =>
                      setShowForm({
                        ...showForm,
                        screenType: e.target.value as any,
                        screenName: `Screen 1 - ${e.target.value}`,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="IMAX">IMAX</option>
                    <option value="Dolby Atmos">Dolby Atmos</option>
                    <option value="4DX">4DX</option>
                    <option value="Standard">Standard</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Start Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={showForm.startTime}
                    onChange={(e) => setShowForm({ ...showForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>
              <div className="pt-2">
                <label className="text-slate-400 block mb-1">Pricing Tiers ($)</label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">VIP</span>
                    <input
                      type="number"
                      value={showForm.pricing.vip}
                      onChange={(e) =>
                        setShowForm({
                          ...showForm,
                          pricing: { ...showForm.pricing, vip: Number(e.target.value) },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Gold</span>
                    <input
                      type="number"
                      value={showForm.pricing.gold}
                      onChange={(e) =>
                        setShowForm({
                          ...showForm,
                          pricing: { ...showForm.pricing, gold: Number(e.target.value) },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase">Silver</span>
                    <input
                      type="number"
                      value={showForm.pricing.silver}
                      onChange={(e) =>
                        setShowForm({
                          ...showForm,
                          pricing: { ...showForm.pricing, silver: Number(e.target.value) },
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddShowModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-400 text-slate-950 font-bold rounded-lg"
                >
                  Generate Show &amp; Seats
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
