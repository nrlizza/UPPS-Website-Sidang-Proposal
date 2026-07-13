import User from './user.model.js';
import { formatResult } from '../../utils/formatResult.js';

// ==================== GET ALL USERS ====================
export async function getAllUsers(filter = {}) {
  const result = await User.find(filter)
    .select('-__v')
    .sort({ createdAt: -1 });

  return formatResult(result, 'getAll');
}

// ==================== GET USER BY ID ====================
export async function getUserById(id) {
  const result = await User.findById(id).select('-__v');
  return formatResult(result, 'getOne');
}

// ==================== GET USER BY EMAIL ====================
export async function getUserByEmail(email) {
  const result = await User.findOne({ email });
  return formatResult(result, 'getOne');
}

// ==================== GET USER BY GOOGLE ID ====================
export async function getUserByGoogleId(googleId) {
  const result = await User.findOne({ googleId });
  return formatResult(result, 'getOne');
}

// ==================== CREATE USER ====================
export async function createUser(data) {
  const user = new User(data);
  const result = await user.save();
  return formatResult(result, 'getOne');
}

// ==================== UPDATE USER ====================
export async function updateUser(id, data) {
  const result = await User.findByIdAndUpdate(
    id,
    data,
    { new: true, runValidators: true }
  );
  return formatResult(result, 'getOne');
}

// ==================== UPDATE ROLE ====================
export async function updateRole(userId, role) {
  const validRoles = ['mahasiswa', 'dospem', 'kaprodi', 'upps'];
  if (!validRoles.includes(role)) {
    return {
      success: false,
      message: 'Role tidak valid'
    };
  }

  const result = await User.findByIdAndUpdate(
    userId,
    { role },
    { new: true, runValidators: true }
  );

  if (!result) {
    return {
      success: false,
      message: 'User tidak ditemukan'
    };
  }

  return formatResult(result, 'getOne');
}

// ==================== GET DOSEN PEMBIMBING ====================
export async function getDospem() {
  const result = await User.find({ role: 'dospem', isActive: true });
  return formatResult(result, 'getAll');
}

// ==================== GET KAPRODI ====================
export async function getKaprodi() {
  const result = await User.find({ role: 'kaprodi', isActive: true });
  return formatResult(result, 'getAll');
}

// ==================== GET UPPS ====================
export async function getUpps() {
  const result = await User.find({ role: 'upps', isActive: true });
  return formatResult(result, 'getAll');
}