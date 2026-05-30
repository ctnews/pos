import { Modal } from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { RECEIPT_STORE, RECEIPT_WIDTH } from '../../constants/defaults';
import { formatKs, getSoldPrice } from '../../utils/format';

const RECEIPT_PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    font-size: 10px;
    line-height: 1.35;
    width: ${RECEIPT_WIDTH};
    max-width: ${RECEIPT_WIDTH};
    margin: 0 auto;
    padding: 3mm 2mm;
    color: #000;
  }
  .receipt-header {
    text-align: center;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px dashed #333;
  }
  .receipt-header h2 { font-size: 13px; margin-bottom: 4px; }
  .receipt-header p { font-size: 9px; line-height: 1.35; }
  .receipt-items-header {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    font-size: 9px;
    margin-bottom: 6px;
    padding-bottom: 4px;
    border-bottom: 1px dashed #333;
  }
  .receipt-item {
    display: flex;
    justify-content: space-between;
    gap: 4px;
    margin-bottom: 4px;
    padding-bottom: 4px;
    border-bottom: 1px dotted #ccc;
    font-size: 9px;
  }
  .item-name { font-weight: bold; word-break: break-word; }
  .item-qty { font-size: 8px; color: #444; }
  .receipt-total {
    margin-top: 8px;
    padding-top: 6px;
    border-top: 1px solid #333;
    font-size: 9px;
  }
  .receipt-total-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
  .receipt-total-final {
    font-weight: bold;
    font-size: 11px;
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px solid #333;
  }
  .receipt-footer {
    text-align: center;
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px dashed #ccc;
    font-size: 9px;
  }
  @page { size: ${RECEIPT_WIDTH} auto; margin: 0; }
  @media print {
    html, body { width: ${RECEIPT_WIDTH}; max-width: ${RECEIPT_WIDTH}; }
  }
`;

function buildReceiptPrintHtml(
  items: { id: number; name: string; quantity: number; soldPrice?: number; price?: number }[],
  sale: { subtotal: number; tax: number; total: number },
  taxRate: number,
  date: Date,
): string {
  const itemRows = items
    .map((item) => {
      const price = getSoldPrice(item);
      return `
        <div class="receipt-item">
          <div>
            <div class="item-name">${item.name}</div>
            <div class="item-qty">${item.quantity} x ${formatKs(price)}</div>
          </div>
          <div>${formatKs(price * item.quantity)}</div>
        </div>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Receipt</title>
  <style>${RECEIPT_PRINT_STYLES}</style>
</head>
<body>
  <div class="receipt-header">
    <h2>${RECEIPT_STORE.name}</h2>
    <p>${RECEIPT_STORE.addressLine1}</p>
    <p>${RECEIPT_STORE.addressLine2}</p>
    <p>Phone: ${RECEIPT_STORE.phones}</p>
    <p>${date.toLocaleString()}</p>
  </div>
  <div class="receipt-items">
    <div class="receipt-items-header">
      <span>Item</span>
      <span>Total</span>
    </div>
    ${itemRows}
  </div>
  <div class="receipt-total">
    <div class="receipt-total-row"><span>Subtotal:</span><span>${formatKs(sale.subtotal)}</span></div>
    <div class="receipt-total-row"><span>Tax (${taxRate}%):</span><span>${formatKs(sale.tax)}</span></div>
    <div class="receipt-total-row receipt-total-final"><span>TOTAL:</span><span>${formatKs(sale.total)}</span></div>
  </div>
  <div class="receipt-footer">
    <p>အားပေးမှုကို အထူးကျေးဇူးတင်ပါတယ်!</p>
    <p>ပျော်ရွှင်စရာနေ့လေးဖြစ်ပါစေ!</p>
  </div>
  <script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
    };
  </script>
</body>
</html>`;
}

function printReceipt(
  items: { id: number; name: string; quantity: number; soldPrice?: number; price?: number }[],
  sale: { subtotal: number; tax: number; total: number },
  taxRate: number,
  date: Date,
) {
  const printWindow = window.open('', '_blank', 'width=260,height=700');
  if (!printWindow) {
    alert('Please allow pop-ups to print the receipt.');
    return;
  }
  printWindow.document.write(buildReceiptPrintHtml(items, sale, taxRate, date));
  printWindow.document.close();
}

export function ReceiptModal() {
  const { openModal, finishCheckout, receiptData, taxRate } = useApp();
  const open = openModal === 'receipt';

  if (!receiptData) return null;

  const { sale, items, date } = receiptData;

  return (
    <Modal
      open={open}
      onClose={finishCheckout}
      title="Receipt"
      footer={
        <>
          <button
            type="button"
            className="btn-print"
            onClick={() => printReceipt(items, sale, taxRate, date)}
          >
            Print
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
