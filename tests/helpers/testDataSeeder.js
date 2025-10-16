import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

export async function clearDatabase() {
  // Import models to ensure they're registered
  const { default: Category } = await import('../../models/categoryModel.js');
  const { default: Product } = await import('../../models/productModel.js');
  const { default: User } = await import('../../models/userModel.js');
  const { default: Order } = await import('../../models/orderModel.js');
  
  // Clear all collections using models
  await Promise.all([
    Category.deleteMany({}),
    Product.deleteMany({}),
    User.deleteMany({}),
    Order.deleteMany({})
  ]);
}

export async function seedCategories() {
  const { default: Category } = await import('../../models/categoryModel.js');
  return await Category.insertMany([
    { name: 'Electronics', slug: 'electronics' },
    { name: 'Clothing', slug: 'clothing' },
    { name: 'Books', slug: 'books' },
    { name: 'Home & Garden', slug: 'home-garden' }
  ]);
}

export async function seedProducts(categories) {
  const { default: Product } = await import('../../models/productModel.js');
  return await Product.insertMany([
    // Electronics products (8 total - for testing pagination)
    {
      name: 'Laptop',
      slug: 'laptop',
      description: 'High-performance laptop for professionals and gamers',
      price: 999,
      category: categories[0]._id,
      quantity: 10,
      shipping: true
    },
    {
      name: 'Smartphone',
      slug: 'smartphone',
      description: 'Latest smartphone with amazing camera',
      price: 799,
      category: categories[0]._id,
      quantity: 15,
      shipping: true
    },
    {
      name: 'Tablet',
      slug: 'tablet',
      description: 'Portable tablet for work and entertainment',
      price: 499,
      category: categories[0]._id,
      quantity: 12,
      shipping: true
    },
    {
      name: 'Headphones',
      slug: 'headphones',
      description: 'Wireless noise-cancelling headphones',
      price: 199,
      category: categories[0]._id,
      quantity: 25,
      shipping: true
    },
    {
      name: 'Smartwatch',
      slug: 'smartwatch',
      description: 'Fitness tracking smartwatch with GPS',
      price: 299,
      category: categories[0]._id,
      quantity: 20,
      shipping: true
    },
    {
      name: 'Keyboard',
      slug: 'keyboard',
      description: 'Mechanical gaming keyboard with RGB lights',
      price: 149,
      category: categories[0]._id,
      quantity: 30,
      shipping: true
    },
    {
      name: 'Mouse',
      slug: 'mouse',
      description: 'Ergonomic wireless mouse',
      price: 79,
      category: categories[0]._id,
      quantity: 40,
      shipping: true
    },
    {
      name: 'Monitor',
      slug: 'monitor',
      description: '27-inch 4K monitor with HDR support',
      price: 599,
      category: categories[0]._id,
      quantity: 8,
      shipping: true
    },
    // Clothing products
    {
      name: 'T-Shirt',
      slug: 't-shirt',
      description: 'Comfortable cotton t-shirt',
      price: 25,
      category: categories[1]._id,
      quantity: 50,
      shipping: true
    },
    {
      name: 'Jeans',
      slug: 'jeans',
      description: 'Classic blue denim jeans',
      price: 59,
      category: categories[1]._id,
      quantity: 35,
      shipping: true
    },
    // Books
    {
      name: 'JavaScript Book',
      slug: 'javascript-book',
      description: 'Learn JavaScript from scratch',
      price: 35,
      category: categories[2]._id,
      quantity: 20,
      shipping: true
    }
  ]);
}

export async function seedUsers() {
  const { default: User } = await import('../../models/userModel.js');
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  return await User.insertMany([
    {
      name: 'Test Admin',
      email: 'admin@test.com',
      password: hashedPassword,
      phone: '+11234567890',
      address: '123 Admin St Test City 12345',
      answer: 'pizza',
      role: 1
    },
    {
      name: 'Test User',
      email: 'user@test.com',
      password: hashedPassword,
      phone: '+10987654321',
      address: '456 User Ave, Test City, 54321',
      answer: 'pizza',
      role: 0
    },
    {
      name: 'User No Address',
      email: 'noaddress@test.com',
      password: hashedPassword,
      phone: '+10987654322',
      address: '',
      answer: 'pizza',
      role: 0
    }
  ]);
}

export async function seedAll() {
  await clearDatabase();
  const categories = await seedCategories();
  const products = await seedProducts(categories);
  const users = await seedUsers();
  return { categories, products, users };
}

