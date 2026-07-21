import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './api/user/user.model.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function seed() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI tidak ditemukan di .env');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected to Atlas');
    
    const users = [
      {
        email: 'admin@test.com',
        password: 'password123',
        name: 'Admin Test',
        role: 'admin'
      },
      {
        email: 'kaprodi@test.com',
        password: 'password123',
        name: 'Kaprodi Test',
        role: 'kaprodi'
      },
      {
        email: 'dospem@test.com',
        password: 'password123',
        name: 'Dosen Pembimbing Test',
        role: 'dosen_pembimbing'
      }
    ];
    
    for (const userData of users) {
      // Cek apakah sudah ada
      const exists = await User.findOne({ email: userData.email });
      if (!exists) {
        const user = new User(userData);
        await user.save();
        console.log(`👤 User created: ${user.email} (${user.role}) - Password: password123`);
      } else {
        console.log(`ℹ️ User sudah ada: ${userData.email}`);
      }
    }
    
    console.log('✅ Seed dummy users completed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error seeding:', err);
    process.exit(1);
  }
}

seed();
