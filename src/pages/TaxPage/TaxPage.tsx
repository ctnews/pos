import { useState, type FormEvent } from 'react';
import { useApp } from '../../context/AppContext';

export function TaxPage() {
  const { taxRate, setTaxRate } = useApp();
  const [input, setInput] = useState(String(taxRate));
  const [status, setStatus] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(input) || 0;
    if (rate < 0 || rate > 100) {
      setStatus({ message: 'Tax rate must be between 0 and 100%', type: 'error' });
      return;
    }
    try {
      await setTaxRate(rate);
      setStatus({ message: `Tax rate updated successfully to ${rate}%`, type: 'success' });
      setTimeout(() => setStatus(null), 3000);
    } catch (err) {
      setStatus({
        message: err instanceof Error ? err.message : 'Failed to update tax rate',
        type: 'error',
      });
    }
  };

  return (
    <div className="tab-content active">
      <div className="product-management">
        <div className="product-form-section">
          <h2>Tax Management</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="tax-rate">Tax Rate (%)</label>
              <input
                id="tax-rate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
              <small className="form-hint">
                Enter the tax percentage to be applied to all sales. Default is 0%.
              </small>
            </div>
            <div className="form-buttons">
              <button type="submit" className="btn-save">Save Tax Rate</button>
              <button type="button" className="btn-cancel" onClick={() => setInput(String(taxRate))}>
                Cancel
              </button>
            </div>
            {status && (
              <div className={`tax-status tax-status-${status.type}`}>{status.message}</div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
