import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Nama wajib diisi'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email wajib diisi'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      // required tidak diset true karena user bisa login via google oauth yang tidak memiliki password
      select: false // jangan sertakan password saat query user secara default
    },
    role: {
      type: String,
      enum: ['pemohon', 'dosen_pembimbing', 'kaprodi', 'admin'],
      default: 'pemohon',
      required: true
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true
    },
    profile: {
      nim: { type: String, unique: true, sparse: true },
      nip: { type: String, unique: true, sparse: true },
      phone: { type: String, default: '' },
      address: { type: String, default: '' },
      programStudi: { type: String, default: '' },
      jabatan: { type: String, default: '' }
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });

// Hash password sebelum di-save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method verifikasi password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);
export default User;