import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { api } from '../../services/api';

export function PrinterPage() {
  const [silentPrint, setSilentPrint] = useState(false);
  const [receiptPrinter, setReceiptPrinter] = useState('');
  const [printers, setPrinters] = useState<string[]>([]);
  const [systemAvailable, setSystemAvailable] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [testing, setTesting] = useState(false);

  const printerOptions = useMemo(() => {
    const names = [...printers];
    if (receiptPrinter && !names.includes(receiptPrinter)) {
      names.unshift(receiptPrinter);
    }
    return names;
  }, [printers, receiptPrinter]);

  const selectedLabel = receiptPrinter || 'System default printer';

  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const [settings, printerList] = await Promise.all([
        api.getPrinterSettings(),
        api.listPrinters(),
      ]);
      setSilentPrint(settings.silentPrint);
      setReceiptPrinter(settings.receiptPrinter);
      setSystemAvailable(settings.system.available);
      setPrinters(printerList.printers);
    } catch (err) {
      setStatus({
        message: err instanceof Error ? err.message : 'Failed to load printer settings',
        type: 'error',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  const refreshPrinters = async () => {
    setRefreshing(true);
    setStatus(null);
    try {
      const { printers: list, system } = await api.listPrinters();
      setPrinters(list);
      setSystemAvailable(system.available);
      setStatus({
        message: list.length > 0 ? `${list.length} printer(s) found` : 'No printers found on this computer',
        type: list.length > 0 ? 'success' : 'error',
      });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({
        message: err instanceof Error ? err.message : 'Could not refresh printers',
        type: 'error',
      });
    } finally {
      setRefreshing(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      const updated = await api.updatePrinterSettings({ silentPrint, receiptPrinter });
      setSilentPrint(updated.silentPrint);
      setReceiptPrinter(updated.receiptPrinter);
      setStatus({ message: 'Settings saved', type: 'success' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({
        message: err instanceof Error ? err.message : 'Failed to save',
        type: 'error',
      });
    }
  };

  const handleTestPrint = async () => {
    setTesting(true);
    setStatus(null);
    try {
      await api.testPrint();
      setStatus({ message: 'Test receipt sent', type: 'success' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({
        message: err instanceof Error ? err.message : 'Test print failed',
        type: 'error',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="tab-content active">
        <div className="printer-page">
          <p className="printer-loading">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tab-content active">
      <div className="printer-page">
        <header className="printer-page-header">
          <h2>Printer</h2>
          <p>Choose the receipt printer used at checkout</p>
        </header>

        {!systemAvailable && (
          <div className="printer-alert" role="status">
            Install CUPS on Linux: <code>sudo apt install cups-client</code>
          </div>
        )}

        <form className="printer-form" onSubmit={handleSubmit}>
          <section className="printer-card">
            <div className="printer-setting-row">
              <div className="printer-setting-info">
                <span className="printer-setting-title">Auto-print</span>
                <span className="printer-setting-desc">Print on checkout, no dialog</span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={silentPrint}
                aria-label="Auto-print on checkout"
                className={`printer-toggle${silentPrint ? ' is-on' : ''}`}
                onClick={() => setSilentPrint((v) => !v)}
              >
                <span className="printer-toggle-thumb" />
              </button>
            </div>

            <div className="printer-card-divider" />

            <div className="printer-field">
              <div className="printer-field-top">
                <label htmlFor="receipt-printer" className="printer-field-label">
                  Printer
                </label>
                <button
                  type="button"
                  className="printer-refresh-btn"
                  disabled={refreshing}
                  onClick={() => void refreshPrinters()}
                >
                  {refreshing ? 'Refreshing…' : 'Refresh'}
                </button>
              </div>

              <div className="printer-select-box">
                <span className="printer-select-icon" aria-hidden>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M6 9V2h12v7M6 18H4v4h16v-4h-2M6 14h12v-8H6v8z" />
                  </svg>
                </span>
                <select
                  id="receipt-printer"
                  className="printer-select"
                  value={receiptPrinter}
                  onChange={(e) => setReceiptPrinter(e.target.value)}
                >
                  <option value="">System default printer</option>
                  {printerOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>

              <p className="printer-field-foot">
                Current: <strong>{selectedLabel}</strong>
                {printerOptions.length === 0 && (
                  <span className="printer-field-warn"> · No printers listed — try Refresh</span>
                )}
              </p>
            </div>
          </section>

          {status && (
            <div className={`printer-message printer-message-${status.type}`} role="status">
              {status.message}
            </div>
          )}

          <div className="printer-actions">
            <button type="submit" className="printer-btn printer-btn-primary">
              Save
            </button>
            <button
              type="button"
              className="printer-btn printer-btn-secondary"
              disabled={testing}
              onClick={() => void handleTestPrint()}
            >
              {testing ? 'Printing…' : 'Test print'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
