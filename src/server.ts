import 'dotenv/config';
import express, { Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';

import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import connectDB from './config/db.js';
import router from './routes/index.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 5000;

//
// ─────────────────────────────────────────────
// 🌐 HTTP SERVER (required for socket.io)
// ─────────────────────────────────────────────
//
const server = http.createServer(app);

//
// ─────────────────────────────────────────────
// 🔌 SOCKET.IO SETUP
// ─────────────────────────────────────────────
//
export const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ⚡ better structure (still simple but cleaner)
interface OnlineUsers {
  [userId: string]: string;
}

const onlineUsers: OnlineUsers = {};

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  socket.on('join', (userId: string) => {
    onlineUsers[userId] = socket.id;
    socket.join(userId);
  });

  socket.on('disconnect', () => {
    const userId = Object.keys(onlineUsers).find(
      (key) => onlineUsers[key] === socket.id
    );

    if (userId) {
      delete onlineUsers[userId];
    }

    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

//
// ─────────────────────────────────────────────
// 🔐 MIDDLEWARE
// ─────────────────────────────────────────────
//
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

//
// ─────────────────────────────────────────────
// 📊 LOGGING
// ─────────────────────────────────────────────
//
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

//
// ─────────────────────────────────────────────
// ❤️ HEALTH CHECK
// ─────────────────────────────────────────────
//
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    websocket: 'active',
    environment: process.env.NODE_ENV,
  });
});

//
// ─────────────────────────────────────────────
// 🚏 ROUTES
// ─────────────────────────────────────────────
//
app.use('/api/v1', router);

//
// ─────────────────────────────────────────────
// ❌ 404 HANDLER
// ─────────────────────────────────────────────
//
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found`,
  });
});

//
// ─────────────────────────────────────────────
// ⚠️ ERROR HANDLER
// ─────────────────────────────────────────────
//
app.use(errorHandler);

//
// ─────────────────────────────────────────────
// 🚀 START SERVER
// ─────────────────────────────────────────────
//
const start = async (): Promise<void> => {
  await connectDB();

  server.listen(PORT, () => {
    logger.info(
      `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
    );
  });
};

start();

export default app;