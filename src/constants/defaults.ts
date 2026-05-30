import type { Product, TabId } from '../types';

export const DEFAULT_PASSWORD = 'admin123';
export const DEFAULT_TAX_RATE = 0;
export const ADMIN_TABS: TabId[] = ['products', 'tax', 'analytics', 'users'];
export const DEFAULT_CHART_TYPE = 'product' as const;
export const DEFAULT_DATE_RANGE_DAYS = 2;

export const RECEIPT_STORE = {
  name: 'Hello Baby',
  addressLine1: 'ဖားကန့်လမ်းမကြီးဘေး',
  addressLine2: 'လုံးခင်းမြို့၊ ကချင်ပြည်နယ်',
  phones: '09402649256 09772233073',
};

/** Thermal printer paper width (2.5 inch roll) */
export const RECEIPT_WIDTH = '2.5in';

export const CHART_COLORS = [
  '#1e4976', '#2d6a9f', '#334155', '#047857', '#b45309',
  '#475569', '#0f766e', '#1d4ed8', '#4b5563', '#0369a1',
  '#15803d', '#92400e', '#3730a3', '#0e7490', '#64748b',
];

export const DEFAULT_PRODUCTS: Product[] = [
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
