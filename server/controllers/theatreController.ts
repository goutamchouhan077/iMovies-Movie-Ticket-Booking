import { Request, Response } from 'express';
import { Theatres, Shows, Seats } from '../models/index.ts';

export async function getTheatres(req: Request, res: Response) {
  try {
    const theatres = await Theatres.find();
    return res.json({ success: true, count: theatres.length, theatres });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getTheatreById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const theatre = await Theatres.findById(id);
    if (!theatre) {
      return res.status(404).json({ success: false, message: 'Theatre not found' });
    }
    const theatreShows = await Shows.find({ theatreId: id });
    return res.json({ success: true, theatre, shows: theatreShows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createTheatre(req: Request, res: Response) {
  try {
    const { name, location, city, screens } = req.body;
    if (!name || !location || !city) {
      return res.status(400).json({ success: false, message: 'Name, location, and city are required.' });
    }

    const defaultScreens = screens && screens.length > 0 ? screens : [
      { screenNumber: 1, name: 'Screen 1 - IMAX', type: 'IMAX', totalSeats: 48 },
      { screenNumber: 2, name: 'Screen 2 - Atmos', type: 'Dolby Atmos', totalSeats: 48 },
    ];

    const theatre = await Theatres.create({
      name: name.trim(),
      location: location.trim(),
      city: city.trim(),
      screens: defaultScreens,
    });

    return res.status(201).json({ success: true, message: 'Theatre registered successfully.', theatre });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateTheatre(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await Theatres.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Theatre not found' });
    }
    const updated = await Theatres.findByIdAndUpdate(id, req.body);
    return res.json({ success: true, message: 'Theatre updated successfully.', theatre: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteTheatre(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const existing = await Theatres.findById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Theatre not found' });
    }

    await Theatres.findByIdAndDelete(id);

    // Delete associated shows and seats
    const associatedShows = await Shows.find({ theatreId: id });
    for (const s of associatedShows) {
      await Seats.deleteMany({ showId: s._id });
    }
    await Shows.deleteMany({ theatreId: id });

    return res.json({ success: true, message: 'Theatre and associated schedules removed.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
