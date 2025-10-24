export function initSockets(io) {
  io.on('connection', (socket) => {
    console.log(`🟢 User connected: ${socket.id}`);

    socket.on('new-review', (review) => {
      io.emit('review-added', review);
    });

    socket.on('disconnect', () => {
      console.log(`🔴 User disconnected: ${socket.id}`);
    });
  });
}
