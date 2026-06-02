import { RECEIPT_STORE, RECEIPT_WIDTH } from '../constants/defaults';
import { formatKs, getSoldPrice } from './format';

export interface ReceiptPrintItem {
  id: number;
  name: string;
  quantity: number;
  soldPrice?: number;
  price?: number;
}

export interface ReceiptPrintSale {
  subtotal: number;
  tax: number;
  total: number;
}

const RECEIPT_PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Courier New', monospace;
    font-size: 14px;
    line-height: 1.4;
    width: ${RECEIPT_WIDTH};
    max-width: ${RECEIPT_WIDTH};
    margin: 0 auto;
    padding: 3mm 2mm;
    color: #000;
  }
  .receipt-header {
    text-align: center;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px dashed #333;
  }
  .receipt-header h2 { font-size: 18px; margin-bottom: 5px; font-weight: bold; }
  .receipt-header p { font-size: 12px; line-height: 1.4; }
  .receipt-items-header {
    display: flex;
    justify-content: space-between;
    font-weight: bold;
    font-size: 13px;
    margin-bottom: 8px;
    padding-bottom: 5px;
    border-bottom: 1px dashed #333;
  }
  .receipt-item {
    display: flex;
    justify-content: space-between;
    gap: 6px;
    margin-bottom: 6px;
    padding-bottom: 5px;
    border-bottom: 1px dotted #ccc;
    font-size: 13px;
  }
  .item-name { font-weight: bold; word-break: break-word; }
  .item-qty { font-size: 11px; color: #444; margin-top: 2px; }
  .receipt-total {
    margin-top: 10px;
    padding-top: 8px;
    border-top: 1px solid #333;
    font-size: 13px;
  }
  .receipt-total-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
  .receipt-total-final {
    font-weight: bold;
    font-size: 16px;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #333;
  }
  .receipt-footer {
    text-align: center;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px dashed #ccc;
    font-size: 12px;
    line-height: 1.45;
  }
  @page { size: ${RECEIPT_WIDTH} auto; margin: 0; }
  @media print {
    html, body { width: ${RECEIPT_WIDTH}; max-width: ${RECEIPT_WIDTH}; }
  }
`;

function buildReceiptPrintHtml(
  items: ReceiptPrintItem[],
  sale: ReceiptPrintSale,
  taxRate: number,
  date: Date,
): string {
  const itemRows = items
    .map((item) => {
      const price = getSoldPrice(item);
      return `
        <div class="receipt-item">
          <div>
            <div class="item-name">${escapeHtml(item.name)}</div>
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
    <h2>${escapeHtml(RECEIPT_STORE.name)}</h2>
    <p>${escapeHtml(RECEIPT_STORE.addressLine1)}</p>
    <p>${escapeHtml(RECEIPT_STORE.addressLine2)}</p>
    <p>Phone: ${escapeHtml(RECEIPT_STORE.phones)}</p>
    <p>${escapeHtml(date.toLocaleString())}</p>
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
      setTimeout(function() { window.close(); }, 3000);
    };
  </script>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Opens print dialog for default printer. Returns false if pop-up was blocked. */
export function printReceipt(
  items: ReceiptPrintItem[],
  sale: ReceiptPrintSale,
  taxRate: number,
  date: Date,
): boolean {
  const printWindow = window.open('', '_blank', 'width=280,height=800');
  if (!printWindow) {
    return false;
  }
  printWindow.document.write(buildReceiptPrintHtml(items, sale, taxRate, date));
  printWindow.document.close();
  return true;
}
