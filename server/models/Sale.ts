import mongoose, { Schema } from 'mongoose';

const saleItemSchema = new Schema(
  {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    soldPrice: { type: Number, required: true },
    quantity: { type: Number, required: true },
    price: { type: Number },
  },
  { _id: false },
);

const saleSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true },
    date: { type: String, required: true },
    items: { type: [saleItemSchema], required: true },
    subtotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    total: { type: Number, required: true },
    profitLoss: { type: Number, required: true },
  },
  { versionKey: false },
);

export const SaleModel = mongoose.model('Sale', saleSchema);
