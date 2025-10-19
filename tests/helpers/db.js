import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URL;
  await mongoose.connect(uri, { dbName: 'ecom_ms2_test' });
}

export async function clearDB() {
  const collections = await mongoose.connection.db.collections();
  for (const c of collections) await c.deleteMany({});
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
