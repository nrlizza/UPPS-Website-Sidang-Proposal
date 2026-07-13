import express from 'express';
import * as controller from './proposal.controller.js';
import { isAuthenticated, hasRole } from '../../middleware/auth.js';
import { uploadProposalFiles } from '../../middleware/upload.js';

const router = express.Router();

// ============ MAHASISWA (Pemohon) ============
router.post(
  '/',
  isAuthenticated,
  hasRole(['pemohon']),
  uploadProposalFiles,
  controller.createProposal
);

router.get(
  '/me',
  isAuthenticated,
  hasRole(['pemohon']),
  controller.getMyProposals
);

// ============ DOSEN PEMBIMBING ============
router.get(
  '/dospem/pending',
  isAuthenticated,
  hasRole(['dosen_pembimbing']),
  controller.getPendingDospem
);

router.put(
  '/:id/approve-dospem',
  isAuthenticated,
  hasRole(['dosen_pembimbing']),
  controller.approveDospem
);

router.put(
  '/:id/reject-dospem',
  isAuthenticated,
  hasRole(['dosen_pembimbing']),
  controller.rejectDospem
);

// ============ ADMIN ============
router.get(
  '/admin/pending',
  isAuthenticated,
  hasRole(['admin']),
  controller.getPendingAdmin
);

router.put(
  '/:id/schedule',
  isAuthenticated,
  hasRole(['admin']),
  controller.scheduleByAdmin
);

router.put(
  '/:id/reject-admin',
  isAuthenticated,
  hasRole(['admin']),
  controller.rejectByAdmin
);

// ============ KAPRODI ============
router.get(
  '/kaprodi/pending',
  isAuthenticated,
  hasRole(['kaprodi']),
  controller.getPendingKaprodi
);

router.put(
  '/:id/approve-kaprodi',
  isAuthenticated,
  hasRole(['kaprodi']),
  controller.approveKaprodi
);

router.put(
  '/:id/reject-kaprodi',
  isAuthenticated,
  hasRole(['kaprodi']),
  controller.rejectKaprodi
);

// ============ SEMUA ROLE ============
router.get(
  '/:id',
  isAuthenticated,
  controller.getProposalDetail
);

// ============ ADMIN & DOSEN (Kaprodi, Admin, Dosen Pembimbing) ============
router.get(
  '/',
  isAuthenticated,
  hasRole(['kaprodi', 'admin', 'dosen_pembimbing']),
  controller.getAllProposals
);

export default router;