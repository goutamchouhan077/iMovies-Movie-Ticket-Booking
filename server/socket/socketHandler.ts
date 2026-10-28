import { Server as SocketServer, Socket } from 'socket.io';

let ioInstance: SocketServer | null = null;

export function initSocketIO(io: SocketServer) {
  ioInstance = io;

  io.on('connection', (socket: Socket) => {
    // Client joins a specific show room
    socket.on('join_show', (showId: string) => {
      if (showId) {
        socket.join(`show:${showId}`);
      }
    });

    // Client leaves a show room
    socket.on('leave_show', (showId: string) => {
      if (showId) {
        socket.leave(`show:${showId}`);
      }
    });

    socket.on('disconnect', () => {
      // Disconnection cleanup handled on server lock expiry
    });
  });
}

export function broadcastSeatUpdate(showId: string, payload: {
  action: 'lock' | 'unlock' | 'booked';
  seatNumbers: string[];
  userId?: string;
  lockExpiresAt?: string | null;
}) {
  if (ioInstance) {
    ioInstance.to(`show:${showId}`).emit('seat_status_changed', payload);
  }
}
