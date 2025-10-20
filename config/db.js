import mongoose from "mongoose";
import colors from "colors";
import fs from "fs";
import path from "path";

const WAIT_TIMEOUT = 30000;
// AI was used here, Tool: Cursor, Prompt: Help me setup Mongodb-memory-server for playwright
// Wait for MongoDB URI file to be created by Playwright globalSetup
async function waitForMongoUri() {
    const filePath = path.join(process.cwd(), '.playwright-temp', 'mongo-uri.txt');
    let waited = 0;

    console.log('⏳ Waiting for test database setup...'.bgYellow.black);
    console.log(`   Looking for file at: ${filePath}`);
    console.log(`   Current working directory: ${process.cwd()}`);
    console.log(`   Platform: ${process.platform}`);

    while (!fs.existsSync(filePath) && waited < WAIT_TIMEOUT) {
        if (waited % 5000 === 0 && waited > 0) {
            console.log(`   Still waiting... (${waited}ms elapsed)`);
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        waited += 100;
    }

    if (!fs.existsSync(filePath)) {
        console.error('❌ Timeout waiting for MongoDB test setup');
        console.error(`   Expected file at: ${filePath}`);
        console.error(`   File does not exist after ${WAIT_TIMEOUT}ms`);
        throw new Error('Timeout waiting for MongoDB test setup');
    }

    console.log(`✅ Found MongoDB URI file after ${waited}ms`);
    return fs.readFileSync(filePath, 'utf8').trim();
}

const connectDB = async () => {
    try {
        const mongoUrl = process.env.NODE_ENV === 'test'
            ? await waitForMongoUri()
            : process.env.MONGO_URL;

        const conn = await mongoose.connect(mongoUrl);
        console.log(`Connected To Mongodb Database ${conn.connection.host}`.bgMagenta.white);
    } catch (error) {
        console.log(`Error in Mongodb ${error}`.bgRed.white);
    }
};

export default connectDB;