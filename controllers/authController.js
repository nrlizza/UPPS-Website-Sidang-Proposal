const { validationResult } = require('express-validator');
const axios = require('axios');

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000/api';

const ROLE_REDIRECT = {
  pemohon: '/dashboard/pemohon',
  mahasiswa: '/dashboard/pemohon',
  kaprodi: '/dashboard/kaprodi',
  admin: '/dashboard/admin',
  dosen_pembimbing: '/dashboard/dosen'
};

exports.getLogin = (req, res) => {
  if (req.query.error) {
    req.flash('error', req.query.error);
    return res.redirect('/login');
  }
  if (req.session.user) {
    return res.redirect(ROLE_REDIRECT[req.session.user.role] || '/');
  }
  res.render('auth/login', {
    title: 'Login - SIKA',
    error: res.locals.error,
    email: ''
  });
};

exports.postLogin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash('error', errors.array()[0].msg);
      return res.render('auth/login', {
        title: 'Login - SIKA',
        error: req.flash('error'),
        email: req.body.email
      });
    }

    const { email, password } = req.body;
    
    // Autentikasi ke Backend
    const response = await axios.post(`${BACKEND_URL}/auth/login`, {
      email,
      password
    });

    if (response.data.success) {
      const userData = response.data.data;
      
      // Ambil header set-cookie (connect.sid dari backend)
      const setCookieHeader = response.headers['set-cookie'];
      let backendCookie = '';
      if (setCookieHeader && setCookieHeader.length > 0) {
        backendCookie = setCookieHeader[0].split(';')[0]; // simpan connect.sid
      }

      // Set session lokal di frontend
      req.session.user = {
        id: userData._id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        nim: userData.profile?.nim || '',
        programStudi: userData.profile?.programStudi || '',
        backendCookie: backendCookie // Simpan token sesi backend untuk request axios
      };

      // Redirect based on role
      return res.redirect(ROLE_REDIRECT[userData.role] || '/');
    }

  } catch (err) {
    console.error('Login error:', err.response?.data || err.message);
    let errorMsg = err.response?.data?.error || 'Email atau password salah';
    if (typeof errorMsg === 'object') {
      errorMsg = errorMsg.message || JSON.stringify(errorMsg);
    }
    req.flash('error', errorMsg);
    return res.render('auth/login', {
      title: 'Login - SIKA',
      error: req.flash('error'),
      email: req.body.email
    });
  }
};

exports.googleSuccess = async (req, res) => {
  try {
    let backendCookie = '';
    
    // First try to grab the cookie from req.headers.cookie (for localhost)
    const cookies = req.headers.cookie ? req.headers.cookie.split(';') : [];
    for (const c of cookies) {
      if (c.trim().startsWith('api.sid=')) {
        backendCookie = c.trim();
      }
    }
    
    // In cross-domain Vercel deploy, we get the SID from the query string
    if (!backendCookie && req.query.sid) {
      // req.query.sid is the signed session ID (e.g. s:...)
      backendCookie = `api.sid=${req.query.sid}`;
    }

    const response = await axios.get(`${BACKEND_URL}/auth/session`, {
      headers: { 
        Cookie: backendCookie,
        'x-session-id': req.query.sid || '' // Send custom header for backend to intercept
      }
    });

    if (response.data.success) {
      const userData = response.data.data;
      req.session.user = {
        id: userData._id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        nim: userData.profile?.nim || '',
        programStudi: userData.profile?.programStudi || '',
        backendCookie: backendCookie
      };

      return res.redirect(ROLE_REDIRECT[userData.role] || '/');
    } else {
      req.flash('error', 'Sesi tidak valid');
      return res.redirect('/login');
    }
  } catch (err) {
    console.error('Google success error:', err.message);
    req.flash('error', 'Gagal memverifikasi sesi Google');
    return res.redirect('/login');
  }
};

exports.logout = async (req, res) => {
  try {
    if (req.session && req.session.user && req.session.user.backendCookie) {
      await axios.get(`${BACKEND_URL}/auth/logout`, {
        headers: { Cookie: req.session.user.backendCookie }
      });
    }
  } catch (err) {
    console.error('Logout backend error:', err.message);
  }

  // Clear session for cookie-session
  req.session = null;
  res.redirect('/login');
};