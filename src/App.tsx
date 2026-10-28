import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ToastProvider } from './context/ToastContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { HeroBanner } from './components/HeroBanner.tsx';
import { MovieCatalog } from './components/MovieCatalog.tsx';
import { MovieDetailsModal } from './components/MovieDetailsModal.tsx';
import { SeatSelectionView } from './components/SeatSelectionView.tsx';
import { PaymentModal } from './components/PaymentModal.tsx';
import { TicketConfirmationModal } from './components/TicketConfirmationModal.tsx';
import { MyBookingsView } from './components/MyBookingsView.tsx';
import { TheatresView } from './components/TheatresView.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { Footer } from './components/Footer.tsx';
import { Movie, Show, Seat, Booking, api } from './api/client.ts';

function MainContent() {
  const { user } = useAuth();

  const [currentTab, setCurrentTab] = useState<'movies' | 'theatres' | 'bookings' | 'admin'>('movies');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  // Flow State
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [activeShow, setActiveShow] = useState<Show | null>(null);
  const [checkoutData, setCheckoutData] = useState<{
    show: Show;
    selectedSeats: Seat[];
    totalAmount: number;
    discount: number;
  } | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Booking | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      const res = await api.getMovies();
      if (res.success) {
        setMovies(res.movies);
      }
    } catch (err) {
      console.error('Failed to load movies', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleSelectMovie = (movie: Movie) => {
    setSelectedMovie(movie);
  };

  const handleSelectShow = (show: Show) => {
    setSelectedMovie(null);
    setActiveShow(show);
  };

  const handleProceedToPayment = (
    selectedSeats: Seat[],
    totalAmount: number,
    discount: number
  ) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (activeShow) {
      setCheckoutData({
        show: activeShow,
        selectedSeats,
        totalAmount,
        discount,
      });
    }
  };

  const handleBookingSuccess = (booking: Booking) => {
    setCheckoutData(null);
    setActiveShow(null);
    setConfirmedBooking(booking);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Bar Contract Navbar */}
      <Navbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setActiveShow(null);
          setCurrentTab(tab);
        }}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      <main className="flex-1">
        {/* Active Flow: Seat Selection View */}
        {activeShow ? (
          <SeatSelectionView
            show={activeShow}
            onBack={() => setActiveShow(null)}
            onProceedToPayment={handleProceedToPayment}
          />
        ) : (
          <>
            {/* TAB: MOVIES */}
            {currentTab === 'movies' && (
              <div>
                <HeroBanner movies={movies} onSelectMovie={handleSelectMovie} />
                <MovieCatalog movies={movies} onSelectMovie={handleSelectMovie} />
              </div>
            )}

            {/* TAB: CINEMAS / THEATRES */}
            {currentTab === 'theatres' && (
              <TheatresView
                onSelectShow={handleSelectShow}
                onSelectMovie={handleSelectMovie}
              />
            )}

            {/* TAB: MY BOOKINGS */}
            {currentTab === 'bookings' && <MyBookingsView />}

            {/* TAB: ADMIN DASHBOARD */}
            {currentTab === 'admin' && <AdminDashboard />}
          </>
        )}
      </main>

      {/* Footer */}
      <Footer onSelectTab={(tab) => {
        setActiveShow(null);
        setCurrentTab(tab);
      }} />

      {/* Movie Details Modal */}
      {selectedMovie && (
        <MovieDetailsModal
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
          onSelectShow={handleSelectShow}
        />
      )}

      {/* Payment & Checkout Modal */}
      {checkoutData && (
        <PaymentModal
          show={checkoutData.show}
          selectedSeats={checkoutData.selectedSeats}
          totalAmount={checkoutData.totalAmount}
          onClose={() => setCheckoutData(null)}
          onBookingSuccess={handleBookingSuccess}
        />
      )}

      {/* Ticket Pass Confirmation Modal */}
      {confirmedBooking && (
        <TicketConfirmationModal
          booking={confirmedBooking}
          onClose={() => setConfirmedBooking(null)}
          onViewMyBookings={() => {
            setConfirmedBooking(null);
            setCurrentTab('bookings');
          }}
        />
      )}

      {/* Authentication Modal */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainContent />
      </ToastProvider>
    </AuthProvider>
  );
}
