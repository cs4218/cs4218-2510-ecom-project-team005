// jmeter-data/reset-db.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const DATA_DIR   = __dirname;

const read = (p) => fs.readFileSync(p, 'utf8');
const json = (name) => JSON.parse(read(path.join(DATA_DIR, name)));

// --- convert $oid/$date/$binary from mongoexport-style JSON ---
function convert(v) {
  if (v == null) return v;
  if (Array.isArray(v)) return v.map(convert);
  if (typeof v === 'object') {
    if (v.$oid)  return new mongoose.Types.ObjectId(v.$oid);
    if (v.$date) return new Date(v.$date);
    if (v.$binary) return undefined; // we will strip heavy blobs
    const out = {};
    for (const [k,val] of Object.entries(v)) out[k] = convert(val);
    return out;
  }
  return v;
}

// --- tiny CSV parser (header, no quoted commas in your files) ---
function parseCsv(name) {
  const src = read(path.join(DATA_DIR, name)).trim();
  const lines = src.split(/\r?\n/).filter(Boolean);
  const header = lines[0].split(',').map(s=>s.trim());
  return lines.slice(1).map(line => {
    const cols = line.split(',').map(s=>s.trim());
    const row = {};
    header.forEach((h,i)=> row[h]=cols[i] ?? '');
    return row;
  });
}

async function main() {
  // 1) connect
  const mongoUrl = process.env.MONGO_URL;
  if (!mongoUrl) throw new Error('MONGO_URL not set');
  console.log('🔌 Connecting:', mongoUrl);
  await mongoose.connect(mongoUrl);
  console.log('✅ Connected');

  // 2) models
  const Category = (await import('../models/categoryModel.js')).default;
  const Product  = (await import('../models/productModel.js')).default;
  const User     = (await import('../models/userModel.js')).default;
  const Order    = (await import('../models/orderModel.js')).default;

  // 3) wipe
  console.log('🗑️  Clearing collections…');
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
    Order.deleteMany({}),
  ]);

  // 4) load fixtures (and normalize)
  console.log('📥 Loading fixtures…');
  const fxCategories = convert(json('test.categories.json'));
  const fxProducts   = convert(json('test.products.json')).map(p => {
    // Drop heavy photo binary (keeps shape if your code expects the field)
    if (p.photo && p.photo.data) p.photo.data = undefined;
    return p;
  });
  const fxUsers      = convert(json('test.users.json'));
  const fxOrders     = convert(json('test.orders.json'));

  // 5) insert categories
  await Category.collection.insertMany(fxCategories, { ordered: true });
  const cats = await Category.find({}, { _id:1, name:1, slug:1 }).lean();
  const catIdBy = new Map();
  for (const c of cats) {
    if (c.slug) catIdBy.set(String(c.slug).toLowerCase(), c._id);
    if (c.name) catIdBy.set(String(c.name).toLowerCase(), c._id);
    catIdBy.set(String(c._id), c._id);
  }
  console.log(`✅ Categories: ${cats.length}`);

  // 6) insert users from fixtures first
  await User.collection.insertMany(fxUsers, { ordered: true });
  // then ensure CSV users exist/are updated
  const csvLogin = fs.existsSync(path.join(DATA_DIR, 'login-users.csv'))
    ? parseCsv('login-users.csv') : [];
  const csvAdmin = fs.existsSync(path.join(DATA_DIR, 'admin-users.csv'))
    ? parseCsv('admin-users.csv') : [];
  const ensureUsers = async (rows, role) => {
    for (const r of rows) {
      const email = (r.email || '').toLowerCase();
      if (!email) continue;
      const plain = r.password || 'TestPass123';
      const hash  = await bcrypt.hash(plain, 10);
      await User.updateOne(
        { email },
        { $set: { email, password: hash, role: role ?? 0, name: r.name || email.split('@')[0] } },
        { upsert: true }
      );
    }
  };
  await ensureUsers(csvLogin, 0);
  await ensureUsers(csvAdmin, 1);
  const users = await User.find({}, { _id:1, email:1, role:1 }).lean();
  const userIdByEmail = new Map(users.map(u => [u.email.toLowerCase(), u._id]));
  console.log(`✅ Users total: ${users.length} (fixtures + CSV ensured)`);

  // 7) insert products (fix category if given by slug/name)
  const normProducts = fxProducts.map(p => {
    const doc = { ...p };
    if (doc.category && typeof doc.category === 'string') {
      const id = catIdBy.get(doc.category.toLowerCase());
      if (id) doc.category = id;
    }
    return doc;
  });
  await Product.collection.insertMany(normProducts, { ordered: true });
  const prods = await Product.find({}, { _id:1, name:1, slug:1 }).lean();
  const prodIdBy = new Map();
  for (const p of prods) {
    if (p.slug) prodIdBy.set(String(p.slug).toLowerCase(), p._id);
    if (p.name) prodIdBy.set(String(p.name).toLowerCase(), p._id);
    prodIdBy.set(String(p._id), p._id);
  }
  console.log(`✅ Products: ${prods.length}`);

  // 8) insert orders (map buyerEmail/products if needed)
  const normOrders = fxOrders.map(o => {
    const x = { ...o };
    if (x.buyerEmail) {
      const id = userIdByEmail.get(String(x.buyerEmail).toLowerCase());
      if (id) x.buyer = id;
    }
    if (Array.isArray(x.products)) {
      x.products = x.products.map(it => {
        const ii = { ...it };
        if (ii.product && typeof ii.product === 'string') {
          const id = prodIdBy.get(ii.product.toLowerCase());
          if (id) ii.product = id;
        }
        return ii;
      });
    }
    x.createdAt = x.createdAt || new Date();
    x.updatedAt = x.updatedAt || new Date();
    return x;
  });
  await Order.collection.insertMany(normOrders, { ordered: true });
  console.log(`✅ Orders: ${normOrders.length}`);

  console.log('\n🎯 Seed complete. Ready for JMeter.');
  await mongoose.connection.close();
  process.exit(0);
}

main().catch(async (e) => {
  console.error('❌ Seed failed:', e);
  try { await mongoose.connection.close(); } catch {}
  process.exit(1);
});