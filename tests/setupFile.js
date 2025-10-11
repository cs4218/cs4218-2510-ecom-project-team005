import mongoose from 'mongoose';
import config from './config.js';

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URL);
});

afterAll(async () => {
  await mongoose.disconnect();
});
