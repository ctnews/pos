import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateCartTotals } from '../../services/cartService';
import { formatKs, getSoldPrice } from '../../utils/format';

export function PosPage() {
  const {
    products,
    cart,
    taxRate,
    addProductToCart,
    changeCartQuantity,
    removeCartItem,
    checkout,
  } = useApp();
  const [search, setSearch] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        p.productCode.toLowerCase().includes(term),
    );
  }, [products, search]);

  const { subtotal, tax, total } = calculateCartTotals(cart, taxRate);

  return (
    <div className="tab-content active">
      <div className="main-content">
        <section className="products-section">
          <h2>Products</h2>
          <div className="search-bar">
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search products..."
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="products-grid">
            {filtered.length === 0 ? (
              <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#999', padding: '40px' }}>
                No products found
              </p>
            ) : (
              filtered.map((product) => {
                const outOfStock = (product.quantity || 0) === 0;
                return (
                  <div
                    key={product.id}
                    className={`product-card ${outOfStock ? 'out-of-stock' : ''}`}
                    onClick={() => !outOfStock && addProductToCart(product)}
                  >
                    <div className="product-name">{product.name}</div>
                    <div className="product-price">{formatKs(product.soldPrice)}</div>
                    <div className="product-category">{product.productCode} • {product.category}</div>
                    <div className={`product-quantity ${outOfStock ? 'out-of-stock' : ''}`}>
                      {outOfStock ? 'Out of Stock' : `Stock: ${product.quantity}`}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="cart-section">
          <h2>Shopping Cart</h2>
          <div className="cart-items">
            {cart.length === 0 ? (
              <p className="empty-cart">Cart is empty</p>
            ) : (
              cart.map((item) => {
                const price = getSoldPrice(item);
                return (
                  <div key={item.id} className="cart-item">
                    <div className="cart-item-info">
                      <div className="cart-item-name">{item.name}</div>
                      <div className="cart-item-details">
                        {item.category} • {formatKs(price)} each
                      </div>
                    </div>
                    <div className="cart-item-controls">
                      <div className="quantity-control">
                        <button type="button" className="quantity-btn" onClick={() => changeCartQuantity(item.id, -1)}>-</button>
                        <span className="quantity">{item.quantity}</span>
                        <button type="button" className="quantity-btn" onClick={() => changeCartQuantity(item.id, 1)}>+</button>
                      </div>
                      <div className="cart-item-price">{formatKs(price * item.quantity)}</div>
                      <button type="button" className="remove-item" onClick={() => removeCartItem(item.id)}>Remove</button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <span>{formatKs(subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>Tax ({taxRate}%):</span>
              <span>{formatKs(tax)}</span>
            </div>
            <div className="summary-row total">
              <span>Total:</span>
              <span>{formatKs(total)}</span>
            </div>
            <button
              type="button"
              className="btn-checkout"
              disabled={cart.length === 0}
              onClick={() => void checkout()}
            >
              Checkout
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
