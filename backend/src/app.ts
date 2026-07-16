import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';

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

export const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientUrl, // Next.js frontend
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

app.get('/health', (_req, res) => res.status(200).json({ success: true, message: 'AksesKota API is running' }));

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

app.use(notFoundHandler);
app.use(errorHandler);
