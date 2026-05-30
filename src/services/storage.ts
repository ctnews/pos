import type { Product, Sale } from '../types';
import { DEFAULT_PRODUCTS } from '../constants/defaults';
import { DEFAULT_PASSWORD } from '../constants/defaults';
import { STORAGE_KEYS } from '../constants/storageKeys';

function migrateProduct(product: Product): Product {
  return {
    ...product,
    productCode: product.productCode || `PROD${String(product.id).padStart(3, '0')}`,
    purchasedPrice: product.purchasedPrice ?? product.price ?? 0,
    soldPrice: product.soldPrice ?? product.price ?? 0,
    quantity: product.quantity ?? 0,
  };
}

export function loadProducts(): Product[] {
  const saved = localStorage.getItem(STORAGE_KEYS.products);
  if (saved) {
    return (JSON.parse(saved) as Product[]).map(migrateProduct);
  }
  return DEFAULT_PRODUCTS.map(migrateProduct);
}

export function saveProducts(products: Product[]): void {
  localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
}

export function loadSales(): Sale[] {
  const saved = localStorage.getItem(STORAGE_KEYS.sales);
  return saved ? (JSON.parse(saved) as Sale[]) : [];
}

export function saveSales(sales: Sale[]): void {
  localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(sales));
}

export function loadTaxRate(): number {
  const saved = localStorage.getItem(STORAGE_KEYS.taxRate);
  return saved !== null ? parseFloat(saved) || 0 : 0;
}

export function saveTaxRate(rate: number): void {
  localStorage.setItem(STORAGE_KEYS.taxRate, rate.toString());
}

export function getStoredPassword(): string {
  return localStorage.getItem(STORAGE_KEYS.password) || DEFAULT_PASSWORD;
}

export function loadQrCodes(): Record<string, string> {
  const saved = localStorage.getItem(STORAGE_KEYS.qrCodes);
  return saved ? (JSON.parse(saved) as Record<string, string>) : {};
}

export function saveQrCode(productCode: string, dataUrl: string): void {
  const codes = loadQrCodes();
  codes[productCode] = dataUrl;
  localStorage.setItem(STORAGE_KEYS.qrCodes, JSON.stringify(codes));
}

export function verifyPassword(password: string): boolean {
  return password === getStoredPassword();
}

export function getCategories(products: Product[]): string[] {
  return [...new Set(products.map((p) => p.category))];
}
