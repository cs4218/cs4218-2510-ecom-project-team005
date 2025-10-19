// app.js
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// routes
import categoryRoutes from './routes/categoryRoutes.js';
import productRoutes from './routes/productRoutes.js';
import authRoutes from './routes/authRoute.js'; // kalau ada

dotenv.config({ path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env' });

const app = express();

// core middlewares
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// healthcheck (buat Supertest & monitoring)
app.get('/api/health', (_req, res) => {
  res.status(200).json({ ok: true });
});

// mount routes
app.use('/api/category', categoryRoutes);
app.use('/api/product', productRoutes);
app.use('/api/v1/auth', authRoutes);
 // kalau ada

export default app;
