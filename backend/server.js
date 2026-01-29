require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/database');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const eventRoutes = require('./routes/events');
const captionRoutes = require('./routes/captions');
const userRoutes = require('./routes/users');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
connectDB();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/captions', captionRoutes);
app.use('/api/users', userRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'LiveSpeak Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO setup
const io = socketIo(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Join event room
  socket.on('join_event', (eventId) => {
    socket.join(`event_${eventId}`);
    console.log(`Client ${socket.id} joined event ${eventId}`);
  });

  // Leave event room
  socket.on('leave_event', (eventId) => {
    socket.leave(`event_${eventId}`);
    console.log(`Client ${socket.id} left event ${eventId}`);
  });

  // Handle new caption
  socket.on('new_caption', (data) => {
    // Broadcast caption to all clients in the event room
    socket.to(`event_${data.eventId}`).emit('caption_received', data);
  });

  // Handle recording status
  socket.on('recording_status', (data) => {
    socket.to(`event_${data.eventId}`).emit('recording_status_update', data);
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler - CORRECTED WILDCARD ROUTE FOR EXPRESS 5
app.use('/{*catchall}', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`LiveSpeak Backend running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
});

module.exports = { app, server, io };
