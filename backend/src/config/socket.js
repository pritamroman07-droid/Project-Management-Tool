const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Track online users: userId -> socketId
const onlineUsers = new Map();

const initSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication error'));

      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    onlineUsers.set(userId, socket.id);

    // Broadcast online status
    socket.broadcast.emit('user:online', { userId });
    io.emit('users:online_list', Array.from(onlineUsers.keys()));

    // Join user's personal room for notifications
    socket.join(`user:${userId}`);

    // Join a project room for real-time project updates
    socket.on('project:join', (projectId) => {
      socket.join(`project:${projectId}`);
    });

    socket.on('project:leave', (projectId) => {
      socket.leave(`project:${projectId}`);
    });

    // Kanban reorder event
    socket.on('kanban:reorder', (data) => {
      socket.to(`project:${data.projectId}`).emit('kanban:reorder', data);
    });

    // Task events - broadcast to project room
    socket.on('task:update', (data) => {
      socket.to(`project:${data.projectId}`).emit('task:update', data);
    });

    // Typing indicator for comments
    socket.on('comment:typing', (data) => {
      socket.to(`project:${data.projectId}`).emit('comment:typing', {
        ...data,
        user: { _id: userId, name: socket.user.name, avatar: socket.user.avatar },
      });
    });

    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      socket.broadcast.emit('user:offline', { userId });
      io.emit('users:online_list', Array.from(onlineUsers.keys()));
    });
  });

  return io;
};

module.exports = { initSocket };
