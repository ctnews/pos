import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import type { CheckoutItem, DataStore, Product, PublicUser, Sale, Settings, UserRecord, UserRole } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_FILE = path.join(__dirname, '../../data/store.json');

const DEFAULT_SETTINGS: Settings = {
  taxRate: 0,
  password: 'admin123',
  nextProductId: 16,
  nextSaleId: 1,
  nextUserId: 2,
};

const DEFAULT_PRODUCTS: Product[] = [
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

interface DbData {
  products: Product[];
  sales: Sale[];
  settings: Settings;
  qrCodes: Record<string, string>;
  users: UserRecord[];
}

async function readDb(): Promise<DbData> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8');
    const data = JSON.parse(raw) as Partial<DbData>;
    return {
      products: data.products ?? [],
      sales: data.sales ?? [],
      settings: { ...DEFAULT_SETTINGS, ...data.settings },
      qrCodes: data.qrCodes ?? {},
      users: data.users ?? [],
    };
  } catch {
    return { products: [], sales: [], settings: { ...DEFAULT_SETTINGS }, qrCodes: {}, users: [] };
  }
}

async function writeDb(data: DbData): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
}

export class FileStore implements DataStore {
  readonly mode = 'file' as const;

  async seedIfEmpty(): Promise<void> {
    await this.seedDefaultAdmin();
    const db = await readDb();
    if (db.products.length === 0) {
      db.products = DEFAULT_PRODUCTS;
      await writeDb(db);
      console.log('Seeded default products (local file store)');
    }
  }

  async getProducts(): Promise<Product[]> {
    const db = await readDb();
    return db.products.sort((a, b) => a.id - b.id);
  }

  async createProduct(input: Omit<Product, 'id'>): Promise<Product> {
    const db = await readDb();
    if (db.products.some((p) => p.productCode === input.productCode)) {
      throw Object.assign(new Error('Product ID already exists'), { status: 409 });
    }
    const product: Product = { ...input, id: db.settings.nextProductId };
    db.settings.nextProductId += 1;
    db.products.push(product);
    await writeDb(db);
    return product;
  }

  async updateProduct(id: number, input: Omit<Product, 'id'>): Promise<Product | null> {
    const db = await readDb();
    const idx = db.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    if (db.products.some((p) => p.productCode === input.productCode && p.id !== id)) {
      throw Object.assign(new Error('Product ID already exists'), { status: 409 });
    }
    db.products[idx] = { ...input, id };
    await writeDb(db);
    return db.products[idx];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const db = await readDb();
    const before = db.products.length;
    db.products = db.products.filter((p) => p.id !== id);
    if (db.products.length === before) return false;
    await writeDb(db);
    return true;
  }

  async deleteProducts(ids: number[]): Promise<number> {
    const db = await readDb();
    const before = db.products.length;
    db.products = db.products.filter((p) => !ids.includes(p.id));
    await writeDb(db);
    return before - db.products.length;
  }

  async getSales(): Promise<Sale[]> {
    const db = await readDb();
    return db.sales.sort((a, b) => a.id - b.id);
  }

  async clearSales(): Promise<void> {
    const db = await readDb();
    db.sales = [];
    await writeDb(db);
  }

  async checkout(items: CheckoutItem[]): Promise<{ sale: Sale; products: Product[] }> {
    const db = await readDb();
    const taxRate = db.settings.taxRate;
    let subtotal = 0;
    let profitLoss = 0;
    const saleItems = [];

    for (const item of items) {
      const product = db.products.find((p) => p.id === item.id);
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
    const sale: Sale = {
      id: db.settings.nextSaleId,
      date: new Date().toISOString(),
      items: saleItems,
      subtotal,
      tax,
      total: subtotal + tax,
      profitLoss,
    };
    db.settings.nextSaleId += 1;
    db.sales.push(sale);

    for (const item of items) {
      const product = db.products.find((p) => p.id === item.id)!;
      product.quantity = Math.max(0, product.quantity - item.quantity);
    }

    await writeDb(db);
    return { sale, products: db.products.sort((a, b) => a.id - b.id) };
  }

  async getSettings(): Promise<Settings> {
    const db = await readDb();
    return db.settings;
  }

  async updateTaxRate(rate: number): Promise<number> {
    const db = await readDb();
    db.settings.taxRate = rate;
    await writeDb(db);
    return rate;
  }

  async verifyPassword(password: string): Promise<boolean> {
    const db = await readDb();
    return password === db.settings.password;
  }

  private toPublicUser(user: UserRecord): PublicUser {
    return { id: user.id, username: user.username, role: user.role };
  }

  async seedDefaultAdmin(): Promise<void> {
    const db = await readDb();
    if (db.users.length > 0) return;
    db.users.push({
      id: 1,
      username: 'admin',
      password: db.settings.password,
      role: 'admin',
    });
    await writeDb(db);
    console.log('Seeded default admin user (username: admin)');
  }

  async getUsers(): Promise<PublicUser[]> {
    const db = await readDb();
    return db.users.sort((a, b) => a.id - b.id).map((u) => this.toPublicUser(u));
  }

  async createUser(input: { username: string; password: string; role: UserRole }): Promise<PublicUser> {
    const db = await readDb();
    const username = input.username.trim();
    if (!username) throw Object.assign(new Error('Username is required'), { status: 400 });
    if (!input.password) throw Object.assign(new Error('Password is required'), { status: 400 });
    if (db.users.some((u) => u.username === username)) {
      throw Object.assign(new Error('Username already exists'), { status: 409 });
    }
    const user: UserRecord = {
      id: db.settings.nextUserId ?? 2,
      username,
      password: input.password,
      role: input.role,
    };
    db.settings.nextUserId = user.id + 1;
    db.users.push(user);
    await writeDb(db);
    return this.toPublicUser(user);
  }

  async updateUser(
    id: number,
    input: { username?: string; password?: string; role?: UserRole },
  ): Promise<PublicUser | null> {
    const db = await readDb();
    const user = db.users.find((u) => u.id === id);
    if (!user) return null;
    if (input.username !== undefined) {
      const username = input.username.trim();
      if (!username) throw Object.assign(new Error('Username is required'), { status: 400 });
      if (db.users.some((u) => u.username === username && u.id !== id)) {
        throw Object.assign(new Error('Username already exists'), { status: 409 });
      }
      user.username = username;
    }
    if (input.password) user.password = input.password;
    if (input.role) user.role = input.role;
    await writeDb(db);
    return this.toPublicUser(user);
  }

  async deleteUser(id: number): Promise<boolean> {
    const db = await readDb();
    const before = db.users.length;
    db.users = db.users.filter((u) => u.id !== id);
    if (db.users.length === before) return false;
    await writeDb(db);
    return true;
  }

  async authenticateUser(username: string, password: string): Promise<PublicUser | null> {
    const db = await readDb();
    const user = db.users.find((u) => u.username === username.trim());
    if (!user || user.password !== password) return null;
    return this.toPublicUser(user);
  }

  async saveQrCode(productCode: string, dataUrl: string): Promise<void> {
    const db = await readDb();
    db.qrCodes[productCode] = dataUrl;
    await writeDb(db);
  }

  async getQrCode(productCode: string): Promise<string | null> {
    const db = await readDb();
    return db.qrCodes[productCode] ?? null;
  }
}
