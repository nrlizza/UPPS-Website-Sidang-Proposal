import * as service from './user.service.js';
import { handleResult, handleError } from '../../utils/handleResponse.js';

// ==================== GET CURRENT USER ====================
export async function getCurrentUser(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User tidak login'
      });
    }

    const result = await service.getUserById(req.user.id);
    handleResult(res, result);
  } catch (error) {
    next(error);
  }
}

// ==================== GET ALL USERS ====================
export async function getAllUsers(req, res, next) {
  try {
    const { role } = req.query;
    const filter = {};
    if (role) filter.role = role;

    const result = await service.getAllUsers(filter);
    handleResult(res, result);
  } catch (error) {
    next(error);
  }
}

// ==================== UPDATE ROLE ====================
export async function updateRole(req, res, next) {
  try {
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        error: 'userId dan role wajib diisi'
      });
    }

    const result = await service.updateRole(userId, role);
    handleResult(res, result);
  } catch (error) {
    next(error);
  }
}

// ==================== UPDATE PROFILE ====================
export async function updateProfile(req, res, next) {
  try {
    const { phone, address, programStudi, nim, nip } = req.body;
    const userId = req.user.id;

    const updateData = {
      profile: {}
    };

    if (phone) updateData.profile.phone = phone;
    if (address) updateData.profile.address = address;
    if (programStudi) updateData.profile.programStudi = programStudi;
    if (nim) updateData.profile.nim = nim;
    if (nip) updateData.profile.nip = nip;

    const result = await service.updateUser(userId, updateData);
    handleResult(res, result);
  } catch (error) {
    next(error);
  }
}