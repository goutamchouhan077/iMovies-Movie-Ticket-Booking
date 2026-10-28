import { Collection, DocumentBase } from '../db/store.ts';

// 1. User
export interface IUser extends DocumentBase {
  name: string;
  email: string;
  password: string; // hashed
  role: 'user' | 'admin';
}

// 2. Movie
export interface IMovie extends DocumentBase {
  title: string;
  description: string;
  genre: string[];
  language: string;
  duration: number; // in minutes
  posterUrl: string;
  backdropUrl?: string;
  releaseDate: string;
  rating: number; // e.g. 4.8 / 5
  certification: string; // e.g. 'PG-13', 'R'
  director: string;
  cast: string[];
}

// 3. Theatre
export interface ITheatre extends DocumentBase {
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

// 4. Show
export interface IShow extends DocumentBase {
  movieId: string;
  theatreId: string;
  screenNumber: number;
  screenName: string;
  screenType: 'IMAX' | 'Dolby Atmos' | '4DX' | 'Standard';
  startTime: string; // ISO string or '2026-10-27T18:30:00'
  endTime: string;
  pricing: {
    vip: number;
    gold: number;
    silver: number;
  };
}

// 5. Seat
export interface ISeat extends DocumentBase {
  showId: string;
  seatNumber: string; // e.g. 'A1', 'B5'
  row: string; // e.g. 'A'
  col: number; // e.g. 1
  tier: 'vip' | 'gold' | 'silver';
  price: number;
  status: 'available' | 'locked' | 'booked';
  lockedBy?: string | null; // userId
  lockExpiresAt?: string | null;
}

// 6. Booking
export interface IBooking extends DocumentBase {
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
}

// 7. Payment
export interface IPayment extends DocumentBase {
  bookingId: string;
  userId: string;
  amount: number;
  currency: string;
  paymentStatus: 'completed' | 'failed' | 'refunded';
  transactionId: string;
  paymentMethod: 'card' | 'upi' | 'netbanking';
  timestamp: string;
}

// 8. Notification
export interface INotification extends DocumentBase {
  userId: string;
  title: string;
  message: string;
  type: 'booking' | 'cancellation' | 'reminder' | 'system';
  read: boolean;
}

// Collection Instances
export const Users = new Collection<IUser>('users');
export const Movies = new Collection<IMovie>('movies');
export const Theatres = new Collection<ITheatre>('theatres');
export const Shows = new Collection<IShow>('shows');
export const Seats = new Collection<ISeat>('seats');
export const Bookings = new Collection<IBooking>('bookings');
export const Payments = new Collection<IPayment>('payments');
export const Notifications = new Collection<INotification>('notifications');
