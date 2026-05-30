import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MONGODB_URI not set');
  process.exit(1);
}

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 15000, family: 4 });
  console.log('SUCCESS: Connected to MongoDB');
  const admin = mongoose.connection.db?.admin();
  const dbs = await admin?.listDatabases();
  console.log('Databases:', dbs?.databases?.map((d) => d.name).join(', '));
  await mongoose.disconnect();
  process.exit(0);
} catch (e: unknown) {
  const err = e as Error & { reason?: { type?: string } };
  console.error('ERROR:', err.message);
  if (err.reason?.type) console.error('Topology:', err.reason.type);
  process.exit(1);
}
