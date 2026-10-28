import { io, Socket } from 'socket.io-client';

const API_BASE = '/api';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Movie {
  _id: string;
  title: string;
  description: string;
  genre: string[];
  language: string;
  duration: number;
  posterUrl: string;
  backdropUrl?: string;
  releaseDate: string;
  rating: number;
  certification: string;
  director: string;
  cast: string[];
}

export interface Theatre {
  _id: string;
  name: string;
  location: string;
  city: string;
  screens: {
    screenNumber: number;
    name: string;
    type: 'IMAX' | 'Dolby Atmos' | '4DX' | 'Standard';
    totalSeats: number;
  }[];
}

export interface Show {
  _id: string;
  movieId: string;
  theatreId: string;
  screenNumber: number;
  screenName: string;
  screenType: 'IMAX' | 'Dolby Atmos' | '4DX' | 'Standard';
  startTime: string;
  endTime: string;
  pricing: {
    vip: number;
    gold: number;
    silver: number;
  };
  movie?: Movie;
  theatre?: Theatre;
}

export interface Seat {
  _id: string;
  showId: string;
  seatNumber: string;
  row: string;
  col: number;
  tier: 'vip' | 'gold' | 'silver';
  price: number;
  status: 'available' | 'locked' | 'booked';
  lockedBy?: string | null;
  lockExpiresAt?: string | null;
}

export interface Booking {
  _id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  showId: string;
  movieTitle: string;
  theatreName: string;
  screenName: string;
  showTime: string;
  selectedSeats: {
    seatNumber: string;
    tier: string;
    price: number;
  }[];
  totalAmount: number;
  convenienceFee: number;
  discount: number;
  bookingStatus: 'confirmed' | 'cancelled' | 'pending';
  ticketCode: string;
  createdAt?: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'cancellation' | 'reminder' | 'system';
  read: boolean;
  createdAt?: string;
}

export interface AdminStats {
  totalMovies: number;
  totalTheatres: number;
  totalShows: number;
  totalUsers: number;
  totalBookings: number;
  totalRevenue: number;
  recentBookings: Booking[];
}

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('imovies_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Request failed with status ${res.status}`);
  }
  return data;
}

// API methods
export const api = {
  // Auth
  login: (email: string, password: string) =>
    request<{ success: boolean; token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (name: string, email: string, password: string, role?: string) =>
    request<{ success: boolean; token: string; user: User }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role }),
    }),

  quickDemo: (role: 'admin' | 'user') =>
    request<{ success: boolean; token: string; user: User }>('/auth/demo', {
      method: 'POST',
      body: JSON.stringify({ role }),
    }),

  getMe: () =>
    request<{ success: boolean; user: User }>('/auth/me'),

  // Movies
  getMovies: (params?: { genre?: string; language?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.genre && params.genre !== 'All') q.set('genre', params.genre);
    if (params?.language && params.language !== 'All') q.set('language', params.language);
    if (params?.search) q.set('search', params.search);
    const qs = q.toString();
    return request<{ success: boolean; movies: Movie[] }>(`/movies${qs ? `?${qs}` : ''}`);
  },

  getMovieById: (id: string) =>
    request<{ success: boolean; movie: Movie; shows: Show[] }>(`/movies/${id}`),

  createMovie: (movieData: Partial<Movie>) =>
    request<{ success: boolean; movie: Movie }>('/movies', {
      method: 'POST',
      body: JSON.stringify(movieData),
    }),

  updateMovie: (id: string, movieData: Partial<Movie>) =>
    request<{ success: boolean; movie: Movie }>(`/movies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(movieData),
    }),

  deleteMovie: (id: string) =>
    request<{ success: boolean }>(`/movies/${id}`, {
      method: 'DELETE',
    }),

  // Theatres
  getTheatres: () =>
    request<{ success: boolean; theatres: Theatre[] }>('/theatres'),

  createTheatre: (theatreData: Partial<Theatre>) =>
    request<{ success: boolean; theatre: Theatre }>('/theatres', {
      method: 'POST',
      body: JSON.stringify(theatreData),
    }),

  deleteTheatre: (id: string) =>
    request<{ success: boolean }>(`/theatres/${id}`, {
      method: 'DELETE',
    }),

  // Shows
  getShows: (params?: { movieId?: string; theatreId?: string; date?: string }) => {
    const q = new URLSearchParams();
    if (params?.movieId) q.set('movieId', params.movieId);
    if (params?.theatreId) q.set('theatreId', params.theatreId);
    if (params?.date) q.set('date', params.date);
    const qs = q.toString();
    return request<{ success: boolean; shows: Show[] }>(`/shows${qs ? `?${qs}` : ''}`);
  },

  getShowById: (id: string) =>
    request<{ success: boolean; show: Show }>(`/shows/${id}`),

  createShow: (showData: any) =>
    request<{ success: boolean; show: Show }>('/shows', {
      method: 'POST',
      body: JSON.stringify(showData),
    }),

  deleteShow: (id: string) =>
    request<{ success: boolean }>(`/shows/${id}`, {
      method: 'DELETE',
    }),

  // Seats
  getSeats: (showId: string) =>
    request<{ success: boolean; seats: Seat[] }>(`/seats/${showId}`),

  lockSeats: (showId: string, seatNumbers: string[]) =>
    request<{ success: boolean; seatNumbers: string[]; lockExpiresAt: string }>('/seats/lock', {
      method: 'POST',
      body: JSON.stringify({ showId, seatNumbers }),
    }),

  unlockSeats: (showId: string, seatNumbers: string[]) =>
    request<{ success: boolean; unlocked: string[] }>('/seats/unlock', {
      method: 'POST',
      body: JSON.stringify({ showId, seatNumbers }),
    }),

  // Bookings
  createBooking: (bookingData: {
    showId: string;
    selectedSeats: { seatNumber: string; tier: string; price: number }[];
    paymentMethod: string;
    discount?: number;
  }) =>
    request<{ success: boolean; booking: Booking; transactionId: string }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    }),

  getMyBookings: () =>
    request<{ success: boolean; bookings: Booking[] }>('/bookings/my'),

  getAllBookings: () =>
    request<{ success: boolean; bookings: Booking[]; analytics: any }>('/bookings/admin/all'),

  cancelBooking: (id: string) =>
    request<{ success: boolean; message: string; booking: Booking }>(`/bookings/${id}/cancel`, {
      method: 'POST',
    }),

  // Notifications
  getNotifications: () =>
    request<{ success: boolean; notifications: NotificationItem[] }>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ success: boolean }>(`/notifications/${id}/read`, {
      method: 'PATCH',
    }),

  markAllNotificationsRead: () =>
    request<{ success: boolean }>('/notifications/read-all', {
      method: 'POST',
    }),

  // Admin Stats
  getAdminStats: () =>
    request<{ success: boolean; stats: AdminStats }>('/admin/stats'),
};

// Singleton Socket instance
let socket: Socket | null = null;
export function getSocket(): Socket {
  if (!socket) {
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });
  }
  return socket;
}
