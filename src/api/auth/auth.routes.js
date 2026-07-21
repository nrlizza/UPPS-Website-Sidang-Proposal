import express from 'express';
import passport from 'passport';
import * as controller from './auth.controller.js';

const router = express.Router();

// ==================== MANUAL LOGIN ====================
router.post('/login', controller.login);

// ==================== GOOGLE OAUTH ====================

// Login dengan Google
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account'
  })
);

// Callback Google OAuth
router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', (err, user, info) => {
      if (err) {
        const msg = encodeURIComponent(err.message || 'Terjadi kesalahan saat login');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=${msg}`);
      }
      if (!user) {
        const msg = info && info.message ? encodeURIComponent(info.message) : 'Autentikasi gagal';
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=${msg}`);
      }
      req.logIn(user, (loginErr) => {
        if (loginErr) return next(loginErr);
        // Pass session to frontend via redirect
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/google/success`);
      });
    })(req, res, next);
  }
);

// ==================== SESSION ====================

// Check session
router.get('/session', controller.checkSession);

// Logout
router.get('/logout', controller.logout);

export default router;