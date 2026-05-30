import mongoose, { Schema } from 'mongoose';

const qrCodeSchema = new Schema(
  {
    productCode: { type: String, required: true, unique: true },
    dataUrl: { type: String, required: true },
  },
  { versionKey: false },
);

export const QrCodeModel = mongoose.model('QrCode', qrCodeSchema);
