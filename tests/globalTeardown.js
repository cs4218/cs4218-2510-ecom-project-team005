import { MongoMemoryServer } from 'mongodb-memory-server';
import config from './config.js';

export default async function globalTeardown() {
  const instance = global.__MONGOINSTANCE;
  if (instance) {
    await instance.stop();
  }
}

