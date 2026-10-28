import React, { useState, useEffect, useRef } from 'react';
import { Show, Seat, api, getSocket } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import { ArrowLeft, Clock, ShieldCheck, Armchair } from 'lucide-react';

interface SeatSelectionViewProps {
  show: Show;
  onBack: () => void;
  onProceedToPayment: (selectedSeats: Seat[], totalAmount: number, discount: number) => void;
}

export const SeatSelectionView: React.FC<SeatSelectionViewProps> = ({
  show,
  onBack,
  onProceedToPayment,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeatNumbers, setSelectedSeatNumbers] = useState<string[]>([]);
  const [lockExpiresAt, setLockExpiresAt] = useState<string | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load seats & connect to Socket.io room
  useEffect(() => {
    async function fetchSeats() {
      try {
        setLoading(true);
        const res = await api.getSeats(show._id);
        if (res.success) {
          setSeats(res.seats);
        }
      } catch (err: any) {
        showToast(err.message || 'Failed to load auditorium seating', 'error');
      } finally {
        setLoading(false);
      }
    }

    fetchSeats();

    // Socket.io Real-time connection
    const socket = getSocket();
    socket.emit('join_show', show._id);

    const handleSeatStatusChanged = (payload: {
      action: 'lock' | 'unlock' | 'booked';
      seatNumbers: string[];
      userId?: string;
      lockExpiresAt?: string | null;
    }) => {
      setSeats((prev) =>
        prev.map((s) => {
          if (payload.seatNumbers.includes(s.seatNumber)) {
            if (payload.action === 'lock') {
              return {
                ...s,
                status: 'locked',
                lockedBy: payload.userId,
                lockExpiresAt: payload.lockExpiresAt,
              };
            } else if (payload.action === 'unlock') {
              return {
                ...s,
                status: 'available',
                lockedBy: null,
                lockExpiresAt: null,
              };
            } else if (payload.action === 'booked') {
              return {
                ...s,
                status: 'booked',
                lockedBy: null,
                lockExpiresAt: null,
              };
            }
          }
          return s;
        })
      );
    };

    socket.on('seat_status_changed', handleSeatStatusChanged);

    return () => {
      socket.emit('leave_show', show._id);
      socket.off('seat_status_changed', handleSeatStatusChanged);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [show._id]);

  // Countdown timer for locked seats
  useEffect(() => {
    if (!lockExpiresAt || selectedSeatNumbers.length === 0) {
      setRemainingSeconds(0);
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((new Date(lockExpiresAt).getTime() - Date.now()) / 1000));
      setRemainingSeconds(diff);

      if (diff <= 0) {
        // Expired
        setSelectedSeatNumbers([]);
        setLockExpiresAt(null);
        showToast('Seat reservation lock expired. Please re-select your seats.', 'info');
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lockExpiresAt, selectedSeatNumbers.length]);

  const handleSeatClick = async (seat: Seat) => {
    const isCurrentlySelected = selectedSeatNumbers.includes(seat.seatNumber);

    if (seat.status === 'booked') {
      showToast('This seat is already booked.', 'info');
      return;
    }

    // Locked by someone else
    if (seat.status === 'locked' && seat.lockedBy && seat.lockedBy !== user?._id && !isCurrentlySelected) {
      showToast('This seat is currently held by another moviegoer.', 'info');
      return;
    }

    if (isCurrentlySelected) {
      // Deselect
      const updated = selectedSeatNumbers.filter((n) => n !== seat.seatNumber);
      setSelectedSeatNumbers(updated);
      try {
        await api.unlockSeats(show._id, [seat.seatNumber]);
      } catch (err) {
        // ignore
      }
    } else {
      // Max 6 seats per booking
      if (selectedSeatNumbers.length >= 6) {
        showToast('You can select a maximum of 6 seats per booking.', 'info');
        return;
      }

      // Optimistically lock
      const targetSeats = [...selectedSeatNumbers, seat.seatNumber];
      setSelectedSeatNumbers(targetSeats);

      try {
        const res = await api.lockSeats(show._id, targetSeats);
        if (res.success) {
          setLockExpiresAt(res.lockExpiresAt);
        }
      } catch (err: any) {
        // Revert selection
        setSelectedSeatNumbers(selectedSeatNumbers);
        showToast(err.message || 'Unable to lock seat', 'error');
      }
    }
  };

  // Group seats by rows
  const rowLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
  const seatsByRow: Record<string, Seat[]> = {};
  rowLabels.forEach((r) => {
    seatsByRow[r] = seats.filter((s) => s.row === r).sort((a, b) => a.col - b.col);
  });

  const selectedSeatObjects = seats.filter((s) => selectedSeatNumbers.includes(s.seatNumber));
  const subtotal = selectedSeatObjects.reduce((acc, s) => acc + s.price, 0);
  const convenienceFee = selectedSeatObjects.length > 0 ? Number((selectedSeatObjects.length * 1.75).toFixed(2)) : 0;
  const totalAmount = Number((subtotal + convenienceFee).toFixed(2));

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Top Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              {show.movie?.title || 'Feature Movie'}
            </h2>
            <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{show.theatre?.name || 'Multiplex'}</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>{show.screenName} ({show.screenType})</span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="font-mono text-amber-300">
                {new Date(show.startTime).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Live Reservation Hold Timer */}
        {selectedSeatNumbers.length > 0 && remainingSeconds > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-400/10 border border-amber-400/30 rounded-lg text-amber-300 text-xs font-medium animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>Seats held for:</span>
            <span className="font-mono font-bold tabular-nums text-amber-400">
              {formatTimer(remainingSeconds)}
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
        {/* Left: Interactive Cinema Auditorium */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Curved Cinema Screen */}
          <div className="w-full max-w-xl flex flex-col items-center mb-10">
            <div className="relative w-full h-8 flex items-center justify-center">
              {/* Curved SVG screen */}
              <svg className="w-full h-8" viewBox="0 0 500 40" fill="none">
                <path
                  d="M 20 30 Q 250 5 480 30"
                  stroke="#38bdf8"
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="filter drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]"
                />
              </svg>
            </div>
            <span className="text-[11px] font-semibold tracking-widest text-slate-400 uppercase">
              All eyes this way · Cinema Screen
            </span>
          </div>

          {/* Seating Grid */}
          {loading ? (
            <div className="py-24 text-center text-xs text-slate-400">
              Initializing real-time auditorium seating...
            </div>
          ) : (
            <div className="w-full flex flex-col items-center gap-6">
              {rowLabels.map((rowLetter, rIndex) => {
                const rowSeats = seatsByRow[rowLetter] || [];
                const tierName = rIndex < 2 ? 'VIP ($' + show.pricing.vip + ')' : rIndex < 4 ? 'Gold ($' + show.pricing.gold + ')' : 'Silver ($' + show.pricing.silver + ')';

                return (
                  <div key={rowLetter} className="flex flex-col items-center gap-1.5">
                    {/* Tier header divider when switching tiers */}
                    {(rIndex === 0 || rIndex === 2 || rIndex === 4) && (
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        {tierName}
                      </span>
                    )}

                    <div className="flex items-center gap-3">
                      {/* Row letter */}
                      <span className="w-5 text-xs font-mono font-bold text-slate-500 text-center">
                        {rowLetter}
                      </span>

                      {/* Seats in this row */}
                      <div className="flex items-center gap-2">
                        {rowSeats.map((seat, cIndex) => {
                          const isSelected = selectedSeatNumbers.includes(seat.seatNumber);
                          const isLockedByOther = Boolean(
                            seat.status === 'locked' &&
                            seat.lockedBy &&
                            seat.lockedBy !== user?._id &&
                            !isSelected
                          );
                          const isBooked = seat.status === 'booked';

                          // Aisle gap between col 4 and 5
                          const isAisle = cIndex === 4;

                          return (
                            <React.Fragment key={seat._id}>
                              {isAisle && <div className="w-4 sm:w-6" />}
                              <button
                                onClick={() => handleSeatClick(seat)}
                                disabled={isBooked || isLockedByOther}
                                title={`Seat ${seat.seatNumber} (${seat.tier.toUpperCase()}) - $${seat.price}`}
                                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center text-[11px] font-mono font-medium transition-all duration-150 relative cursor-pointer ${
                                  isSelected
                                    ? 'bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-400/30 ring-2 ring-amber-300'
                                    : isBooked
                                    ? 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
                                    : isLockedByOther
                                    ? 'bg-orange-950/60 border border-orange-500/40 text-orange-400 cursor-not-allowed'
                                    : 'bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white'
                                }`}
                              >
                                {seat.col}
                              </button>
                            </React.Fragment>
                          );
                        })}
                      </div>

                      {/* Row letter right */}
                      <span className="w-5 text-xs font-mono font-bold text-slate-500 text-center">
                        {rowLetter}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Seat Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 py-4 px-6 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-800 border border-slate-700" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-400" />
              <span className="text-amber-300 font-medium">Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-950/80 border border-orange-500/50" />
              <span className="text-orange-400">Locked by others</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-slate-900 border border-slate-800 opacity-50" />
              <span className="text-slate-500">Booked</span>
            </div>
          </div>
        </div>

        {/* Right: Order Summary Panel */}
        <div className="lg:col-span-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sticky top-24 space-y-6">
            <div className="flex items-start gap-3 pb-4 border-b border-slate-800">
              <Armchair className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-base font-bold text-white">Booking Summary</h3>
                <p className="text-xs text-slate-400">Real-time seat reservation</p>
              </div>
            </div>

            {/* Show Details */}
            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="font-semibold text-white text-sm">{show.movie?.title}</div>
              <div>{show.theatre?.name}</div>
              <div className="text-slate-400">
                {show.screenName} · {new Date(show.startTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                <span className="font-mono text-amber-300">
                  {new Date(show.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Selected Seats List */}
            <div className="pt-2">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Selected Seats ({selectedSeatNumbers.length}/6)
              </div>
              {selectedSeatObjects.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-2">No seats selected yet. Click any available seat on the grid.</p>
              ) : (
                <div className="space-y-2">
                  {selectedSeatObjects.map((s) => (
                    <div
                      key={s.seatNumber}
                      className="flex items-center justify-between text-xs py-1 px-2.5 bg-slate-950/60 rounded-lg border border-slate-800"
                    >
                      <span className="font-mono font-bold text-white">
                        Seat {s.seatNumber} <span className="text-[10px] text-amber-300/80 uppercase font-sans">({s.tier})</span>
                      </span>
                      <span className="font-mono text-slate-300 tabular-nums">${s.price.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            {selectedSeatObjects.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Tickets Subtotal</span>
                  <span className="font-mono tabular-nums text-slate-200">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Convenience Fee</span>
                  <span className="font-mono tabular-nums text-slate-200">${convenienceFee.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-sm font-bold text-white">
                  <span>Total Amount</span>
                  <span className="font-mono tabular-nums text-amber-400 text-base">
                    ${totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            {/* Checkout CTA */}
            <button
              onClick={() => {
                if (selectedSeatObjects.length === 0) {
                  showToast('Please select at least one seat to proceed.', 'info');
                  return;
                }
                onProceedToPayment(selectedSeatObjects, totalAmount, 0);
              }}
              disabled={selectedSeatObjects.length === 0}
              className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                selectedSeatObjects.length > 0
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              Proceed to Checkout
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Encrypted checkout &amp; instant e-ticket generation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
