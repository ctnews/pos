import mongoose, { Schema } from 'mongoose';

const settingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: 'app' },
    taxRate: { type: Number, default: 0 },
    password: { type: String, default: 'admin123' },
    nextProductId: { type: Number, default: 16 },
    nextSaleId: { type: Number, default: 1 },
    nextUserId: { type: Number, default: 2 },
    silentPrint: { type: Boolean, default: false },
    receiptPrinter: { type: String, default: '' },
  },
  { versionKey: false },
);

export const SettingsModel = mongoose.model('Settings', settingsSchema);

export async function getSettings() {
  let settings = await SettingsModel.findOne({ key: 'app' });
  if (!settings) {
    settings = await SettingsModel.create({ key: 'app' });
  }
  return settings;
}
