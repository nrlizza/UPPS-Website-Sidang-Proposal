import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { findOrCreateUser } from '../api/auth/auth.service.js';

dotenv.config();

// ==================== PASSPORT ====================
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const { getUserById } = await import('../api/user/user.service.js');
    const result = await getUserById(id);
    done(null, result.data || null);
  } catch (error) {
    done(error, null);
  }
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        const result = await findOrCreateUser(profile);
        if (result.success) {
          return done(null, result.data);
        } else {
          return done(new Error(result.error), null);
        }
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// ==================== MULTER (Cloudinary / Local Fallback) ====================
let storage;

if (process.env.CLOUDINARY_CLOUD_NAME) {
  // Gunakan Cloudinary jika .env sudah diatur
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'upps_drafts',
      resource_type: 'auto', // Mendukung PDF, DOCX, Images
      public_id: (req, file) => 'draft-' + Date.now() + '-' + Math.round(Math.random() * 1e9),
    },
  });
} else {
  // Fallback ke penyimpanan lokal jika .env belum ada
  const uploadDir = 'src/uploads/drafts';
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, `draft-${uniqueSuffix}${ext}`);
    }
  });
}

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file PDF dan DOCX yang diperbolehkan'), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

// ==================== EXPORT ====================
export { passport, upload };