import { ProductModel } from '../models/Product.js';
import { SaleModel } from '../models/Sale.js';
import { QrCodeModel } from '../models/QrCode.js';
import { UserModel } from '../models/User.js';
import { getSettings } from '../models/Settings.js';
import type { CheckoutItem, DataStore, Product, PublicUser, Sale, Settings, UserRole } from './types.js';

export class MongoStore implements DataStore {
  readonly mode = 'mongo' as const;

  async seedIfEmpty(): Promise<void> {
    await getSettings();
    await this.seedDefaultAdmin();
    const count = await ProductModel.countDocuments();
    if (count === 0) {
      const defaults = [
        { id: 1, productCode: 'PROD001', name: 'Laptop', purchasedPrice: 800000, soldPrice: 999000, category: 'Electronics', quantity: 10 },
        { id: 2, productCode: 'PROD002', name: 'Mouse', purchasedPrice: 20000, soldPrice: 30000, category: 'Electronics', quantity: 50 },
        { id: 3, productCode: 'PROD003', name: 'Keyboard', purchasedPrice: 50000, soldPrice: 80000, category: 'Electronics', quantity: 30 },
        { id: 4, productCode: 'PROD004', name: 'Monitor', purchasedPrice: 200000, soldPrice: 250000, category: 'Electronics', quantity: 20 },
        { id: 5, productCode: 'PROD005', name: 'Headphones', purchasedPrice: 100000, soldPrice: 150000, category: 'Electronics', quantity: 25 },
        { id: 6, productCode: 'PROD006', name: 'Webcam', purchasedPrice: 60000, soldPrice: 90000, category: 'Electronics', quantity: 15 },
        { id: 7, productCode: 'PROD007', name: 'USB Drive 32GB', purchasedPrice: 15000, soldPrice: 20000, category: 'Storage', quantity: 100 },
        { id: 8, productCode: 'PROD008', name: 'USB Drive 64GB', purchasedPrice: 25000, soldPrice: 35000, category: 'Storage', quantity: 80 },
        { id: 9, productCode: 'PROD009', name: 'External HDD 1TB', purchasedPrice: 60000, soldPrice: 80000, category: 'Storage', quantity: 40 },
        { id: 10, productCode: 'PROD010', name: 'SSD 500GB', purchasedPrice: 100000, soldPrice: 130000, category: 'Storage', quantity: 35 },
        { id: 11, productCode: 'PROD011', name: 'Wireless Router', purchasedPrice: 70000, soldPrice: 100000, category: 'Networking', quantity: 20 },
        { id: 12, productCode: 'PROD012', name: 'Ethernet Cable', purchasedPrice: 10000, soldPrice: 15000, category: 'Networking', quantity: 200 },
        { id: 13, productCode: 'PROD013', name: 'Printer Paper', purchasedPrice: 8000, soldPrice: 13000, category: 'Office Supplies', quantity: 150 },
        { id: 14, productCode: 'PROD014', name: 'Ink Cartridge', purchasedPrice: 30000, soldPrice: 40000, category: 'Office Supplies', quantity: 60 },
        { id: 15, productCode: 'PROD015', name: 'Desk Lamp', purchasedPrice: 35000, soldPrice: 50000, category: 'Office Supplies', quantity: 30 },
      ];
      await ProductModel.insertMany(defaults);
      console.log('Seeded default products (MongoDB)');
    }
  }

  async getProducts(): Promise<Product[]> {
    return ProductModel.find().sort({ id: 1 }).lean() as Promise<Product[]>;
  }

  async createProduct(input: Omit<Product, 'id'>): Promise<Product> {
    const existing = await ProductModel.findOne({ productCode: input.productCode });
    if (existing) throw Object.assign(new Error('Product ID already exists'), { status: 409 });
    const settings = await getSettings();
    const id = settings.nextProductId;
    settings.nextProductId = id + 1;
    await settings.save();
    const product = await ProductModel.create({ ...input, id });
    return product.toObject() as Product;
  }

