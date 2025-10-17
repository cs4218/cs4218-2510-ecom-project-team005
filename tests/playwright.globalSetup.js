import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const TEMP_DIR = '.playwright-temp';
const URI_FILE = 'mongo-uri.txt';

export default async function globalSetup() {
  console.log('🚀 Starting MongoDB Memory Server for E2E tests...');
  
  // Create and start MongoDB Memory Server
  const instance = await MongoMemoryServer.create();
  const uri = instance.getUri();
  
  global.__MONGOINSTANCE__ = instance;
  console.log(`✅ MongoDB Memory Server started at: ${uri}`);
  
  // Write URI to file for webServer to read
  const tempDir = path.join(process.cwd(), TEMP_DIR);
  fs.mkdirSync(tempDir, { recursive: true });
  fs.writeFileSync(path.join(tempDir, URI_FILE), uri);
  
  // Seed test data
  await mongoose.connect(uri);
  console.log('🌱 Seeding test data...');
  
  try {
    const { seedAll } = await import('./helpers/testDataSeeder.js');
    await seedAll();
    console.log('✅ Test data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

