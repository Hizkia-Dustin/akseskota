import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import expressPath from 'path';
import { env } from './config/env';
import { uploadsDirectory } from './middlewares/upload';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import { prisma } from './config/prisma';

import authRoutes from './modules/auth/auth.routes';
import usersRoutes from './modules/users/users.routes';
import routesRoutes from './modules/routes/routes.routes';
import roadSegmentsRoutes from './modules/roadSegments/roadSegments.routes';
import obstaclesRoutes from './modules/obstacles/obstacles.routes';
import facilitiesRoutes from './modules/facilities/facilities.routes';
import reportsRoutes from './modules/reports/reports.routes';
import moderatorRoutes from './modules/moderator/moderator.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import adminRoutes from './modules/admin/admin.routes';
import communityPlacesRoutes from './modules/communityPlaces/communityPlaces.routes';

const app = express();

// Railway/Render/Vercel-style proxies terminate HTTPS before forwarding the
// request. Trust one proxy hop so secure URLs and IP-based rate limits work.
app.set('trust proxy', 1);
app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Requests without Origin include health checks and server-to-server calls.
      if (!origin || env.clientUrls.includes(origin.replace(/\/$/, ''))) {
        return callback(null, true);
      }
      return callback(new Error(`Origin tidak diizinkan oleh CORS: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(expressPath.resolve(uploadsDirectory)));
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return res.status(200).json({
      success: true,
      message: 'AksesKota API is running',
      database: 'connected',
    });
  } catch (error) {
    console.error('[Health Check] Database unavailable', error);
    const errorText = error instanceof Error ? error.message : String(error);
    const databaseError = /P1011|TLS|certificate/i.test(errorText)
      ? 'tls'
      : /P1000|authentication|access denied/i.test(errorText)
        ? 'authentication'
        : /P1001|reach database|connect timed out|connection refused/i.test(errorText)
          ? 'unreachable'
          : /P1013|database string|connection string|invalid.*url/i.test(errorText)
            ? 'configuration'
            : 'unknown';
    return res.status(503).json({
      success: false,
      message: 'AksesKota API aktif, tetapi database belum tersambung.',
      database: 'unavailable',
      databaseError,
    });
  }
});

// API modules — mapping follows Feature Specification section 7 / System
// Architecture section 11.
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/routes', routesRoutes);
app.use('/api/road-segments', roadSegmentsRoutes);
app.use('/api/obstacles', obstaclesRoutes);
app.use('/api/facilities', facilitiesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/moderator', moderatorRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/community-places', communityPlacesRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

// Vercel detects this file as an Express entrypoint and invokes the exported
// app as a serverless function. The named export remains available to the
// local long-running server in src/server.ts.
export default app;
