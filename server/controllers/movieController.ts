import { Request, Response } from 'express';
import { Movies, Shows, Seats } from '../models/index.ts';

export async function getMovies(req: Request, res: Response) {
  try {
    const { genre, language, search } = req.query;
    let list = await Movies.find();

    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.director.toLowerCase().includes(q) ||
          m.cast.some((actor) => actor.toLowerCase().includes(q))
      );
    }

    if (genre && typeof genre === 'string' && genre !== 'All') {
      list = list.filter((m) =>
        m.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
      );
    }

    if (language && typeof language === 'string' && language !== 'All') {
      list = list.filter(
        (m) => m.language.toLowerCase() === language.toLowerCase()
      );
    }

    return res.json({ success: true, count: list.length, movies: list });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getMovieById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const movie = await Movies.findById(id);

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    const movieShows = await Shows.find({ movieId: id });

    return res.json({ success: true, movie, shows: movieShows });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createMovie(req: Request, res: Response) {
  try {
    const {
      title,
      description,
      genre,
      language,
      duration,
      posterUrl,
      backdropUrl,
      releaseDate,
      rating,
      certification,
      director,
      cast,
    } = req.body;

    if (!title || !description || !duration || !posterUrl) {
      return res.status(400).json({
        success: false,
        message: 'Title, description, duration, and posterUrl are required.',
      });
    }

    const newMovie = await Movies.create({
      title: title.trim(),
      description: description.trim(),
      genre: Array.isArray(genre) ? genre : [genre || 'General'],
      language: language || 'English',
      duration: Number(duration),
      posterUrl,
      backdropUrl: backdropUrl || posterUrl,
      releaseDate: releaseDate || new Date().toISOString().split('T')[0],
      rating: Number(rating) || 4.5,
      certification: certification || 'PG-13',
      director: director || 'Director',
      cast: Array.isArray(cast) ? cast : cast ? cast.split(',').map((c: string) => c.trim()) : [],
    });

    return res.status(201).json({
      success: true,
      message: 'Movie added successfully.',
      movie: newMovie,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function updateMovie(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const movie = await Movies.findById(id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    const updated = await Movies.findByIdAndUpdate(id, req.body);
    return res.json({ success: true, message: 'Movie updated successfully.', movie: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function deleteMovie(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const movie = await Movies.findById(id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    await Movies.findByIdAndDelete(id);

    // Delete associated shows and seats
    const associatedShows = await Shows.find({ movieId: id });
    for (const s of associatedShows) {
      await Seats.deleteMany({ showId: s._id });
    }
    await Shows.deleteMany({ movieId: id });

    return res.json({ success: true, message: 'Movie and associated shows deleted.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
