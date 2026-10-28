import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.ts';
import {
  Bookings,
  Seats,
  Shows,
  Movies,
  Theatres,
  Payments,
  Notifications,
} from '../models/index.ts';
import { broadcastSeatUpdate } from '../socket/socketHandler.ts';

export async function createBooking(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?._id;
    if (!userId || !req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Please sign in to book tickets.' });
    }

    const {
      showId,
      selectedSeats, // array of { seatNumber, tier, price }
      paymentMethod = 'card',
      discount = 0,
    } = req.body;

    if (!showId || !Array.isArray(selectedSeats) || selectedSeats.length === 0) {
      return res.status(400).json({ success: false, message: 'showId and selectedSeats are required.' });
    }

    const show = await Shows.findById(showId);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found.' });
    }

    const movie = await Movies.findById(show.movieId);
    const theatre = await Theatres.findById(show.theatreId);

    // Verify seats in database
    const seatNumbers = selectedSeats.map((s) => s.seatNumber);
    const allSeats = await Seats.find({ showId });
    const matchingSeats = allSeats.filter((s) => seatNumbers.includes(s.seatNumber));

    // Must be either available or locked by this user
    const invalidSeats = matchingSeats.filter(
      (s) => s.status === 'booked' || (s.status === 'locked' && s.lockedBy && s.lockedBy !== userId)
    );

    if (invalidSeats.length > 0) {
      const taken = invalidSeats.map((s) => s.seatNumber).join(', ');
      return res.status(409).json({
        success: false,
        message: `Seats ${taken} are no longer available for booking.`,
      });
    }

    // Calculate totals
    const subtotal = selectedSeats.reduce((acc, curr) => acc + (Number(curr.price) || 0), 0);
    const convenienceFee = Number((selectedSeats.length * 1.75).toFixed(2));
    const totalAmount = Number((subtotal + convenienceFee - Number(discount)).toFixed(2));

    const ticketCode = `IMV-${Math.floor(1000 + Math.random() * 9000)}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

    // 1. Create Booking Record
    const booking = await Bookings.create({
      userId,
      userName: req.user.name,
      userEmail: req.user.email,
      showId,
      movieTitle: movie?.title || 'Feature Presentation',
      theatreName: theatre?.name || 'IMovies Cinema',
      screenName: show.screenName,
      showTime: show.startTime,
      selectedSeats,
      totalAmount,
      convenienceFee,
      discount: Number(discount) || 0,
      bookingStatus: 'confirmed',
      ticketCode,
    });

    // 2. Mark Seats as Booked
    for (const s of matchingSeats) {
      await Seats.findByIdAndUpdate(s._id, {
        status: 'booked',
        lockedBy: null,
        lockExpiresAt: null,
      });
    }

    // 3. Create Payment Transaction
    const transactionId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    await Payments.create({
      bookingId: booking._id,
      userId,
      amount: totalAmount,
      currency: 'USD',
      paymentStatus: 'completed',
      transactionId,
      paymentMethod,
      timestamp: new Date().toISOString(),
    });

    // 4. Send In-App Notification
    await Notifications.create({
      userId,
      title: 'Ticket Confirmed! 🍿',
      message: `Your booking for "${movie?.title}" at ${theatre?.name} is confirmed! Ticket Code: ${ticketCode}. Enjoy the show!`,
      type: 'booking',
      read: false,
    });

    // 5. Broadcast to room that these seats are now booked
    broadcastSeatUpdate(showId, {
      action: 'booked',
      seatNumbers,
    });

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking,
      transactionId,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getUserBookings(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const bookings = await Bookings.find({ userId });
    // Sort newest first
    bookings.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

    return res.json({ success: true, count: bookings.length, bookings });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getAllBookings(req: AuthRequest, res: Response) {
  try {
    const bookings = await Bookings.find();
    bookings.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

    // Analytics summary
    const totalRevenue = bookings
      .filter((b) => b.bookingStatus === 'confirmed')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const confirmedCount = bookings.filter((b) => b.bookingStatus === 'confirmed').length;
    const cancelledCount = bookings.filter((b) => b.bookingStatus === 'cancelled').length;

    return res.json({
      success: true,
      count: bookings.length,
      analytics: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        confirmedCount,
        cancelledCount,
      },
      bookings,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function cancelBooking(req: AuthRequest, res: Response) {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const booking = await Bookings.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found.' });
    }

    if (booking.userId !== userId && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied. You cannot cancel this booking.' });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled.' });
    }

    // 1. Update Booking Status
    const updated = await Bookings.findByIdAndUpdate(id, { bookingStatus: 'cancelled' });

    // 2. Release Seats back to available
    const seatNumbers = booking.selectedSeats.map((s) => s.seatNumber);
    const seats = await Seats.find({ showId: booking.showId });
    const toRelease = seats.filter((s) => seatNumbers.includes(s.seatNumber));

    for (const s of toRelease) {
      await Seats.findByIdAndUpdate(s._id, {
        status: 'available',
        lockedBy: null,
        lockExpiresAt: null,
      });
    }

    // 3. Mark Payment Refunded
    const payment = await Payments.findOne({ bookingId: id });
    if (payment) {
      await Payments.findByIdAndUpdate(payment._id, { paymentStatus: 'refunded' });
    }

    // 4. Send Notification
    await Notifications.create({
      userId: booking.userId,
      title: 'Booking Cancelled',
      message: `Your booking for "${booking.movieTitle}" (${booking.ticketCode}) has been cancelled. Refund of $${booking.totalAmount.toFixed(2)} is being processed.`,
      type: 'cancellation',
      read: false,
    });

    // 5. Broadcast to room that seats are available again
    broadcastSeatUpdate(booking.showId, {
      action: 'unlock',
      seatNumbers,
    });

    return res.json({
      success: true,
      message: 'Booking cancelled successfully. Seats have been released.',
      booking: updated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
