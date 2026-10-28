import { Request, Response } from 'express';
import { Shows, Movies, Theatres, Seats } from '../models/index.ts';

export async function getShows(req: Request, res: Response) {
  try {
    const { movieId, theatreId, date } = req.query;
    let list = await Shows.find();

    if (movieId && typeof movieId === 'string') {
      list = list.filter((s) => s.movieId === movieId);
    }
    if (theatreId && typeof theatreId === 'string') {
      list = list.filter((s) => s.theatreId === theatreId);
    }
    if (date && typeof date === 'string') {
      list = list.filter((s) => s.startTime.startsWith(date));
    }

    // Populate movie & theatre names
    const populated = await Promise.all(
      list.map(async (show) => {
        const movie = await Movies.findById(show.movieId);
        const theatre = await Theatres.findById(show.theatreId);
        return {
          ...show,
          movie,
          theatre,
        };
      })
    );

    return res.json({ success: true, count: populated.length, shows: populated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getShowById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const show = await Shows.findById(id);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    const movie = await Movies.findById(show.movieId);
    const theatre = await Theatres.findById(show.theatreId);

    return res.json({
      success: true,
      show: {
        ...show,
        movie,
        theatre,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createShow(req: Request, res: Response) {
  try {
    const {
      movieId,
      theatreId,
      screenNumber,
      screenName,
      screenType,
      startTime,
      endTime,
      pricing,
    } = req.body;

    if (!movieId || !theatreId || !startTime || !pricing) {
      return res.status(400).json({
        success: false,
        message: 'movieId, theatreId, startTime, and pricing are required.',
      });
    }

    const movie = await Movies.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Selected movie does not exist.' });
    }

    const theatre = await Theatres.findById(theatreId);
    if (!theatre) {
      return res.status(404).json({ success: false, message: 'Selected theatre does not exist.' });
    }

    // Calculate end time if not supplied based on duration
    let end = endTime;
    if (!end) {
      const d = new Date(startTime);
      d.setMinutes(d.getMinutes() + (movie.duration || 120) + 20); // runtime + interval
      end = d.toISOString();
    }

    const show = await Shows.create({
      movieId,
      theatreId,
      screenNumber: Number(screenNumber) || 1,
      screenName: screenName || `Screen ${screenNumber || 1}`,
      screenType: screenType || 'Standard',
      startTime,
      endTime: end,
      pricing: {
        vip: Number(pricing.vip) || 20,
        gold: Number(pricing.gold) || 15,
        silver: Number(pricing.silver) || 10,
      },
    });

    // Initialize 48 seats for this show (Rows A-F, cols 1-8)
    const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      const tier = r < 2 ? 'vip' : r < 4 ? 'gold' : 'silver';
      const price = show.pricing[tier];

      for (let c = 1; c <= 8; c++) {
        const seatNumber = `${row}${c}`;
        await Seats.create({
          _id: `seat_${show._id}_${seatNumber}`,
          showId: show._id,
          seatNumber,
          row,
          col: c,
          tier,
          price,
          status: 'available',
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Show scheduled successfully and seating map generated.',
      show,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteShow(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const show = await Shows.findById(id);
    if (!show) {
      return res.status(404).json({ success: false, message: 'Show not found' });
    }

    await Seats.deleteMany({ showId: id });
    await Shows.findByIdAndDelete(id);

    return res.json({ success: true, message: 'Show and seating data removed successfully.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
