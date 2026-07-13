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
  passport.authenticate('google', {
    failureRedirect: '/login',
    failureMessage: true
  }),
  controller.loginSuccess
);

// ==================== SESSION ====================

// Check session
router.get('/session', controller.checkSession);

// Logout
router.get('/logout', controller.logout);

export default router;