import React, { useState, useEffect } from 'react';
import { Booking, api } from '../api/client.ts';
import { useToast } from '../context/ToastContext.tsx';
import { TicketConfirmationModal } from './TicketConfirmationModal.tsx';
import { Ticket, Calendar, Clock, MapPin, AlertCircle, Ban } from 'lucide-react';

export const MyBookingsView: React.FC = () => {
  const { showToast } = useToast();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Booking | null>(null);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.getMyBookings();
      if (res.success) {
        setBookings(res.bookings);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch bookings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this booking? A refund will be initiated and seats will be released.')) {
      return;
    }

    try {
      setCancellingId(id);
      const res = await api.cancelBooking(id);
      if (res.success) {
        showToast('Booking cancelled and seats released successfully.', 'success');
        fetchBookings();
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to cancel booking', 'error');
    } finally {
      setCancellingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
        <div>
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block mb-1">
            Customer Portal
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            My Movie Bookings
          </h2>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs text-slate-400">Loading your tickets...</div>
      ) : bookings.length === 0 ? (
        <div className="py-24 text-center bg-slate-900/40 border border-slate-800 rounded-2xl p-8 mt-8">
          <Ticket className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No bookings found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            You haven't reserved any movie tickets yet. Browse our current features and book your seat!
          </p>
        </div>
      ) : (
        <div className="space-y-4 mt-8">
          {bookings.map((booking) => {
            const isConfirmed = booking.bookingStatus === 'confirmed';
            const showDate = new Date(booking.showTime).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            });
            const showTime = new Date(booking.showTime).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={booking._id}
                className={`p-5 rounded-2xl border transition-all ${
                  isConfirmed
                    ? 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/40 border-slate-800/60 opacity-75'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Left: Movie & Info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{booking.movieTitle}</h4>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isConfirmed
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {booking.bookingStatus}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        {booking.theatreName} ({booking.screenName})
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {showDate}
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="font-mono text-amber-300">{showTime}</span>
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 pt-1">
                      Seats:{' '}
                      <strong className="text-slate-200 font-mono">
                        {booking.selectedSeats.map((s) => s.seatNumber).join(', ')}
                      </strong>{' '}
                      · Total Paid:{' '}
                      <strong className="text-emerald-400 font-mono tabular-nums">
                        ${booking.totalAmount.toFixed(2)}
                      </strong>{' '}
                      · Code:{' '}
                      <span className="font-mono text-slate-300">{booking.ticketCode}</span>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-3 self-end md:self-center">
                    <button
                      onClick={() => setSelectedTicket(booking)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-xl transition-colors cursor-pointer"
                    >
                      View Ticket
                    </button>

                    {isConfirmed && (
                      <button
                        onClick={() => handleCancelBooking(booking._id)}
                        disabled={cancellingId === booking._id}
                        className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>{cancellingId === booking._id ? 'Cancelling...' : 'Cancel Booking'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <TicketConfirmationModal
          booking={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onViewMyBookings={() => setSelectedTicket(null)}
        />
      )}
    </div>
  );
};
