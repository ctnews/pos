import { execFile } from 'child_process';
import { access, writeFile, unlink } from 'fs/promises';
import { constants } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import { getStore } from '../store/index.js';

const execFileAsync = promisify(execFile);

const LINE_WIDTH = 32;

const LINUX_PRINT_BINS = [
  '/usr/bin/lp',
  '/usr/bin/lpr',
  'lp',
  'lpr',
] as const;

export interface ReceiptLineItem {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface ReceiptPayload {
  storeName: string;
  addressLine1: string;
  addressLine2: string;
  phones: string;
  date: string;
  items: ReceiptLineItem[];
  subtotal: number;
  tax: number;
  total: number;
  taxRate: number;
}

function formatKs(amount: number): string {
  return `${Math.round(amount).toLocaleString('en-US')} Ks`;
}

function center(text: string): string {
  if (text.length >= LINE_WIDTH) return text.slice(0, LINE_WIDTH);
  const pad = Math.floor((LINE_WIDTH - text.length) / 2);
  return ' '.repeat(pad) + text;
}

function padLine(left: string, right: string): string {
  const l = left.length > LINE_WIDTH - right.length - 1
    ? left.slice(0, LINE_WIDTH - right.length - 1)
    : left;
  const spaces = LINE_WIDTH - l.length - right.length;
  return l + ' '.repeat(Math.max(1, spaces)) + right;
}

function wrapName(name: string): string[] {
  if (name.length <= LINE_WIDTH) return [name];
  const lines: string[] = [];
  let rest = name;
  while (rest.length > LINE_WIDTH) {
    lines.push(rest.slice(0, LINE_WIDTH));
    rest = rest.slice(LINE_WIDTH);
  }
  if (rest) lines.push(rest);
  return lines;
}

export function buildTextReceipt(data: ReceiptPayload): string {
  const lines: string[] = [
    center(data.storeName),
    center(data.addressLine1),
    center(data.addressLine2),
    center(`Phone: ${data.phones}`),
    center(data.date),
    '-'.repeat(LINE_WIDTH),
    padLine('Item', 'Total'),
    '-'.repeat(LINE_WIDTH),
  ];

  for (const item of data.items) {
    const nameLines = wrapName(item.name);
    lines.push(nameLines[0]);
    for (let i = 1; i < nameLines.length; i++) {
      lines.push(nameLines[i]);
    }
    lines.push(
      padLine(
        `  ${item.quantity} x ${formatKs(item.unitPrice)}`,
        formatKs(item.lineTotal),
      ),
    );
  }

  lines.push(
    '-'.repeat(LINE_WIDTH),
    padLine('Subtotal:', formatKs(data.subtotal)),
    padLine(`Tax (${data.taxRate}%):`, formatKs(data.tax)),
    padLine('TOTAL:', formatKs(data.total)),
    '-'.repeat(LINE_WIDTH),
    center('အားပေးမှုကို အထူးကျေးဇူးတင်ပါတယ်!'),
    center('ပျော်ရွှင်စရာနေ့လေးဖြစ်ပါစေ!'),
    '',
    '',
  );

  return lines.join('\n');
}

export interface PrinterConfig {
  silentPrint: boolean;
  receiptPrinter: string;
}

export async function getPrinterConfig(): Promise<PrinterConfig> {
  const envFallback: PrinterConfig = {
    silentPrint: process.env.SILENT_PRINT === 'true',
    receiptPrinter: process.env.RECEIPT_PRINTER?.trim() ?? '',
  };
  if (process.env.VERCEL) {
    return { silentPrint: false, receiptPrinter: '' };
  }
  try {
    const s = await getStore().getSettings();
    return {
      silentPrint: s.silentPrint ?? envFallback.silentPrint,
      receiptPrinter: (s.receiptPrinter || envFallback.receiptPrinter).trim(),
    };
  } catch {
    return envFallback;
  }
}

export async function isSilentPrintEnabled(): Promise<boolean> {
  if (process.env.VERCEL) return false;
  const cfg = await getPrinterConfig();
  return cfg.silentPrint;
}

export async function getPrintSystemStatus(): Promise<{
  available: boolean;
  platform: string;
  hint: string;
}> {
  if (process.env.VERCEL) {
    return {
      available: false,
      platform: 'vercel',
      hint: 'Silent print only works on the local POS server, not Vercel.',
    };
  }
  if (process.platform === 'win32') {
    return {
      available: true,
      platform: 'win32',
      hint: 'Uses Windows print command. Set printer name from Settings → Printers.',
    };
  }
  try {
    await resolveLinuxPrintBin();
    return {
      available: true,
      platform: process.platform,
      hint: 'CUPS is available. Use lpstat -p to see printer names.',
    };
  } catch (err) {
    return {
      available: false,
      platform: process.platform,
      hint: err instanceof Error ? err.message : 'Print tools not installed',
    };
  }
}

export async function listAvailablePrinters(): Promise<string[]> {
  if (process.env.VERCEL) return [];

  if (process.platform === 'win32') {
    try {
      const { stdout } = await execFileAsync(
        'powershell',
        ['-NoProfile', '-Command', 'Get-Printer | Select-Object -ExpandProperty Name'],
        { windowsHide: true },
      );
      return stdout
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
    } catch {
      return [];
    }
  }

  try {
    const { stdout } = await execFileAsync('lpstat', ['-p']);
    const names: string[] = [];
    for (const line of stdout.split('\n')) {
      const match = line.match(/^printer\s+(\S+)/);
      if (match) names.push(match[1]);
    }
    return names;
  } catch {
    return [];
  }
}

async function fileExecutable(path: string): Promise<boolean> {
  try {
    await access(path, constants.X_OK);
    return true;
  } catch {
    return false;
  }
}

async function resolveLinuxPrintBin(): Promise<{ bin: string; useLpr: boolean }> {
  const custom = process.env.PRINT_COMMAND?.trim();
  if (custom) {
    return { bin: custom, useLpr: custom.includes('lpr') };
  }

  for (const bin of LINUX_PRINT_BINS) {
    if (await fileExecutable(bin)) {
      return { bin, useLpr: bin.endsWith('lpr') };
    }
  }

  throw new Error(
    'Print command not found. Install CUPS: sudo apt install cups-client\n' +
      'Then list printers: lpstat -p',
  );
}

async function runLinuxPrint(filePath: string, printer?: string): Promise<void> {
  const { bin, useLpr } = await resolveLinuxPrintBin();
  const args = useLpr
    ? printer
      ? ['-P', printer, filePath]
      : [filePath]
    : printer
      ? ['-d', printer, filePath]
      : [filePath];
  await execFileAsync(bin, args);
}

export async function sendToPrinter(content: string, printerName?: string): Promise<void> {
  const cfg = await getPrinterConfig();
  const printer = (printerName ?? cfg.receiptPrinter).trim() || undefined;
  const filePath = join(tmpdir(), `pos-receipt-${Date.now()}.txt`);

  try {
    await writeFile(filePath, content, 'utf8');

    if (process.platform === 'win32') {
      const args = printer ? [`/D:${printer}`, filePath] : [filePath];
      await execFileAsync('print', args, { windowsHide: true });
    } else {
      await runLinuxPrint(filePath, printer);
    }
  } finally {
    await unlink(filePath).catch(() => undefined);
  }
}

export async function printReceiptSilent(data: ReceiptPayload): Promise<void> {
  if (!(await isSilentPrintEnabled())) {
    throw new Error('Silent print is disabled. Enable it in Admin → Printer settings.');
  }
  const text = buildTextReceipt(data);
  await sendToPrinter(text);
}

export async function printTestPage(): Promise<void> {
  const cfg = await getPrinterConfig();
  const sample: ReceiptPayload = {
    storeName: 'Hello Baby',
    addressLine1: 'Test receipt',
    addressLine2: 'Printer settings',
    phones: '000000000',
    date: new Date().toLocaleString(),
    items: [
      { name: 'Test Item', quantity: 1, unitPrice: 1000, lineTotal: 1000 },
    ],
    subtotal: 1000,
    tax: 0,
    total: 1000,
    taxRate: 0,
  };
  await sendToPrinter(buildTextReceipt(sample), cfg.receiptPrinter);
}
