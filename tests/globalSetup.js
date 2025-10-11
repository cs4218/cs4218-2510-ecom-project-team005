import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import config from './config.js';

export default async function globalSetup() {
  if (config.Memory) { 
    const instance = await MongoMemoryServer.create();
    const uri = instance.getUri();
    global.__MONGOINSTANCE = instance;
    process.env.MONGO_URL = uri.slice(0, uri.lastIndexOf('/'));
  } else {
    process.env.MONGO_URL = `mongodb://${config.IP}:${config.Port}`;
  }

  // Store the connection string for tests to use
  process.env.MONGO_URL = `${process.env.MONGO_URL}/${config.Database}`;
}
