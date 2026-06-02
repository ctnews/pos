import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { RECEIPT_STORE } from '../../constants/defaults';
import { formatKs, getSoldPrice } from '../../utils/format';
import { printReceipt } from '../../utils/receiptPrint';

export function ReceiptModal() {
  const { openModal, finishCheckout, receiptData, taxRate } = useApp();
  const open = openModal === 'receipt';

  if (!receiptData) return null;

  const { sale, items, date } = receiptData;

  const handlePrint = () => {
    const ok = printReceipt(items, sale, taxRate, date);
    if (!ok) {
      alert('Please allow pop-ups to print the receipt.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={finishCheckout}
      title="Receipt"
      footer={
        <>
          <button type="button" className="btn-print" onClick={handlePrint}>
            Print again
          </button>
          <button type="button" className="btn-close" onClick={finishCheckout}>Close</button>
        </>
      }
    >
      <div className="receipt-content receipt-content-thermal">
        <div className="receipt-header">
          <h2>{RECEIPT_STORE.name}</h2>
          <p>{RECEIPT_STORE.addressLine1}</p>
          <p>{RECEIPT_STORE.addressLine2}</p>
          <p>Phone: {RECEIPT_STORE.phones}</p>
          <p>{date.toLocaleString()}</p>
        </div>
        <div className="receipt-items">
          <div className="receipt-items-header">
            <span>Item</span>
            <span>Total</span>
          </div>
          {items.map((item) => {
            const price = getSoldPrice(item);
            return (
              <div key={item.id} className="receipt-item">
                <div>
                  <div className="receipt-item-name">{item.name}</div>
                  <div className="receipt-item-qty">
                    {item.quantity} x {formatKs(price)}
                  </div>
                </div>
                <div>{formatKs(price * item.quantity)}</div>
              </div>
            );
          })}
        </div>
        <div className="receipt-total">
          <div className="receipt-total-row">
            <span>Subtotal:</span>
            <span>{formatKs(sale.subtotal)}</span>
          </div>
          <div className="receipt-total-row">
            <span>Tax ({taxRate}%):</span>
            <span>{formatKs(sale.tax)}</span>
          </div>
          <div className="receipt-total-row receipt-total-final">
            <span>TOTAL:</span>
            <span>{formatKs(sale.total)}</span>
          </div>
        </div>
        <div className="receipt-footer">
          <p>အားပေးမှုကို အထူးကျေးဇူးတင်ပါတယ်!</p>
          <p>ပျော်ရွှင်စရာနေ့လေးဖြစ်ပါစေ!</p>
        </div>
      </div>
    </Modal>
  );
}