  async updateProduct(id: number, input: Omit<Product, 'id'>): Promise<Product | null> {
    const duplicate = await ProductModel.findOne({ productCode: input.productCode, id: { $ne: id } });
    if (duplicate) throw Object.assign(new Error('Product ID already exists'), { status: 409 });
    const product = await ProductModel.findOneAndUpdate({ id }, input, { new: true });
    return product ? (product.toObject() as Product) : null;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await ProductModel.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async deleteProducts(ids: number[]): Promise<number> {
    const result = await ProductModel.deleteMany({ id: { $in: ids } });
    return result.deletedCount;
  }

  async getSales(): Promise<Sale[]> {
    return SaleModel.find().sort({ id: 1 }).lean() as Promise<Sale[]>;
  }

  async clearSales(): Promise<void> {
    await SaleModel.deleteMany({});
  }

  async checkout(items: CheckoutItem[]): Promise<{ sale: Sale; products: Product[] }> {
    const settings = await getSettings();
    const taxRate = settings.taxRate;
    const productIds = items.map((i) => i.id);
    const products = await ProductModel.find({ id: { $in: productIds } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    let subtotal = 0;
    let profitLoss = 0;
    const saleItems = [];

    for (const item of items) {
      const product = productMap.get(item.id);
      if (!product) throw Object.assign(new Error(`Product ${item.id} not found`), { status: 400 });
      if (item.quantity > product.quantity) {
        throw Object.assign(new Error(`Insufficient stock for ${product.name}`), { status: 400 });
      }
      subtotal += product.soldPrice * item.quantity;
      profitLoss += (product.soldPrice - product.purchasedPrice) * item.quantity;
      saleItems.push({
        id: product.id,
        name: product.name,
        category: product.category,
        soldPrice: product.soldPrice,
        quantity: item.quantity,
      });
    }

    const tax = subtotal * (taxRate / 100);
    const saleId = settings.nextSaleId;
    settings.nextSaleId = saleId + 1;
    await settings.save();

    const sale = await SaleModel.create({
      id: saleId,
      date: new Date().toISOString(),
      items: saleItems,
      subtotal,
      tax,
      total: subtotal + tax,
      profitLoss,
    });

    for (const item of items) {
      await ProductModel.updateOne({ id: item.id }, { $inc: { quantity: -item.quantity } });
    }

    const updatedProducts = await ProductModel.find().sort({ id: 1 }).lean();
    return { sale: sale.toObject() as Sale, products: updatedProducts as Product[] };
  }

  async getSettings(): Promise<Settings> {
    const s = await getSettings();
    return {
      taxRate: s.taxRate,
      password: s.password,
      nextProductId: s.nextProductId,
      nextSaleId: s.nextSaleId,
      nextUserId: s.nextUserId ?? 2,
    };
  }

  async updateTaxRate(rate: number): Promise<number> {
    const settings = await getSettings();
    settings.taxRate = rate;
    await settings.save();
    return rate;
  }

  async verifyPassword(password: string): Promise<boolean> {
    const settings = await getSettings();
    return password === settings.password;
  }

  private toPublicUser(doc: { id: number; username: string; role: UserRole }): PublicUser {
    return { id: doc.id, username: doc.username, role: doc.role };
  }

  async seedDefaultAdmin(): Promise<void> {
    const count = await UserModel.countDocuments();
    if (count > 0) return;
    const settings = await getSettings();
    await UserModel.create({
      id: 1,
      username: 'admin',
      password: settings.password,
      role: 'admin',
    });
    console.log('Seeded default admin user (username: admin)');
  }

  async getUsers(): Promise<PublicUser[]> {
    const users = await UserModel.find().sort({ id: 1 }).lean();
    return users.map((u) => this.toPublicUser(u as { id: number; username: string; role: UserRole }));
  }

  async createUser(input: { username: string; password: string; role: UserRole }): Promise<PublicUser> {
    const username = input.username.trim();
    if (!username) throw Object.assign(new Error('Username is required'), { status: 400 });
    if (!input.password) throw Object.assign(new Error('Password is required'), { status: 400 });
    const existing = await UserModel.findOne({ username });
    if (existing) throw Object.assign(new Error('Username already exists'), { status: 409 });
    const settings = await getSettings();
    const id = settings.nextUserId ?? 2;
    settings.nextUserId = id + 1;
    await settings.save();
    const user = await UserModel.create({ id, username, password: input.password, role: input.role });
    return this.toPublicUser(user.toObject());
  }

  async updateUser(
    id: number,
    input: { username?: string; password?: string; role?: UserRole },
  ): Promise<PublicUser | null> {
    const user = await UserModel.findOne({ id });
    if (!user) return null;
    if (input.username !== undefined) {
      const username = input.username.trim();
      if (!username) throw Object.assign(new Error('Username is required'), { status: 400 });
      const duplicate = await UserModel.findOne({ username, id: { $ne: id } });
      if (duplicate) throw Object.assign(new Error('Username already exists'), { status: 409 });
      user.username = username;
    }
    if (input.password) user.password = input.password;
    if (input.role) user.role = input.role;
    await user.save();
    return this.toPublicUser(user.toObject());
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await UserModel.deleteOne({ id });
    return result.deletedCount > 0;
  }

  async authenticateUser(username: string, password: string): Promise<PublicUser | null> {
    const user = await UserModel.findOne({ username: username.trim() }).lean();
    if (!user || user.password !== password) return null;
    return this.toPublicUser(user as { id: number; username: string; role: UserRole });
  }

  async saveQrCode(productCode: string, dataUrl: string): Promise<void> {
    await QrCodeModel.findOneAndUpdate({ productCode }, { productCode, dataUrl }, { upsert: true });
  }

  async getQrCode(productCode: string): Promise<string | null> {
    const doc = await QrCodeModel.findOne({ productCode }).lean();
    return doc?.dataUrl ?? null;
  }
}
