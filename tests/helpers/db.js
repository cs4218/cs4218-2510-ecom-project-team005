import mongoose from 'mongoose';

export async function connectTestDb() {
  const uri = process.env.MONGO_URL;
  if (!uri) throw new Error('MONGO_URL belum diset (cek .env.test)');
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri);
  }
}

export async function clearTestDb() {
  const { collections } = mongoose.connection;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
}

export async function closeTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
}
