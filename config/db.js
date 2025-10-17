import mongoose from "mongoose";
import colors from "colors";
import fs from "fs";
import path from "path";

const URI_FILE = '.playwright-temp/mongo-uri.txt';
const WAIT_TIMEOUT = 30000;
// AI was used here, Tool: Cursor, Prompt: Help me setup Mongodb-memory-server for playwright
// Wait for MongoDB URI file to be created by Playwright globalSetup
async function waitForMongoUri() {
    const filePath = path.join(process.cwd(), URI_FILE);
    let waited = 0;
    
    console.log('⏳ Waiting for test database setup...'.bgYellow.black);
    
    while (!fs.existsSync(filePath) && waited < WAIT_TIMEOUT) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waited += 100;
    }
    
    if (!fs.existsSync(filePath)) {
        throw new Error('Timeout waiting for MongoDB test setup');
    }
    
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