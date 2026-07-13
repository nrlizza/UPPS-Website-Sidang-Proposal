import express from 'express';
import * as controller from './user.controller.js';
import { isAuthenticated, hasRole } from '../../middleware/auth.js';

const router = express.Router();

// Get current user (semua role)
router.get(
  '/me',
  isAuthenticated,
  controller.getCurrentUser
);

// Update profile (semua role)
router.put(
  '/profile',
  isAuthenticated,
  controller.updateProfile
);

// Get all users (hanya kaprodi & upps)
router.get(
  '/',
  isAuthenticated,
  hasRole(['kaprodi', 'admin']),
  controller.getAllUsers
);

// Update role (hanya kaprodi)
router.put(
  '/role',
  isAuthenticated,
  hasRole(['kaprodi']),
  controller.updateRole
);

export default router;