import bcrypt from 'bcryptjs';
import {
  Users,
  Movies,
  Theatres,
  Shows,
  Seats,
  Bookings,
  Notifications,
} from '../models/index.ts';

export async function seedDatabase() {
  const existingUsers = await Users.countDocuments();
  if (existingUsers > 0) {
    console.log('[Seed] Database already contains records. Skipping seed.');
    return;
  }

  console.log('[Seed] Seeding database with initial IMovies cinema data...');

  // 1. Users
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const userPassword = await bcrypt.hash('user123', salt);

  const admin = await Users.create({
    _id: 'usr_admin',
    name: 'Cinema Administrator',
    email: 'admin@imovies.com',
    password: adminPassword,
    role: 'admin',
  });

  const demoUser = await Users.create({
    _id: 'usr_demo',
    name: 'Alex Rivera',
    email: 'user@imovies.com',
    password: userPassword,
    role: 'user',
  });

  // 2. Movies
  const movieCosmic = await Movies.create({
    _id: 'mov_cosmic_horizon',
    title: 'Cosmic Horizon',
    description: 'An elite interstellar expedition journeys through an unstable quantum gravitational rift on the brink of human extinction to find a new sanctuary.',
    genre: ['Sci-Fi', 'Adventure', 'Mystery'],
    language: 'English',
    duration: 165,
    posterUrl: '/src/assets/images/movie_poster_odyssey_1793122537758.jpg',
    backdropUrl: '/src/assets/images/movie_poster_odyssey_1793122537758.jpg',
    releaseDate: '2026-10-15',
    rating: 4.9,
    certification: 'PG-13',
    director: 'Eliza Vance',
    cast: ['Alexander Reed', 'Jessica Chen', 'Matthew Adams'],
  });

  const movieNeon = await Movies.create({
    _id: 'mov_neon_protocol',
    title: 'Neon Protocol',
    description: 'In the drenched neon alleys of 2088 Neo-Kyoto, a retired cybernetic investigator uncovers a memory synthesis conspiracy threatening to erase global identities.',
    genre: ['Sci-Fi', 'Thriller', 'Action'],
    language: 'English',
    duration: 142,
    posterUrl: '/src/assets/images/movie_poster_cyberpunk_1793122539217.jpg',
    backdropUrl: '/src/assets/images/movie_poster_cyberpunk_1793122539217.jpg',
    releaseDate: '2026-10-20',
    rating: 4.8,
    certification: 'R',
    director: 'Ren Juno',
    cast: ['Elias Thorne', 'Maeve Riley', 'Jaxon Reed'],
  });

  const movieGambit = await Movies.create({
    _id: 'mov_grand_gambit',
    title: 'The Grand Gambit',
    description: 'A master tactician assembles a clandestine team of high-tech infiltration specialists to breach the world’s most impenetrable subterranean casino vault.',
    genre: ['Action', 'Crime', 'Thriller'],
    language: 'English',
    duration: 130,
    posterUrl: '/src/assets/images/movie_poster_heist_1793122539259.jpg',
    backdropUrl: '/src/assets/images/movie_poster_heist_1793122539259.jpg',
    releaseDate: '2026-10-24',
    rating: 4.7,
    certification: 'PG-13',
    director: 'Marcus Vance',
    cast: ['Elias Vance', 'Maya Jensen', 'Marcus Blake', 'Kai Lee'],
  });

  const movieShadows = await Movies.create({
    _id: 'mov_realm_shadows',
    title: 'Realm of Shadows',
    description: 'When the ancient wardstone fractures, a lone runic guardian must traverse forgotten dragon peaks to reignite the primordial forge before twilight claims all realms.',
    genre: ['Fantasy', 'Adventure', 'Action'],
    language: 'English',
    duration: 154,
    posterUrl: '/src/assets/images/movie_poster_fantasy_1793122539812.jpg',
    backdropUrl: '/src/assets/images/movie_poster_fantasy_1793122539812.jpg',
    releaseDate: '2026-10-28',
    rating: 4.9,
    certification: 'PG-13',
    director: 'Eliza Thornton',
    cast: ['Kaelen Morgan', 'Eliza Reed', 'Arthur Vance', 'Liam Foster'],
  });

  // 3. Theatres
  const theatreApex = await Theatres.create({
    _id: 'th_apex_cinema',
    name: 'IMovies Grand Multiplex',
    location: '450 Broadway Avenue, Downtown',
    city: 'New York',
    screens: [
      { screenNumber: 1, name: 'Audi 1 - IMAX Laser', type: 'IMAX', totalSeats: 48 },
      { screenNumber: 2, name: 'Audi 2 - Dolby Atmos', type: 'Dolby Atmos', totalSeats: 48 },
      { screenNumber: 3, name: 'Audi 3 - Premium 4DX', type: '4DX', totalSeats: 48 },
    ],
  });

  const theatreWest = await Theatres.create({
    _id: 'th_west_cinema',
    name: 'IMovies Westside Cinema Palace',
    location: '1200 Sunset Boulevard, West Hollywood',
    city: 'Los Angeles',
    screens: [
      { screenNumber: 1, name: 'Screen A - Dolby Atmos', type: 'Dolby Atmos', totalSeats: 48 },
      { screenNumber: 2, name: 'Screen B - Laser Luxe', type: 'Standard', totalSeats: 48 },
    ],
  });

  // 4. Shows & Seats Generator
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const cols = 8; // 6 rows * 8 cols = 48 seats

  const today = new Date();
  const getIsoDate = (dayOffset: number, hour: number, minute: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + dayOffset);
    d.setHours(hour, minute, 0, 0);
    return d.toISOString();
  };

  const sampleShowConfigs = [
    // Cosmic Horizon
    {
      movieId: movieCosmic._id,
      theatreId: theatreApex._id,
      screenNumber: 1,
      screenName: 'Audi 1 - IMAX Laser',
      screenType: 'IMAX' as const,
      startTime: getIsoDate(0, 14, 0),
      endTime: getIsoDate(0, 16, 45),
      pricing: { vip: 20, gold: 16, silver: 12 },
    },
    {
      movieId: movieCosmic._id,
      theatreId: theatreApex._id,
      screenNumber: 1,
      screenName: 'Audi 1 - IMAX Laser',
      screenType: 'IMAX' as const,
      startTime: getIsoDate(0, 18, 30),
      endTime: getIsoDate(0, 21, 15),
      pricing: { vip: 22, gold: 18, silver: 14 },
    },
    {
      movieId: movieCosmic._id,
      theatreId: theatreWest._id,
      screenNumber: 1,
      screenName: 'Screen A - Dolby Atmos',
      screenType: 'Dolby Atmos' as const,
      startTime: getIsoDate(0, 20, 0),
      endTime: getIsoDate(0, 22, 45),
      pricing: { vip: 19, gold: 15, silver: 11 },
    },
    // Neon Protocol
    {
      movieId: movieNeon._id,
      theatreId: theatreApex._id,
      screenNumber: 2,
      screenName: 'Audi 2 - Dolby Atmos',
      screenType: 'Dolby Atmos' as const,
      startTime: getIsoDate(0, 15, 30),
      endTime: getIsoDate(0, 18, 0),
      pricing: { vip: 18, gold: 14, silver: 10 },
    },
    {
      movieId: movieNeon._id,
      theatreId: theatreApex._id,
      screenNumber: 2,
      screenName: 'Audi 2 - Dolby Atmos',
      screenType: 'Dolby Atmos' as const,
      startTime: getIsoDate(0, 21, 0),
      endTime: getIsoDate(0, 23, 30),
      pricing: { vip: 20, gold: 16, silver: 12 },
    },
    // The Grand Gambit
    {
      movieId: movieGambit._id,
      theatreId: theatreApex._id,
      screenNumber: 3,
      screenName: 'Audi 3 - Premium 4DX',
      screenType: '4DX' as const,
      startTime: getIsoDate(0, 16, 0),
      endTime: getIsoDate(0, 18, 15),
      pricing: { vip: 21, gold: 17, silver: 13 },
    },
    {
      movieId: movieGambit._id,
      theatreId: theatreWest._id,
      screenNumber: 2,
      screenName: 'Screen B - Laser Luxe',
      screenType: 'Standard' as const,
      startTime: getIsoDate(0, 19, 15),
      endTime: getIsoDate(0, 21, 30),
      pricing: { vip: 17, gold: 13, silver: 9 },
    },
    // Realm of Shadows
    {
      movieId: movieShadows._id,
      theatreId: theatreApex._id,
      screenNumber: 1,
      screenName: 'Audi 1 - IMAX Laser',
      screenType: 'IMAX' as const,
      startTime: getIsoDate(1, 17, 0),
      endTime: getIsoDate(1, 19, 40),
      pricing: { vip: 22, gold: 18, silver: 14 },
    },
    {
      movieId: movieShadows._id,
      theatreId: theatreWest._id,
      screenNumber: 1,
      screenName: 'Screen A - Dolby Atmos',
      screenType: 'Dolby Atmos' as const,
      startTime: getIsoDate(1, 19, 30),
      endTime: getIsoDate(1, 22, 10),
      pricing: { vip: 19, gold: 15, silver: 11 },
    },
  ];

  for (let i = 0; i < sampleShowConfigs.length; i++) {
    const config = sampleShowConfigs[i];
    const show = await Shows.create({
      _id: `sh_${i + 1}`,
      ...config,
    });

    // Generate seats for this show
    for (let r = 0; r < rows.length; r++) {
      const rowLetter = rows[r];
      // Row A & B: VIP, Row C & D: Gold, Row E & F: Silver
      const tier = r < 2 ? 'vip' : r < 4 ? 'gold' : 'silver';
      const price = config.pricing[tier];

      for (let c = 1; c <= cols; c++) {
        const seatNumber = `${rowLetter}${c}`;
        // Randomly pre-book a couple of seats for realism on show #1
        const isPrebooked = (i === 1 && (seatNumber === 'C4' || seatNumber === 'C5' || seatNumber === 'B3'));
        
        await Seats.create({
          _id: `seat_${show._id}_${seatNumber}`,
          showId: show._id,
          seatNumber,
          row: rowLetter,
          col: c,
          tier,
          price,
          status: isPrebooked ? 'booked' : 'available',
        });
      }
    }
  }

  // Pre-seed a sample booking for demo user
  const sampleShow = (await Shows.find())[0];
  if (sampleShow) {
    const sampleBooking = await Bookings.create({
      _id: 'bk_demo_101',
      userId: demoUser._id,
      userName: demoUser.name,
      userEmail: demoUser.email,
      showId: sampleShow._id,
      movieTitle: movieCosmic.title,
      theatreName: theatreApex.name,
      screenName: sampleShow.screenName,
      showTime: sampleShow.startTime,
      selectedSeats: [
        { seatNumber: 'B4', tier: 'vip', price: 20 },
        { seatNumber: 'B5', tier: 'vip', price: 20 },
      ],
      totalAmount: 43.50,
      convenienceFee: 3.50,
      discount: 0,
      bookingStatus: 'confirmed',
      ticketCode: 'IMV-8942-XQ',
    });

    // Mark seats as booked
    await Seats.findByIdAndUpdate(`seat_${sampleShow._id}_B4`, { status: 'booked' });
    await Seats.findByIdAndUpdate(`seat_${sampleShow._id}_B5`, { status: 'booked' });

    // Notification
    await Notifications.create({
      userId: demoUser._id,
      title: 'Booking Confirmed!',
      message: `Your tickets for ${movieCosmic.title} at ${theatreApex.name} (Seats B4, B5) are confirmed. Show code: ${sampleBooking.ticketCode}.`,
      type: 'booking',
      read: false,
    });
  }

  console.log('[Seed] Database successfully seeded with movies, theatres, shows, and seats!');
}
