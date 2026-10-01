import mongoose from 'mongoose';
import { config } from '../config.js';

export async function connectDb(url = config.MONGO_URL) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(url);
}
