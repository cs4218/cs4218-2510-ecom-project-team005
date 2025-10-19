import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import Category from '../../models/categoryModel.js';
import Product  from '../../models/productModel.js';
import User     from '../../models/userModel.js';
import Order    from '../../models/orderModel.js';

export async function clearDatabase() {
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
    Order.deleteMany({})
  ]);
}

export async function seedCategories() {
  return Category.insertMany([
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Clothing', slug: 'clothing' },
    { name: 'Books', slug: 'books' },
  ]);
}

export async function seedProducts(categories) {
  return Product.insertMany([
    {
      name: 'Laptop',
      slug: 'laptop',
      description: 'A powerful laptop',
      price: 1499.99,
      category: categories[0]._id,
      quantity: 30,
      shipping: true
    },
    {
      name: 'Smartphone',
      slug: 'smartphone',
      description: 'A high-end smartphone',
      price: 999.99,
      category: categories[0]._id,
      quantity: 50,
      shipping: false
    },
  ]);
}

export async function seedUsers() {
  const hash = await bcrypt.hash('password123', 10);
  return User.insertMany([
    {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439011'), // harus sama dengan token user
      name: 'CS 4218 Test Account',
      email: 'cs4218@test.com',
      password: hash,
      phone: '81234567',
      address: '1 Computing Drive',
      answer: 'password is cs4218@test.com',
      role: 0
    },
    {
      _id: new mongoose.Types.ObjectId('507f1f77bcf86cd799439012'), // admin
      name: 'MyAdmin',
      email: 'admin@admin.com',
      password: hash,
      phone: '81234567',
      address: "admin's address",
      answer: 'Leetcoding',
      role: 1
    }
  ]);}

function pickEnum(enumArr, preferredList = []) {
  if (!Array.isArray(enumArr) || enumArr.length === 0) return null;
  const lower = enumArr.map(e => String(e).toLowerCase());
  for (const cand of preferredList) {
    const idx = lower.indexOf(String(cand).toLowerCase());
    if (idx >= 0) return enumArr[idx]; 
  }
  return enumArr[0];
}

export async function seedOrders(users, products) {
  const user = users.find(u => u.email === 'cs4218@test.com') || users[1];

  const statusEnum = Order.schema.path('status')?.options?.enum || [];


  const status1 = pickEnum(statusEnum, ['processing', 'pending', 'not processed', 'created']);
  const status2 = pickEnum(statusEnum, ['shipped', 'delivered', 'completed', 'fulfilled']) || status1;

  const o1 = await Order.create({
    user: user._id,
    items: [{ product: products[0]._id, quantity: 1 }],
    ...(status1 ? { status: status1 } : {}), 
    payment: { success: true, transactionId: 't1' }
  });

  const o2 = await Order.create({
    user: user._id,
    items: [{ product: (products[1]?._id || products[0]._id), quantity: 2 }],
    ...(status2 ? { status: status2 } : {}),
    payment: { success: true, transactionId: 't2' }
  });

  return [o1, o2];
}

export async function seedAll() {
  await clearDatabase();
  const categories = await seedCategories();
  const products   = await seedProducts(categories);
  const users      = await seedUsers();
  const orders     = await seedOrders(users, products);
  return { categories, products, users, orders };
}
