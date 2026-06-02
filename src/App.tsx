import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { NavTabs } from './components/layout/NavTabs';
import { LoginPage } from './pages/LoginPage/LoginPage';
import { PosPage } from './pages/PosPage/PosPage';
import { ProductsPage } from './pages/ProductsPage/ProductsPage';
import { TaxPage } from './pages/TaxPage/TaxPage';
import { AnalyticsPage } from './pages/AnalyticsPage/AnalyticsPage';
import { UsersPage } from './pages/UsersPage/UsersPage';
import { PrinterPage } from './pages/PrinterPage/PrinterPage';
import { ReceiptModal } from './components/modals/ReceiptModal';
import { QRScannerModal } from './components/modals/QRScannerModal';
import { ClearSalesModal } from './components/modals/ClearSalesModal';
import { QRDisplayModal } from './components/modals/QRDisplayModal';

function AppContent() {
  const { activeTab, authReady, currentUser, isLoading, error } = useApp();

  if (!authReady) {
    return (
      <div className="container">
        <div className="app-loading">
          <div className="loading-spinner" aria-hidden />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <LoginPage />;
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="app-loading">
          <div className="loading-spinner" aria-hidden />
          <p>Loading your store...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="app-error">
          <h2>Unable to connect</h2>
          <p>{error}</p>
          <p className="app-error-hint">Start the API server with <code>npm run dev</code></p>
          <button type="button" className="btn-save" onClick={() => window.location.reload()}>
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <Header />
      <NavTabs />
      <main>
        {activeTab === 'pos' && <PosPage />}
        {activeTab === 'products' && <ProductsPage />}
        {activeTab === 'tax' && <TaxPage />}
        {activeTab === 'analytics' && <AnalyticsPage />}
        {activeTab === 'users' && <UsersPage />}
        {activeTab === 'printer' && <PrinterPage />}
      </main>
      <ReceiptModal />
      <QRScannerModal />
      <ClearSalesModal />
      <QRDisplayModal />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
