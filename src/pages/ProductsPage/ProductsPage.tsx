import { useEffect, useState, type FormEvent } from 'react';
import type { DiscountType, Product } from '../../types';
import { useApp } from '../../context/AppContext';
import { formatProfitLoss, getSoldPrice } from '../../utils/format';

const emptyForm = {
  id: null as number | null,
  productCode: '',
  name: '',
  category: '',
  purchasedPrice: '',
  soldPrice: '',
  quantity: '0',
  discountType: 'amount' as DiscountType,
  discount: '0',
};

export function ProductsPage() {
  const { products, categories, saveProduct, deleteProduct, deleteProducts, showQrForProduct } = useApp();
  const [form, setForm] = useState(emptyForm);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const profitLoss =
    form.soldPrice && form.purchasedPrice
      ? parseFloat(form.soldPrice) - parseFloat(form.purchasedPrice)
      : null;

  const resetForm = () => setForm(emptyForm);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const product: Omit<Product, 'id'> & { id?: number } = {
      id: form.id ?? undefined,
      productCode: form.productCode.trim(),
      name: form.name.trim(),
      category: form.category.trim(),
      purchasedPrice: parseFloat(form.purchasedPrice) || 0,
      soldPrice: parseFloat(form.soldPrice) || 0,
      quantity: parseInt(form.quantity, 10) || 0,
      discountType: form.discountType,
      discount: parseFloat(form.discount) || 0,
    };
    if (await saveProduct(product)) resetForm();
  };

  const startEdit = (product: Product) => {
    setForm({
      id: product.id,
      productCode: product.productCode,
      name: product.name,
      category: product.category,
      purchasedPrice: String(product.purchasedPrice),
      soldPrice: String(getSoldPrice(product)),
      quantity: String(product.quantity || 0),
      discountType: product.discountType || 'amount',
      discount: String(product.discount || 0),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSelect = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    setSelected(new Set());
  }, [products.length]);

  return (
    <div className="tab-content active">
      <div className="product-management">
        <div className="product-form-section">
          <h2>Add/Edit Product</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="product-code">ကုန်ပစ္စည်းအမှတ်</label>
              <input
                id="product-code"
                type="text"
                placeholder="e.g., PROD001"
                required
                value={form.productCode}
                onChange={(e) => setForm({ ...form, productCode: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="product-name">ကုန်ပစ္စည်းတံဆိပ်(Brand)</label>
              <input
                id="product-name"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="product-category">အမျိုးအစား</label>
              <input
                id="product-category"
                list="categories"
                required
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <datalist id="categories">
                {categories.map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label htmlFor="product-purchased-price">ဝယ်ယူသည့်စျေးနှုန်း (Ks)</label>
              <input
                id="product-purchased-price"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.purchasedPrice}
                onChange={(e) => setForm({ ...form, purchasedPrice: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="product-sold-price">ရောင်းချသည့်စျေးနှုန်း (Ks)</label>
              <input
                id="product-sold-price"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.soldPrice}
                onChange={(e) => setForm({ ...form, soldPrice: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="product-quantity">ကုန်ပစ္စည်းအရေအတွက်</label>
              <input
                id="product-quantity"
                type="number"
                step="1"
                min="0"
                required
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label htmlFor="discount-type">လျော့စျေး အမျိုးအစား (Discount Type)</label>
              <select
                id="discount-type"
                required
                value={form.discountType}
                onChange={(e) => setForm({ ...form, discountType: e.target.value as DiscountType })}
              >
                <option value="amount">Amount (Ks)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="product-discount">လျော့စျေး (Discount)</label>
              <input
                id="product-discount"
                type="number"
                step="0.01"
                min="0"
                required
                value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
              />
            </div>
            <div className="form-group profit-loss-display">
              <strong>အမြတ်:</strong>{' '}
              {profitLoss === null ? (
                <span>-</span>
              ) : (
                <span className={formatProfitLoss(profitLoss).className}>
                  {formatProfitLoss(profitLoss).text}
                </span>
              )}
            </div>
            <div className="form-buttons">
              <button type="submit" className="btn-save">သိမ်းမည်</button>
              <button type="button" className="btn-cancel" onClick={resetForm}>ဖျက်သိမ်းမည်</button>
            </div>
          </form>
        </div>

        <div className="product-list-section">
          <div className="product-list-header">
            <h2>Product List</h2>
            <div className="product-list-actions-bar">
              <button type="button" className="btn-select-all" onClick={() => setSelected(new Set(products.map((p) => p.id)))}>
                Select All
              </button>
              <button type="button" className="btn-deselect-all" onClick={() => setSelected(new Set())}>
                Deselect All
              </button>
              <button
                type="button"
                className="btn-delete-selected"
                onClick={() => deleteProducts([...selected])}
              >
                Delete Selected
              </button>
            </div>
          </div>
          <div className="product-list">
            {products.map((product) => {
              const pl = getSoldPrice(product) - (product.purchasedPrice || 0);
              const plInfo = formatProfitLoss(pl);
              return (
                <div key={product.id} className="product-list-item">
                  <div className="product-list-checkbox">
                    <input
                      type="checkbox"
                      className="product-checkbox"
                      checked={selected.has(product.id)}
                      onChange={() => toggleSelect(product.id)}
                    />
                  </div>
                  <div className="product-list-info">
                    <div className="product-list-name">{product.name} ({product.productCode})</div>
                    <div className="product-list-details">
                      {product.category} • Qty: {product.quantity} •{' '}
                      <span className={plInfo.className}>{plInfo.text}</span>
                    </div>
                  </div>
                  <div className="product-list-price">{getSoldPrice(product).toLocaleString()} Ks</div>
                  <div className="product-list-actions">
                    <button type="button" className="btn-qr" onClick={() => showQrForProduct(product)}>QR</button>
                    <button type="button" className="btn-edit" onClick={() => startEdit(product)}>Edit</button>
                    <button type="button" className="btn-delete" onClick={() => deleteProduct(product.id)}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
