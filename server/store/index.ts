import { connectDb } from '../db.js';
import { FileStore } from './fileStore.js';
import { MongoStore } from './mongoStore.js';
import type { DataStore } from './types.js';

let store: DataStore | null = null;

export async function initStore(): Promise<DataStore> {
  if (store) return store;

  const mode = process.env.DB_MODE || 'auto';
  const uri = process.env.MONGODB_URI;
  const onVercel = Boolean(process.env.VERCEL);

  if (onVercel) {
    if (!uri) {
      throw new Error('MONGODB_URI is required on Vercel. Add it in Project Settings → Environment Variables.');
    }
    await connectDb(uri);
    const mongoStore = new MongoStore();
    await mongoStore.seedIfEmpty();
    store = mongoStore;
    console.log('Using MongoDB Atlas (Vercel)');
    return store;
  }

  if (mode === 'file') {
    const fileStore = new FileStore();
    await fileStore.seedIfEmpty();
    store = fileStore;
    console.log('Using local file storage (data/store.json)');
    return store;
  }

  if (mode === 'mongo') {
    if (!uri) throw new Error('MONGODB_URI is required when DB_MODE=mongo');
    await connectDb(uri);
    const mongoStore = new MongoStore();
    await mongoStore.seedIfEmpty();
    store = mongoStore;
    console.log('Using MongoDB Atlas');
    return store;
  }

  // auto: try MongoDB, fall back to local files (local dev only)
  if (uri) {
    try {
      await connectDb(uri);
      const mongoStore = new MongoStore();
      await mongoStore.seedIfEmpty();
      store = mongoStore;
      console.log('Using MongoDB Atlas');
      return store;
    } catch (err) {
      console.warn('\n⚠️  MongoDB Atlas unreachable — using local file storage instead');
      console.warn('   Atlas: Network Access → allow 0.0.0.0/0 for Vercel/serverless\n');
      if (process.env.ALLOW_FILE_FALLBACK === 'false') {
        throw err;
      }
    }
  }

  const fileStore = new FileStore();
  await fileStore.seedIfEmpty();
  store = fileStore;
  console.log('Using local file storage (data/store.json)');
  return store;
}

export function getStore(): DataStore {
  if (!store) throw new Error('Store not initialized');
  return store;
}
