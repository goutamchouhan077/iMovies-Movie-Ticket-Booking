import React, { useState } from 'react';
import { Show, Seat, Booking, api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from '../context/ToastContext.tsx';
import confetti from 'canvas-confetti';
import { X, CreditCard, QrCode, Building, Lock, CheckCircle2, Tag } from 'lucide-react';

interface PaymentModalProps {
  show: Show;
  selectedSeats: Seat[];
  totalAmount: number;
  onClose: () => void;
  onBookingSuccess: (booking: Booking, txnId: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  show,
  selectedSeats,
  totalAmount,
  onClose,
  onBookingSuccess,
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242');
  const [expiry, setExpiry] = useState('12/28');
  const [cvv, setCvv] = useState('888');
  const [cardHolder, setCardHolder] = useState(user?.name || 'Alex Rivera');
  const [upiId, setUpiId] = useState('user@okaxis');
  const [selectedBank, setSelectedBank] = useState('Chase Bank');

  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoApplied, setPromoApplied] = useState(false);

  const [processing, setProcessing] = useState(false);

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'IMOVIE20') {
      const discount = Number((totalAmount * 0.2).toFixed(2));
      setDiscountAmount(discount);
      setPromoApplied(true);
      showToast('Promo code IMOVIE20 applied: 20% discount!', 'success');
    } else {
      showToast('Invalid promo code. Try "IMOVIE20"', 'error');
    }
  };

  const finalAmount = Math.max(0, Number((totalAmount - discountAmount).toFixed(2)));

  const handlePayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Simulate gateway latency
      await new Promise((r) => setTimeout(r, 1200));

      const payload = {
        showId: show._id,
        selectedSeats: selectedSeats.map((s) => ({
          seatNumber: s.seatNumber,
          tier: s.tier,
          price: s.price,
        })),
        paymentMethod,
        discount: discountAmount,
      };

      const res = await api.createBooking(payload);
      if (res.success) {
        // Fire celebration confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        showToast('Payment successful! Your ticket is confirmed.', 'success');
        onBookingSuccess(res.booking, res.transactionId);
      }
    } catch (err: any) {
      showToast(err.message || 'Payment processing failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-white">Secure Checkout</h3>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Order Quick Summary */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-bold text-white text-sm">{show.movie?.title}</p>
              <p className="text-slate-400">{show.theatre?.name} · {show.screenName}</p>
              <p className="text-slate-400">
                Seats: <span className="font-mono text-amber-300 font-semibold">{selectedSeats.map((s) => s.seatNumber).join(', ')}</span>
              </p>
            </div>
            <div className="text-right">
              <span className="text-slate-400">Total payable</span>
              <p className="text-lg font-bold font-mono text-amber-400 tabular-nums">
                ${finalAmount.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Promo Code Input */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Promo code (e.g. IMOVIE20)"
              disabled={promoApplied || processing}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400 uppercase font-mono"
            />
          </div>
          <button
            type="button"
            onClick={handleApplyPromo}
            disabled={promoApplied || !promoCode || processing}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {promoApplied ? 'Applied' : 'Apply'}
          </button>
        </div>

        {/* Payment Methods Segmented Control */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Payment Option
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('card')}
              className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors ${
                paymentMethod === 'card'
                  ? 'bg-amber-400/10 border-amber-400 text-amber-300 font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>Card</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('upi')}
              className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors ${
                paymentMethod === 'upi'
                  ? 'bg-amber-400/10 border-amber-400 text-amber-300 font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>UPI / QR</span>
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('netbanking')}
              className={`p-3 rounded-xl border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors ${
                paymentMethod === 'netbanking'
                  ? 'bg-amber-400/10 border-amber-400 text-amber-300 font-semibold'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Net Banking</span>
            </button>
          </div>
        </div>

        {/* Payment Form Fields */}
        <form onSubmit={handlePayNow} className="space-y-4">
          {paymentMethod === 'card' && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Expires (MM/YY)</label>
                  <input
                    type="text"
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Security CVV</label>
                  <input
                    type="password"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    maxLength={4}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>
          )}

          {paymentMethod === 'upi' && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Virtual UPI ID / VPA</label>
                <input
                  type="text"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-400">
                A payment request authorization will be triggered to your UPI app.
              </p>
            </div>
          )}

          {paymentMethod === 'netbanking' && (
            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Select Bank</label>
                <select
                  value={selectedBank}
                  onChange={(e) => setSelectedBank(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Chase Bank">Chase Bank</option>
                  <option value="Bank of America">Bank of America</option>
                  <option value="Wells Fargo">Wells Fargo</option>
                  <option value="Citibank">Citibank</option>
                </select>
              </div>
            </div>
          )}

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={processing}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {processing ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Authorize &amp; Pay ${finalAmount.toFixed(2)}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
