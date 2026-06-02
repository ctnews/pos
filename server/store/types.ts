import type { UserRole } from '../auth/session.js';

export type { UserRole };

export interface Product {
  id: number;
  productCode: string;
  name: string;
  purchasedPrice: number;
  soldPrice: number;
  category: string;
  quantity: number;
  discountType?: string;
  discount?: number;
}

export interface SaleItem {
  id: number;
  name: string;
  category: string;
  soldPrice: number;
  quantity: number;
}

export interface Sale {
  id: number;
  date: string;
  items: SaleItem[];
  subtotal: number;
  tax: number;
  total: number;
  profitLoss: number;
}

export interface Settings {
  taxRate: number;
  password: string;
  nextProductId: number;
  nextSaleId: number;
  nextUserId: number;
  silentPrint: boolean;
  receiptPrinter: string;
}

export interface PrinterSettingsInput {
  silentPrint: boolean;
  receiptPrinter: string;
}

export interface UserRecord {
  id: number;
  username: string;
  password: string;
  role: UserRole;
}

export interface PublicUser {
  id: number;
  username: string;
  role: UserRole;
}

export interface CheckoutItem {
  id: number;
  quantity: number;
}

export interface DataStore {
  readonly mode: 'mongo' | 'file';
  getProducts(): Promise<Product[]>;
  createProduct(input: Omit<Product, 'id'>): Promise<Product>;
  updateProduct(id: number, input: Omit<Product, 'id'>): Promise<Product | null>;
  deleteProduct(id: number): Promise<boolean>;
  deleteProducts(ids: number[]): Promise<number>;
  getSales(): Promise<Sale[]>;
  clearSales(): Promise<void>;
  checkout(items: CheckoutItem[]): Promise<{ sale: Sale; products: Product[] }>;
  getSettings(): Promise<Settings>;
  updateTaxRate(rate: number): Promise<number>;
  updatePrinterSettings(input: PrinterSettingsInput): Promise<PrinterSettingsInput>;
  verifyPassword(password: string): Promise<boolean>;
  getUsers(): Promise<PublicUser[]>;
  createUser(input: { username: string; password: string; role: UserRole }): Promise<PublicUser>;
  updateUser(
    id: number,
    input: { username?: string; password?: string; role?: UserRole },
  ): Promise<PublicUser | null>;
  deleteUser(id: number): Promise<boolean>;
  authenticateUser(username: string, password: string): Promise<PublicUser | null>;
  seedDefaultAdmin(): Promise<void>;
  saveQrCode(productCode: string, dataUrl: string): Promise<void>;
  getQrCode(productCode: string): Promise<string | null>;
  seedIfEmpty(): Promise<void>;
}
