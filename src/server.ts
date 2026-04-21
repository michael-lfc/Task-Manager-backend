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
const PORT = process.env.PORT ?? 5000;

//
// ─────────────────────────────────────────────
// 🌐 CREATE HTTP SERVER (IMPORTANT FOR SOCKET.IO)
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
    origin: process.env.CLIENT_URL ?? 'http://localhost:3000',
    credentials: true,
  },
});

// store online users
const onlineUsers = new Map<string, string>();

io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`);

  // user joins their personal room
  socket.on('join', (userId: string) => {
    onlineUsers.set(userId, socket.id);
    socket.join(userId);
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }

    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

//
// ─────────────────────────────────────────────
// 🔐 SECURITY MIDDLEWARE
// ─────────────────────────────────────────────
//
app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL ?? 'http://localhost:3000',
    credentials: true,
  })
);

//
// ─────────────────────────────────────────────
// 🚦 RATE LIMITING
// ─────────────────────────────────────────────
//
const requestCounts = new Map<
  string,
  { count: number; resetTime: number }
>();

const rateLimiter = (req: Request, res: Response, next: any) => {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const max = 100;

  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return next();
  }

  if (record.count >= max) {
    return res.status(429).json({
      status: 'fail',
      message: 'Too many requests, please try again later.',
    });
  }

  record.count++;
  next();
};

app.use('/api', rateLimiter);

//
// ─────────────────────────────────────────────
// 📦 BODY PARSING
// ─────────────────────────────────────────────
//
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

//
// ─────────────────────────────────────────────
// 🧹 NOSQL SANITIZER
// ─────────────────────────────────────────────
//
app.use((req: Request, _res: Response, next) => {
  const sanitize = (obj: Record<string, unknown>) => {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.params) sanitize(req.params as Record<string, unknown>);

  next();
});

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
  res.status(200).json({
    status: 'ok',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

//
// ─────────────────────────────────────────────
// 🚏 ROUTES
// ─────────────────────────────────────────────
//
app.use('/api/v1', router);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'fail',
    message: `Route ${req.originalUrl} not found.`,
  });
});

//
// ─────────────────────────────────────────────
// ⚠️ GLOBAL ERROR HANDLER
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