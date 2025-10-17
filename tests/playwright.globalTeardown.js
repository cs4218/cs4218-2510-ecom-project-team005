import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

export default async function globalTeardown() {
  console.log('🧹 Cleaning up after E2E tests...');
  
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  
  if (global.__MONGOINSTANCE) {
    await global.__MONGOINSTANCE.stop();
  }
  
  const tempDir = path.join(process.cwd(), '.playwright-temp');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
  
  console.log('✅ Cleanup complete');
}

