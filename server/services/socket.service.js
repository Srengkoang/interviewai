const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Join a session room
    socket.on('session:join', ({ sessionId, userId }) => {
      socket.join(sessionId);
      socket.to(sessionId).emit('user:joined', { userId, socketId: socket.id });
      console.log(`User ${userId} joined session ${sessionId}`);
    });

    // Leave session
    socket.on('session:leave', ({ sessionId, userId }) => {
      socket.leave(sessionId);
      socket.to(sessionId).emit('user:left', { userId });
    });

    // Code sync - broadcast code changes to others in session
    socket.on('code:update', ({ sessionId, code, language }) => {
      socket.to(sessionId).emit('code:updated', { code, language });
    });

    // Typing indicator for chat
    socket.on('chat:typing', ({ sessionId }) => {
      socket.to(sessionId).emit('chat:typing');
    });

    // Handle reconnect
    socket.on('session:reconnect', ({ sessionId, userId }) => {
      socket.join(sessionId);
      socket.emit('session:reconnected', { sessionId });
      console.log(`User ${userId} reconnected to session ${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = { setupSocketHandlers };
