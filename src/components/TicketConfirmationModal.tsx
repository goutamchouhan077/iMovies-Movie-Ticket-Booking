import React from 'react';
import { Booking } from '../api/client.ts';
import { X, Printer, CheckCircle, Ticket, Film, Calendar, MapPin } from 'lucide-react';

interface TicketConfirmationModalProps {
  booking: Booking;
  onClose: () => void;
  onViewMyBookings: () => void;
}

export const TicketConfirmationModal: React.FC<TicketConfirmationModalProps> = ({
  booking,
  onClose,
  onViewMyBookings,
}) => {
  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(booking.showTime).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const formattedTime = new Date(booking.showTime).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Success Header Banner */}
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-transparent p-6 text-center border-b border-slate-800">
          <div className="w-12 h-12 bg-amber-400 text-slate-950 rounded-full flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-400/20">
            <CheckCircle className="w-6 h-6" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
            Booking Confirmed
          </span>
          <h3 className="text-xl font-extrabold text-white">Your E-Ticket is Ready</h3>
        </div>

        {/* Boarding-Pass Ticket Body */}
        <div className="p-6 space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 relative overflow-hidden">
            {/* Ticket Notches */}
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900 rounded-full border border-slate-800" />
            <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-900 rounded-full border border-slate-800" />

            {/* Top Half: Movie & Cinema */}
            <div className="space-y-3 pb-4 border-b border-dashed border-slate-800">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-lg font-bold text-white tracking-tight">
                    {booking.movieTitle}
                  </h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span>{booking.theatreName}</span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 ml-5">
                    {booking.screenName}
                  </div>
                </div>
                <Ticket className="w-6 h-6 text-amber-400/60" />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                <div>
                  <span className="text-slate-500 block">Date &amp; Time</span>
                  <strong className="text-slate-200">{formattedDate}</strong>
                  <div className="text-amber-400 font-mono font-bold">{formattedTime}</div>
                </div>
                <div>
                  <span className="text-slate-500 block">Seats</span>
                  <div className="text-white font-mono font-bold text-sm">
                    {booking.selectedSeats.map((s) => s.seatNumber).join(', ')}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {booking.selectedSeats.length} {booking.selectedSeats.length > 1 ? 'tickets' : 'ticket'}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Half: QR Code & Code */}
            <div className="pt-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                  Ticket Code
                </span>
                <span className="font-mono text-base font-bold text-white tracking-wider">
                  {booking.ticketCode}
                </span>
                <div className="text-[11px] text-slate-400 mt-1">
                  Total Paid: <strong className="text-emerald-400 font-mono tabular-nums">${booking.totalAmount.toFixed(2)}</strong>
                </div>
              </div>

              {/* Scannable QR Code Visual */}
              <div className="w-16 h-16 bg-white p-1 rounded-lg flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 24 24" fill="black">
                  <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm8 0h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm4-4h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v2h-2v-2zm2-6h2v2h-2v-2zM5 5h2v2H5V5zm12 0h2v2h-2V5zM5 17h2v2H5v-2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Ticket</span>
            </button>
            <button
              onClick={onViewMyBookings}
              className="flex-1 py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>My Bookings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
