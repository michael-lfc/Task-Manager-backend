// import 'dotenv/config';
// import express, { Request, Response } from 'express';
// import http from 'http';
// import { Server } from 'socket.io';

// import cors from 'cors';
// import helmet from 'helmet';
// import morgan from 'morgan';

// import connectDB from './config/db.js';
// import router from './routes/index.js';
// import errorHandler from './middleware/errorHandler.js';
// import logger from './utils/logger.js';

// const app = express();
// const PORT = process.env.PORT || 5000;

// //
// // ─────────────────────────────────────────────
// // 🌐 HTTP SERVER
// // ─────────────────────────────────────────────
// //
// const server = http.createServer(app);

// //
// // ─────────────────────────────────────────────
// // 🔌 SOCKET.IO SETUP
// // ─────────────────────────────────────────────
// //
// export const io = new Server(server, {
//   cors: {
//     origin: process.env.CLIENT_URL || '*',
//     methods: ['GET', 'POST'],
//     credentials: true,
//   },
// });


// io.on('connection', (socket) => {
//   logger.info(`Socket connected: ${socket.id}`)

//   const userId = socket.handshake.auth?.userId

//   console.log('🔍 AUTH DATA:', socket.handshake.auth)

//   if (userId) {
//     socket.join(userId)
//     console.log('✅ JOINED ROOM:', userId)
//   } else {
//     console.log('❌ NO USER ID FOUND')
//   }

//   // ── Join project room ──────────────────────────
//   socket.on('join:project', ({ projectId }: { projectId: string }) => {
//     socket.join(projectId)
//     console.log(`📁 Socket ${socket.id} joined project room: ${projectId}`)
//   })

//   // ── Leave project room ─────────────────────────
//   socket.on('leave:project', ({ projectId }: { projectId: string }) => {
//     socket.leave(projectId)
//     console.log(`📁 Socket ${socket.id} left project room: ${projectId}`)
//   })

//   socket.on('disconnect', () => {
//     logger.info(`Socket disconnected: ${socket.id}`)
//   })
// })

// //
// // ─────────────────────────────────────────────
// // 🔐 MIDDLEWARE
// // ─────────────────────────────────────────────
// //
// app.use(helmet());

// app.use(
//   cors({
//     origin: process.env.CLIENT_URL || '*',
//     credentials: true,
//   })
// );

// app.use(express.json({ limit: '10kb' }));
// app.use(express.urlencoded({ extended: true }));

// //
// // ─────────────────────────────────────────────
// // 📊 LOGGING
// // ─────────────────────────────────────────────
// //
// if (process.env.NODE_ENV === 'development') {
//   app.use(morgan('dev'));
// }

// //
// // ─────────────────────────────────────────────
// // ❤️ HEALTH CHECK
// // ─────────────────────────────────────────────
// //
// app.get('/health', (_req: Request, res: Response) => {
//   res.json({
//     status: 'ok',
//     websocket: 'active',
//     environment: process.env.NODE_ENV,
//   });
// });

// //
// // ─────────────────────────────────────────────
// // 🚏 ROUTES
// // ─────────────────────────────────────────────
// //
// app.use('/api/v1', router);

// //
// // ─────────────────────────────────────────────
// // ❌ 404
// // ─────────────────────────────────────────────
// //
// app.use((req: Request, res: Response) => {
//   res.status(404).json({
//     status: 'fail',
//     message: `Route ${req.originalUrl} not found`,
//   });
// });

// //
// // ─────────────────────────────────────────────
// // ⚠️ ERROR HANDLER
// // ─────────────────────────────────────────────
// //
// app.use(errorHandler);

// //
// // ─────────────────────────────────────────────
// // 🚀 START SERVER
// // ─────────────────────────────────────────────
// //
// const start = async (): Promise<void> => {
//   await connectDB();

//   server.listen(PORT, () => {
//     logger.info(
//       `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
//     );
//   });
// };

// start();

// export default app;

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
// 🌐 HTTP SERVER
// ─────────────────────────────────────────────
//
const server = http.createServer(app);

//
// ─────────────────────────────────────────────
// 🌍 ALLOWED ORIGINS
// ─────────────────────────────────────────────
//
const allowedOrigins = [
  'http://localhost:5173',           // Local dev
  'https://aurum-frontend.vercel.app', // 🔥 REPLACE with your actual Vercel URL
];

//
// ─────────────────────────────────────────────
// 🔌 SOCKET.IO SETUP
// ─────────────────────────────────────────────
//
export const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});


io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id}`)

  const userId = socket.handshake.auth?.userId

  console.log('🔍 AUTH DATA:', socket.handshake.auth)

  if (userId) {
    socket.join(userId)
    console.log('✅ JOINED ROOM:', userId)
  } else {
    console.log('❌ NO USER ID FOUND')
  }

  // ── Join project room ──────────────────────────
  socket.on('join:project', ({ projectId }: { projectId: string }) => {
    socket.join(projectId)
    console.log(`📁 Socket ${socket.id} joined project room: ${projectId}`)
  })

  // ── Leave project room ─────────────────────────
  socket.on('leave:project', ({ projectId }: { projectId: string }) => {
    socket.leave(projectId)
    console.log(`📁 Socket ${socket.id} left project room: ${projectId}`)
  })

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`)
  })
})

//
// ─────────────────────────────────────────────
// 🔐 MIDDLEWARE
// ─────────────────────────────────────────────
//
app.use(helmet());

app.use(
  cors({
    origin: allowedOrigins,
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
// ❌ 404
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