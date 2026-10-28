import { Router } from 'express';
import {
  register,
  login,
  getMe,
  quickDemoLogin,
} from '../controllers/authController.ts';
import {
  getMovies,
  getMovieById,
  createMovie,
  updateMovie,
  deleteMovie,
} from '../controllers/movieController.ts';
import {
  getTheatres,
  getTheatreById,
  createTheatre,
  updateTheatre,
  deleteTheatre,
} from '../controllers/theatreController.ts';
import {
  getShows,
  getShowById,
  createShow,
  deleteShow,
} from '../controllers/showController.ts';
import {
  getSeats,
  lockSeats,
  unlockSeats,
} from '../controllers/seatController.ts';
import {
  createBooking,
  getUserBookings,
  getAllBookings,
  cancelBooking,
} from '../controllers/bookingController.ts';
import {
  getUserNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../controllers/notificationController.ts';
import { authenticateToken, requireAdmin } from '../middleware/auth.ts';
import { rateLimiter } from '../middleware/rateLimit.ts';
import { Movies, Theatres, Shows, Bookings, Users } from '../models/index.ts';

const router = Router();

// 1. Auth Routes
router.post('/auth/register', rateLimiter(30, 60000), register);
router.post('/auth/login', rateLimiter(30, 60000), login);
router.post('/auth/demo', quickDemoLogin);
router.get('/auth/me', authenticateToken, getMe);

// 2. Movie Routes
router.get('/movies', getMovies);
router.get('/movies/:id', getMovieById);
router.post('/movies', authenticateToken, requireAdmin, createMovie);
router.put('/movies/:id', authenticateToken, requireAdmin, updateMovie);
router.delete('/movies/:id', authenticateToken, requireAdmin, deleteMovie);

// 3. Theatre Routes
router.get('/theatres', getTheatres);
router.get('/theatres/:id', getTheatreById);
router.post('/theatres', authenticateToken, requireAdmin, createTheatre);
router.put('/theatres/:id', authenticateToken, requireAdmin, updateTheatre);
router.delete('/theatres/:id', authenticateToken, requireAdmin, deleteTheatre);

// 4. Show Routes
router.get('/shows', getShows);
router.get('/shows/:id', getShowById);
router.post('/shows', authenticateToken, requireAdmin, createShow);
router.delete('/shows/:id', authenticateToken, requireAdmin, deleteShow);

// 5. Seat Routes
router.get('/seats/:showId', getSeats);
router.post('/seats/lock', authenticateToken, lockSeats);
router.post('/seats/unlock', authenticateToken, unlockSeats);

// 6. Booking Routes
router.post('/bookings', authenticateToken, createBooking);
router.get('/bookings/my', authenticateToken, getUserBookings);
router.get('/bookings/admin/all', authenticateToken, requireAdmin, getAllBookings);
router.post('/bookings/:id/cancel', authenticateToken, cancelBooking);

// 7. Notification Routes
router.get('/notifications', authenticateToken, getUserNotifications);
router.patch('/notifications/:id/read', authenticateToken, markNotificationRead);
router.post('/notifications/read-all', authenticateToken, markAllNotificationsRead);

// 8. Admin Dashboard Summary Metrics
router.get('/admin/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const movieCount = await Movies.countDocuments();
    const theatreCount = await Theatres.countDocuments();
    const showCount = await Shows.countDocuments();
    const userCount = await Users.countDocuments();
    const allBookings = await Bookings.find();

    const confirmed = allBookings.filter((b) => b.bookingStatus === 'confirmed');
    const totalRevenue = confirmed.reduce((acc, b) => acc + b.totalAmount, 0);

    return res.json({
      success: true,
      stats: {
        totalMovies: movieCount,
        totalTheatres: theatreCount,
        totalShows: showCount,
        totalUsers: userCount,
        totalBookings: allBookings.length,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        recentBookings: allBookings.slice(-5).reverse(),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
