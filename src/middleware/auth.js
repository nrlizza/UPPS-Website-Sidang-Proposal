import User from '../api/user/user.model.js';

// ==================== CEK LOGIN ====================
export function isAuthenticated(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Silakan login terlebih dahulu'
    });
  }
  next();
}

// ==================== CEK ROLE ====================
export function hasRole(roles) {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized'
        });
      }

      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'User tidak ditemukan'
        });
      }

      if (!roles.includes(user.role)) {
        return res.status(403).json({
          success: false,
          error: `Akses ditolak. Role ${user.role} tidak memiliki akses`
        });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}