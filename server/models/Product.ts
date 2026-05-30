import mongoose, { Schema } from 'mongoose';

const productSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true },
    productCode: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    purchasedPrice: { type: Number, required: true, default: 0 },
    soldPrice: { type: Number, required: true, default: 0 },
    category: { type: String, required: true },
    quantity: { type: Number, required: true, default: 0 },
    discountType: { type: String, enum: ['amount', 'percentage'], default: 'amount' },
    discount: { type: Number, default: 0 },
  },
  { versionKey: false },
);

export const ProductModel = mongoose.model('Product', productSchema);
