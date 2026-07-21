import express from 'express';
import session from 'express-session';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { passport } from './config/passport.config.js';
import connectDB from './config/db.config.js';

// Import routes
import authRoutes from './api/auth/auth.routes.js';
import userRoutes from './api/user/user.routes.js';
import proposalRoutes from './api/proposal/proposal.routes.js';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// ==================== DATABASE ====================
connectDB();

// ==================== MIDDLEWARE ====================
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'x-backend-cookie']
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==================== STATIC FILES ====================
app.use('/src/uploads', express.static('src/uploads'));

// ==================== SESSION ====================
// Intercept custom x-backend-cookie header for direct browser uploads
app.use((req, res, next) => {
  if (req.headers['x-backend-cookie']) {
    req.headers.cookie = req.headers['x-backend-cookie'];
  }
  next();
});

app.use(session({
  name: 'api.sid',
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 1 hari
  }
}));

// ==================== PASSPORT ====================
app.use(passport.initialize());
app.use(passport.session());

// ==================== ROUTES ====================
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Sidang API Server',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      user: '/api/user',
      proposal: '/api/proposal'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/proposal', proposalRoutes);

// ==================== ERROR HANDLING ====================
app.use(notFound);
app.use(errorHandler);

export default app;