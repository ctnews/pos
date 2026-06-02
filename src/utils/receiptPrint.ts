import { RECEIPT_STORE, RECEIPT_WIDTH } from '../constants/defaults';
import { api } from '../services/api';
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

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function buildReceiptPrintHtml(
  items: ReceiptPrintItem[],
  sale: ReceiptPrintSale,
  taxRate: number,
  date: Date,
  autoPrint: boolean,
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

  const printScript = autoPrint
    ? `<script>
    window.onload = function() {
      window.print();
      window.onafterprint = function() { window.close(); };
      setTimeout(function() { window.close(); }, 3000);
    };
  </script>`
    : '';

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
  ${printScript}
</body>
</html>`;
}

function buildSilentPrintPayload(
  items: ReceiptPrintItem[],
  sale: ReceiptPrintSale,
  taxRate: number,
  date: Date,
) {
  return {
    storeName: RECEIPT_STORE.name,
    addressLine1: RECEIPT_STORE.addressLine1,
    addressLine2: RECEIPT_STORE.addressLine2,
    phones: RECEIPT_STORE.phones,
    date: date.toLocaleString(),
    taxRate,
    subtotal: sale.subtotal,
    tax: sale.tax,
    total: sale.total,
    items: items.map((item) => {
      const unitPrice = getSoldPrice(item);
      return {
        name: item.name,
        quantity: item.quantity,
        unitPrice,
        lineTotal: unitPrice * item.quantity,
      };
    }),
  };
}

/** Send receipt to server printer (no browser dialog). */
async function printReceiptSilent(
  items: ReceiptPrintItem[],
  sale: ReceiptPrintSale,
  taxRate: number,
  date: Date,
): Promise<boolean> {
  try {
    await api.printReceipt(buildSilentPrintPayload(items, sale, taxRate, date));
    return true;
  } catch {
    return false;
  }
}

/** Browser print fallback (single print dialog). */
function printReceiptBrowser(
  items: ReceiptPrintItem[],
  sale: ReceiptPrintSale,
  taxRate: number,
  date: Date,
): boolean {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText =
    'position:fixed;right:0;bottom:0;width:0;height:0;border:none;visibility:hidden';
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    const win = window.open('', '_blank', 'width=280,height=800');
    if (!win) return false;
    win.document.write(buildReceiptPrintHtml(items, sale, taxRate, date, true));
    win.document.close();
    return true;
  }

  doc.open();
  doc.write(buildReceiptPrintHtml(items, sale, taxRate, date, false));
  doc.close();

  const win = iframe.contentWindow;
  if (!win) {
    document.body.removeChild(iframe);
    return false;
  }

  const cleanup = () => {
    if (iframe.parentNode) document.body.removeChild(iframe);
  };

  win.onafterprint = cleanup;
  setTimeout(cleanup, 5000);

  win.focus();
  win.print();

  return true;
}

let printInProgress = false;

export type PrintResult = 'silent' | 'browser' | 'failed';

/**
 * Print receipt: silent server print when configured, else one browser dialog.
 */
export async function printReceipt(
  items: ReceiptPrintItem[],
  sale: ReceiptPrintSale,
  taxRate: number,
  date: Date,
): Promise<PrintResult> {
  if (printInProgress) return 'silent';
  printInProgress = true;

  try {
    const silent = await printReceiptSilent(items, sale, taxRate, date);
    if (silent) return 'silent';

    if (printReceiptBrowser(items, sale, taxRate, date)) {
      return 'browser';
    }

    return 'failed';
  } finally {
    printInProgress = false;
  }
}
