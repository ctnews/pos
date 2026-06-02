import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  AuthUser,
  CartItem,
  ChartType,
  ModalId,
  Product,
  QRDisplayProduct,
  ReceiptData,
  Sale,
  TabId,
  UserRole,
} from '../types';
import { ADMIN_TABS } from '../constants/defaults';
import {
  api,
  loadStoredUser,
  saveStoredUser,
  setAuthToken,
} from '../services/api';
import {
  addToCart,
  canAddToCart,
  removeFromCart,
  updateCartQuantity,
} from '../services/cartService';
import { printReceipt } from '../utils/receiptPrint';

interface AppContextValue {
  currentUser: AuthUser | null;
  isAdmin: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  requestTab: (tab: TabId) => void;
  authReady: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  products: Product[];
  sales: Sale[];
  cart: CartItem[];
  taxRate: number;
  setTaxRate: (rate: number) => Promise<void>;
  categories: string[];
  addProductToCart: (product: Product) => void;
  changeCartQuantity: (productId: number, delta: number) => void;
  removeCartItem: (productId: number) => void;
  clearCart: () => void;
  checkout: () => Promise<void>;
  finishCheckout: () => void;
  saveProduct: (product: Omit<Product, 'id'> & { id?: number }) => Promise<boolean>;
  deleteProduct: (id: number) => Promise<void>;
  deleteProducts: (ids: number[]) => Promise<void>;
  clearAllSales: () => Promise<boolean>;
  users: AuthUser[];
  refreshUsers: () => Promise<void>;
  createUser: (input: { username: string; password: string; role: UserRole }) => Promise<boolean>;
  updateUser: (
    id: number,
    input: { username?: string; password?: string; role?: UserRole },
  ) => Promise<boolean>;
  deleteUser: (id: number) => Promise<boolean>;
  openModal: ModalId | null;
  receiptData: ReceiptData | null;
  qrDisplayProduct: QRDisplayProduct | null;
  showModal: (modal: ModalId) => void;
  hideModal: () => void;
  showQrForProduct: (product: Product) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

async function loadStoreData(
  setProducts: (p: Product[]) => void,
  setSales: (s: Sale[]) => void,
  setTaxRateState: (r: number) => void,
  setError: (e: string | null) => void,
) {
  const data = await api.bootstrap();
  setProducts(data.products);
  setSales(data.sales);
  setTaxRateState(data.taxRate);
  setError(null);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(loadStoredUser);
  const [authReady, setAuthReady] = useState(false);
  const [activeTab, setActiveTabState] = useState<TabId>('pos');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [taxRate, setTaxRateState] = useState(0);
  const [openModal, setOpenModal] = useState<ModalId | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [qrDisplayProduct, setQrDisplayProduct] = useState<QRDisplayProduct | null>(null);

  const isAdmin = currentUser?.role === 'admin';

  const setActiveTab = useCallback((tab: TabId) => {
    setActiveTabState(tab);
  }, []);

  const requestTab = useCallback(
    (tab: TabId) => {
      if (ADMIN_TABS.includes(tab) && !isAdmin) return;
      setActiveTab(tab);
    },
    [isAdmin, setActiveTab],
  );

  const refreshUsers = useCallback(async () => {
    if (!isAdmin) return;
    const list = await api.getUsers();
    setUsers(list);
  }, [isAdmin]);

  useEffect(() => {
    let cancelled = false;

    async function initAuth() {
      if (!currentUser) {
        setAuthReady(true);
        return;
      }

      setIsLoading(true);
      try {
        const { user } = await api.me();
        if (cancelled) return;
        setCurrentUser(user);
        saveStoredUser(user);
        await loadStoreData(setProducts, setSales, setTaxRateState, setError);
        if (user.role === 'admin') {
          const list = await api.getUsers();
          if (!cancelled) setUsers(list);
        }
      } catch {
        if (cancelled) return;
        setAuthToken(null);
        saveStoredUser(null);
        setCurrentUser(null);
        setProducts([]);
        setSales([]);
        setUsers([]);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setAuthReady(true);
        }
      }
    }

    initAuth();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isAdmin && ADMIN_TABS.includes(activeTab)) {
      setActiveTabState('pos');
    }
  }, [isAdmin, activeTab]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const { token, user } = await api.login(username, password);
      setAuthToken(token);
      saveStoredUser(user);
      setCurrentUser(user);
      setIsLoading(true);
      await loadStoreData(setProducts, setSales, setTaxRateState, setError);
      if (user.role === 'admin') {
        const list = await api.getUsers();
        setUsers(list);
      } else {
        setUsers([]);
        setActiveTabState('pos');
      }
      return true;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    setAuthToken(null);
    saveStoredUser(null);
    setCurrentUser(null);
    setProducts([]);
    setSales([]);
    setUsers([]);
    setCart([]);
    setActiveTabState('pos');
    setOpenModal(null);
  }, []);

  const setTaxRate = useCallback(async (rate: number) => {
    const result = await api.updateTaxRate(rate);
    setTaxRateState(result.taxRate);
  }, []);

  const addProductToCart = useCallback(
    (product: Product) => {
      if (!canAddToCart(product, cart)) return;
      setCart((prev) => addToCart(prev, product));
    },
    [cart],
  );

  const changeCartQuantity = useCallback(
    (productId: number, delta: number) => {
      setCart((prev) => updateCartQuantity(prev, productId, delta, products));
    },
    [products],
  );

  const removeCartItem = useCallback((productId: number) => {
    setCart((prev) => removeFromCart(prev, productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const checkout = useCallback(async () => {
    if (cart.length === 0) return;
    try {
      const items = cart.map((item) => ({ id: item.id, quantity: item.quantity }));
      const result = await api.checkout(items);
      setProducts(result.products);
      if (isAdmin) {
        setSales((prev) => [...prev, result.sale]);
      }

      const receiptItems = [...cart];
      const receiptDate = new Date(result.sale.date);
      const printResult = await printReceipt(receiptItems, result.sale, taxRate, receiptDate);

      if (printResult === 'silent') {
        setCart([]);
        setReceiptData(null);
        setOpenModal(null);
      } else if (printResult === 'browser') {
        setCart([]);
        setReceiptData(null);
        setOpenModal(null);
      } else {
        setReceiptData({
          sale: result.sale,
          items: receiptItems,
          date: receiptDate,
        });
        setOpenModal('receipt');
        alert(
          'Could not print. Enable SILENT_PRINT=true in .env on the local server, or allow printing in the browser.',
        );
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Checkout failed');
    }
  }, [cart, isAdmin, taxRate]);

  const finishCheckout = useCallback(() => {
    setCart([]);
    setReceiptData(null);
    setOpenModal(null);
  }, []);

  const saveProduct = useCallback(
    async (input: Omit<Product, 'id'> & { id?: number }) => {
      try {
        if (input.id) {
          const updated = await api.updateProduct(input.id, input);
          setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
        } else {
          const created = await api.createProduct(input);
          setProducts((prev) => [...prev, created]);
        }
        return true;
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to save product');
        return false;
      }
    },
    [],
  );

  const deleteProduct = useCallback(async (id: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await api.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete product');
    }
  }, []);

  const deleteProducts = useCallback(async (ids: number[]) => {
    if (ids.length === 0) {
      alert('Please select at least one product to delete.');
      return;
    }
    const names = ids
      .map((id) => products.find((p) => p.id === id)?.name || `Product ID ${id}`)
      .join(', ');
    if (!confirm(`Are you sure you want to delete ${ids.length} product(s)?\n\nProducts: ${names}`)) {
      return;
    }
    try {
      await api.deleteProducts(ids);
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
      alert(`${ids.length} product(s) deleted successfully.`);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete products');
    }
  }, [products]);

  const clearAllSales = useCallback(async () => {
    try {
      await api.clearSales();
      setSales([]);
      return true;
    } catch {
      return false;
    }
  }, []);

  const createUser = useCallback(async (input: { username: string; password: string; role: UserRole }) => {
    try {
      const user = await api.createUser(input);
      setUsers((prev) => [...prev, user].sort((a, b) => a.id - b.id));
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create user');
      return false;
    }
  }, []);

  const updateUser = useCallback(
    async (id: number, input: { username?: string; password?: string; role?: UserRole }) => {
      try {
        const user = await api.updateUser(id, input);
        setUsers((prev) => prev.map((u) => (u.id === user.id ? user : u)));
        if (currentUser?.id === user.id) {
          setCurrentUser(user);
          saveStoredUser(user);
        }
        return true;
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Failed to update user');
        return false;
      }
    },
    [currentUser],
  );

  const deleteUser = useCallback(async (id: number) => {
    try {
      await api.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      return true;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete user');
      return false;
    }
  }, []);

  const showModal = useCallback((modal: ModalId) => setOpenModal(modal), []);
  const hideModal = useCallback(() => setOpenModal(null), []);

  const showQrForProduct = useCallback((product: Product) => {
    setQrDisplayProduct({ productCode: product.productCode, name: product.name });
    setOpenModal('qr-display');
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))],
    [products],
  );

  const value: AppContextValue = {
    currentUser,
    isAdmin,
    activeTab,
    setActiveTab,
    requestTab,
    authReady,
    isLoading,
    error,
    login,
    logout,
    products,
    sales,
    cart,
    taxRate,
    setTaxRate,
    categories,
    addProductToCart,
    changeCartQuantity,
    removeCartItem,
    clearCart,
    checkout,
    finishCheckout,
    saveProduct,
    deleteProduct,
    deleteProducts,
    clearAllSales,
    users,
    refreshUsers,
    createUser,
    updateUser,
    deleteUser,
    openModal,
    receiptData,
    qrDisplayProduct,
    showModal,
    hideModal,
    showQrForProduct,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export type { ChartType };
