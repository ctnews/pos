import { useState, type FormEvent } from 'react';
import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';

export function ClearSalesModal() {
  const { openModal, hideModal, clearAllSales } = useApp();
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const open = openModal === 'clear-sales';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await clearAllSales();
    setSubmitting(false);
    if (ok) {
      setError('');
      hideModal();
      alert('All sales data has been cleared successfully.');
    } else {
      setError('Unable to clear sales data. Please try again.');
    }
  };

  const handleClose = () => {
    setError('');
    hideModal();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Clear All Sale Data"
      headerClassName="modal-header-danger"
    >
      <div className="login-content">
        <p className="clear-sales-warning">⚠️ WARNING: This action cannot be undone!</p>
        <p className="login-hint">
          All sales data will be permanently deleted.
        </p>
        <form onSubmit={handleSubmit}>
          {error && <div className="form-error">{error}</div>}
          <div className="form-buttons">
            <button type="submit" className="btn-danger" disabled={submitting}>
              {submitting ? 'Clearing...' : 'Clear All Data'}
            </button>
            <button type="button" className="btn-cancel" onClick={handleClose}>Cancel</button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
