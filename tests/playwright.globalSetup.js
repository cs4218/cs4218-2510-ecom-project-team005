import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

const TEMP_DIR = '.playwright-temp';
const URI_FILE = 'mongo-uri.txt';


/*
AI was used for creating this file, tool: cursor, prompt: How can I make the file-paths work for both mac and windows
 */
export default async function globalSetup() {
    console.log('🚀 Starting MongoDB Memory Server for E2E tests...');
    console.log(`   Platform: ${process.platform}`);
    console.log(`   Working directory: ${process.cwd()}`);

    // Create and start MongoDB Memory Server
    const instance = await MongoMemoryServer.create();
    const uri = instance.getUri();

    global.__MONGOINSTANCE__ = instance;
    console.log(`✅ MongoDB Memory Server started at: ${uri}`);

    // Write URI to file for webServer to read
    const tempDir = path.join(process.cwd(), TEMP_DIR);
    const uriFilePath = path.join(tempDir, URI_FILE);

    console.log(`📁 Creating temp directory: ${tempDir}`);
    fs.mkdirSync(tempDir, { recursive: true });

    console.log(`📝 Writing URI to file: ${uriFilePath}`);
    fs.writeFileSync(uriFilePath, uri);

    // Verify file was written
    if (fs.existsSync(uriFilePath)) {
        console.log(`✅ URI file created successfully`);
        console.log(`   Content: ${fs.readFileSync(uriFilePath, 'utf8')}`);
    } else {
        console.error(`❌ Failed to create URI file at: ${uriFilePath}`);
    }

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