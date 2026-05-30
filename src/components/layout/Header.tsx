import { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RECEIPT_STORE } from '../../constants/defaults';

export function Header() {
  const { clearCart, logout, currentUser, cart } = useApp();
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const dateLong = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const roleLabel = currentUser?.role === 'admin' ? 'Admin' : 'Cashier';

  return (
    <header className="app-header">
      <div className="header-brand">
        <img src="/icon.png" alt="" className="header-logo" />
        <div className="header-brand-text">
          <h1>{RECEIPT_STORE.name}</h1>
          <p className="header-subtitle">Point of Sale</p>
        </div>
      </div>

      <span className="header-date-mobile">{dateStr}</span>

      <div className="header-actions">
        <span className="header-date">{dateLong}</span>
        {currentUser && (
          <span className="header-user">
            {currentUser.username}
            <span className="header-user-role">{roleLabel}</span>
          </span>
        )}
        <button
          type="button"
          className="btn-header btn-header-ghost"
          onClick={() => {
            if (cart.length > 0 && confirm('Clear all items from the cart?')) {
              clearCart();
            }
          }}
        >
          Clear Cart
          {cart.length > 0 && <span className="cart-badge">{cart.length}</span>}
        </button>
        <button type="button" className="btn-header btn-header-danger" onClick={() => logout()}>
          Logout
        </button>
      </div>
    </header>
  );
}
