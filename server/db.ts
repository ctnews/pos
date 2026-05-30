import mongoose from 'mongoose';

export async function connectDb(uri: string): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    family: 4,
  });
  console.log('Connected to MongoDB');
}
