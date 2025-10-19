// tests/setupFile.js
import mongoose from 'mongoose';

// di titik ini, globalSetup sudah set MONGO_URL
beforeAll(async () => {
  const uri = process.env.MONGO_URL;
  if (!uri) throw new Error('MONGO_URL tidak tersedia (cek globalSetup/config.js)');
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
});

afterAll(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.dropDatabase();
    }
  } catch {}
  await mongoose.disconnect();
});
