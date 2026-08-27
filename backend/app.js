require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT;

app.use(cors({
    origin: 'https://online-ludo-frontend.onrender.com'
}));
app.use(express.json());
app.use(cookieParser());

const authRoutes = require('./routes/auth.routes');
const gameRoutes = require('./routes/game.routes');
const adminRoutes = require('./routes/admin.routes');

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/auth', authRoutes);
app.use('/game', gameRoutes);
app.use('/admin', adminRoutes);

// Socket.IO setup
const socketAuth = require('./middlewares/socketAuth');
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'https://online-ludo-frontend.onrender.com'
    }
});

io.use(socketAuth);
io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id, 'user:', socket.user.username);

    socket.on('joinGameRoom', (roomCode) => {
        socket.join(roomCode);
        console.log(`${socket.user.username} joined socket room: ${roomCode}`);

        // let everyone else already in the room know someone joined
        socket.to(roomCode).emit('playerConnected', {
            username: socket.user.username
        });
    });

    socket.on('disconnect', () => {
        console.log('Socket disconnected:', socket.id);
    });
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log(`http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.log(err);
  });

module.exports = { io };