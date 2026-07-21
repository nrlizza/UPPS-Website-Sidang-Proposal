const express = require('express');
const router = express.Router();
const { isAuthenticated, isRole } = require('../middleware/auth');
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

function getAxiosConfig(req, additionalHeaders = {}) {
  return {
    headers: {
      Cookie: req.session.user?.backendCookie || '',
      ...additionalHeaders
    }
  };
}

// GET — tampilkan form data pendaftaran
router.get('/baru', isAuthenticated, isRole(['pemohon', 'mahasiswa']), (req, res) => {
  res.render('dashboard/pemohon/pengajuan-baru', {
    title: 'Formulir Pendaftaran Sidang',
    user: req.session.user,
    currentPath: req.originalUrl
  });
});

// GET — tampilkan halaman konfirmasi (redirect ke SPA)
router.get('/baru/konfirmasi', isAuthenticated, isRole(['pemohon', 'mahasiswa']), (req, res) => {
  res.redirect('/dashboard/pemohon/pengajuan/baru');
});

// GET — tampilkan halaman detail (redirect ke SPA)
router.get('/baru/detail', isAuthenticated, isRole(['pemohon', 'mahasiswa']), (req, res) => {
  res.redirect('/dashboard/pemohon/pengajuan/baru');
});

module.exports = router;