import mongoose from 'mongoose';

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

export async function connectDb(uri: string): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);

  const cached = global.mongooseCache ?? { conn: null, promise: null };
  global.mongooseCache = cached;

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      family: 4,
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  console.log('Connected to MongoDB');
  return cached.conn;
}
