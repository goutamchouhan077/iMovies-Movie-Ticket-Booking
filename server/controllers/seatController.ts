import { Request, Response } from 'express';
import { Seats } from '../models/index.ts';
import { AuthRequest } from '../middleware/auth.ts';
import { broadcastSeatUpdate } from '../socket/socketHandler.ts';

// Auto-clean expired seat locks for a given show
async function clearExpiredLocks(showId: string) {
  const seats = await Seats.find({ showId });
  const now = Date.now();
  const unlockedSeatNumbers: string[] = [];

  for (const seat of seats) {
    if (seat.status === 'locked' && seat.lockExpiresAt) {
      if (now > new Date(seat.lockExpiresAt).getTime()) {
        await Seats.findByIdAndUpdate(seat._id, {
          status: 'available',
          lockedBy: null,
          lockExpiresAt: null,
        });
        unlockedSeatNumbers.push(seat.seatNumber);
      }
    }
  }

  if (unlockedSeatNumbers.length > 0) {
    broadcastSeatUpdate(showId, {
      action: 'unlock',
      seatNumbers: unlockedSeatNumbers,
    });
  }
}

export async function getSeats(req: Request, res: Response) {
  try {
    const { showId } = req.params;
    if (!showId) {
      return res.status(400).json({ success: false, message: 'showId is required.' });
    }

    await clearExpiredLocks(showId);

    const seats = await Seats.find({ showId });
    return res.json({ success: true, count: seats.length, seats });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function lockSeats(req: AuthRequest, res: Response) {
  try {
    const { showId, seatNumbers } = req.body;
    const userId = req.user?._id || 'guest_user';

    if (!showId || !Array.isArray(seatNumbers) || seatNumbers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'showId and an array of seatNumbers are required.',
      });
    }

    await clearExpiredLocks(showId);

    // Verify all requested seats are available or already locked by this user
    const seatsToLock = await Seats.find({ showId });
    const matchingSeats = seatsToLock.filter((s) => seatNumbers.includes(s.seatNumber));

    const unavailable = matchingSeats.filter(
      (s) => s.status === 'booked' || (s.status === 'locked' && s.lockedBy !== userId)
    );

    if (unavailable.length > 0) {
      const takenList = unavailable.map((s) => s.seatNumber).join(', ');
      return res.status(409).json({
        success: false,
        message: `Seats [${takenList}] are no longer available or currently locked by another customer.`,
      });
    }

    // Lock for 5 minutes
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    for (const s of matchingSeats) {
      await Seats.findByIdAndUpdate(s._id, {
        status: 'locked',
        lockedBy: userId,
        lockExpiresAt: expiresAt,
      });
    }

    broadcastSeatUpdate(showId, {
      action: 'lock',
      seatNumbers,
      userId,
      lockExpiresAt: expiresAt,
    });

    return res.json({
      success: true,
      message: 'Seats locked successfully for 5 minutes.',
      seatNumbers,
      lockExpiresAt: expiresAt,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function unlockSeats(req: AuthRequest, res: Response) {
  try {
    const { showId, seatNumbers } = req.body;
    const userId = req.user?._id;

    if (!showId || !Array.isArray(seatNumbers)) {
      return res.status(400).json({ success: false, message: 'showId and seatNumbers are required.' });
    }

    const seats = await Seats.find({ showId });
    const toUnlock = seats.filter(
      (s) =>
        seatNumbers.includes(s.seatNumber) &&
        s.status === 'locked' &&
        (!userId || s.lockedBy === userId || req.user?.role === 'admin')
    );

    for (const s of toUnlock) {
      await Seats.findByIdAndUpdate(s._id, {
        status: 'available',
        lockedBy: null,
        lockExpiresAt: null,
      });
    }

    broadcastSeatUpdate(showId, {
      action: 'unlock',
      seatNumbers: toUnlock.map((s) => s.seatNumber),
    });

    return res.json({
      success: true,
      message: 'Seats unlocked.',
      unlocked: toUnlock.map((s) => s.seatNumber),
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
