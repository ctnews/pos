export type TabId = 'pos' | 'products' | 'tax' | 'analytics' | 'users' | 'printer';

export type UserRole = 'admin' | 'cashier';

export interface AuthUser {
  id: number;
  username: string;
  role: UserRole;
}

export type DiscountType = 'amount' | 'percentage';

export type ChartType =
  | 'productid'
  | 'product'
  | 'category'
  | 'timeseries-all'
  | 'timeseries-productid'
  | 'timeseries-product'
  | 'timeseries-category';

export interface Product {
  id: number;
  productCode: string;
  name: string;
  purchasedPrice: number;
  soldPrice: number;
  category: string;
  quantity: number;
  discountType?: DiscountType;
  discount?: number;
  price?: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface SaleItem {
  id: number;
  name: string;
  category: string;
  soldPrice: number;
  quantity: number;
  price?: number;
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

export type ModalId =
  | 'receipt'
  | 'qr-scanner'
  | 'clear-sales'
  | 'qr-display';

export interface ReceiptData {
  sale: Sale;
  items: CartItem[];
  date: Date;
}

export interface QRDisplayProduct {
  productCode: string;
  name: string;
}
