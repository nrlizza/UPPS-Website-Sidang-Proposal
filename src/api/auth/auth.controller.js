import User from '../user/user.model.js';
import { handleResult } from '../../utils/handleResponse.js';

// ==================== MANUAL LOGIN ====================
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email dan password wajib diisi'
      });
    }

    // Cari user dan sertakan password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email atau password salah'
      });
    }

    // Cek status aktif
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        error: 'Akun Anda tidak aktif'
      });
    }

    // Verifikasi password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Email atau password salah'
      });
    }

    // Login via passport local session (manually set req.user)
    req.login(user, (err) => {
      if (err) return next(err);

      // Jangan kirim password kembali
      user.password = undefined;

      res.status(200).json({
        success: true,
        message: 'Login berhasil',
        data: user
      });
    });
  } catch (error) {
    next(error);
  }
}

// ==================== GOOGLE LOGIN SUCCESS ====================
export function loginSuccess(req, res) {
  if (req.user) {
    res.status(200).json({
      success: true,
      message: 'Login dengan Google berhasil',
      data: req.user
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Autentikasi gagal'
    });
  }
}

// ==================== CHECK SESSION ====================
export function checkSession(req, res) {
  if (req.isAuthenticated()) {
    res.status(200).json({
      success: true,
      data: req.user
    });
  } else {
    res.status(401).json({
      success: false,
      error: 'Sesi telah berakhir atau tidak valid'
    });
  }
}

// ==================== LOGOUT ====================
export function logout(req, res, next) {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('connect.sid'); // nama default cookie express-session
      res.status(200).json({
        success: true,
        message: 'Logout berhasil'
      });
    });
  });
}
