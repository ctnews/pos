import type { CartItem, Product, Sale, SaleItem } from '../types';
import { getSoldPrice } from '../utils/format';

export function calculateCartTotals(cart: CartItem[], taxRate: number) {
  const subtotal = cart.reduce(
    (sum, item) => sum + getSoldPrice(item) * item.quantity,
    0,
  );
  const tax = subtotal * (taxRate / 100);
  return { subtotal, tax, total: subtotal + tax };
}

export function canAddToCart(product: Product, cart: CartItem[]): boolean {
  if ((product.quantity || 0) === 0) return false;
  const existing = cart.find((item) => item.id === product.id);
  if (existing && existing.quantity >= (product.quantity || 0)) return false;
  return true;
}

export function addToCart(cart: CartItem[], product: Product): CartItem[] {
  const existing = cart.find((item) => item.id === product.id);
  if (existing) {
    return cart.map((item) =>
      item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item,
    );
  }
  return [...cart, { ...product, quantity: 1 }];
}

export function updateCartQuantity(
  cart: CartItem[],
  productId: number,
  delta: number,
  products: Product[],
): CartItem[] {
  const product = products.find((p) => p.id === productId);
  if (!product) return cart;

  return cart
    .map((item) => {
      if (item.id !== productId) return item;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return null;
      if (newQty > (product.quantity || 0)) return item;
      return { ...item, quantity: newQty };
    })
    .filter((item): item is CartItem => item !== null);
}

export function removeFromCart(cart: CartItem[], productId: number): CartItem[] {
  return cart.filter((item) => item.id !== productId);
}

export function createSale(cart: CartItem[], products: Product[], taxRate: number): Sale {
  const { subtotal, tax, total } = calculateCartTotals(cart, taxRate);
  const date = new Date();

  let profitLoss = 0;
  cart.forEach((item) => {
    const product = products.find((p) => p.id === item.id);
    if (product) {
      profitLoss += (getSoldPrice(item) - (product.purchasedPrice || 0)) * item.quantity;
    }
  });

  const items: SaleItem[] = cart.map((item) => ({
    id: item.id,
    name: item.name,
    category: item.category,
    soldPrice: getSoldPrice(item),
    quantity: item.quantity,
  }));

  return {
    id: 0,
    date: date.toISOString(),
    items,
    subtotal,
    tax,
    total,
    profitLoss,
  };
}

export function applyInventoryAfterSale(products: Product[], cart: CartItem[]): Product[] {
  return products.map((product) => {
    const cartItem = cart.find((item) => item.id === product.id);
    if (!cartItem) return product;
    return {
      ...product,
      quantity: Math.max(0, (product.quantity || 0) - cartItem.quantity),
    };
  });
}

export function validateProductCode(
  products: Product[],
  code: string,
  editId: number | null,
): boolean {
  const normalized = code.trim();
  return !products.some(
    (p) => p.productCode === normalized && p.id !== editId,
  );
}

export function getNextProductId(products: Product[]): number {
  return products.length > 0 ? Math.max(...products.map((p) => p.id)) + 1 : 1;
}
