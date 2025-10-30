import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert MongoDB JSON export format to JavaScript objects
 * Handles $oid, $date, and $binary fields
 */
function convertMongoJSON(obj) {
  if (obj === null || obj === undefined) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertMongoJSON(item));
  }
  
  if (typeof obj === 'object') {
    // Handle MongoDB $oid
    if (obj.$oid) {
      return new mongoose.Types.ObjectId(obj.$oid);
    }
    
    // Handle MongoDB $date
    if (obj.$date) {
      return new Date(obj.$date);
    }
    
    // Handle MongoDB $binary
    if (obj.$binary) {
      // Convert base64 string to Buffer
      if (obj.$binary.base64) {
        return Buffer.from(obj.$binary.base64, 'base64');
      }
      // Handle hex format if present
      if (obj.$binary.hex) {
        return Buffer.from(obj.$binary.hex, 'hex');
      }
    }
    
    // Recursively convert nested objects
    const converted = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertMongoJSON(value);
    }
    return converted;
  }
  
  return obj;
}

/**
 * Load and parse JSON file with MongoDB format conversion
 */
function loadJSON(filename) {
  const filePath = path.join(__dirname, filename);
  const rawData = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(rawData);
  return convertMongoJSON(parsed);
}

async function resetDatabase() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URL);
    
    // Import models
    const Category = (await import('../models/categoryModel.js')).default;
    const Product = (await import('../models/productModel.js')).default;
    const User = (await import('../models/userModel.js')).default;
    const Order = (await import('../models/orderModel.js')).default;
    
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      Category.deleteMany({}),
      Product.deleteMany({}),
      User.deleteMany({}),
      Order.deleteMany({})
    ]);
    
    console.log('📥 Loading data from JSON files...');
    const categories = loadJSON('test.categories.json');
    const products = loadJSON('test.products.json');
    const users = loadJSON('test.users.json');
    const orders = loadJSON('test.orders.json');
    
    console.log('💾 Inserting data into database...');
    
    // Use MongoDB collection methods directly to bypass Mongoose validation
    // This is needed because test data may not match current validation rules
    
    // Insert categories first (referenced by products)
    await Category.collection.insertMany(categories, { ordered: true });
    console.log(`  ✅ Categories: ${categories.length}`);
    
    // Insert users (referenced by orders)
    await User.collection.insertMany(users, { ordered: true });
    console.log(`  ✅ Users: ${users.length}`);
    
    // Insert products (referenced by orders)
    await Product.collection.insertMany(products, { ordered: true });
    console.log(`  ✅ Products: ${products.length}`);
    
    // Insert orders last (references users and products)
    await Order.collection.insertMany(orders, { ordered: true });
    console.log(`  ✅ Orders: ${orders.length}`);
    
    console.log('\n✅ Database reset complete!');
    
    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    if (error.writeErrors) {
      console.error('Write errors:', error.writeErrors);
    }
    await mongoose.connection.close();
    process.exit(1);
  }
}

resetDatabase();