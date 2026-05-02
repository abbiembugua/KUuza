/**
 * generateReceipt.js
 * Generates a KUuza PDF receipt — single-item or bulk (multi-item).
 */

import { jsPDF } from 'jspdf';

const EMERALD = [5, 150, 105];
const WHITE   = [255, 255, 255];
const INK     = [17, 24, 39];
const MUTED   = [107, 114, 128];
const LINE    = [229, 231, 235];
const SOFT    = [240, 253, 250];

const formatMoney = (value) => {
  const amount = parseFloat(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return 'Negotiable';
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatQuantity = (value) => {
  const q = Number(value || 1);
  return Number.isFinite(q) && q > 0 ? q : 1;
};

const formatShortDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-KE', { day: '2-digit', month: 'short', year: 'numeric' });
};

const formatIssuedAt = (date) =>
  date.toLocaleDateString('en-KE', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  }) +
  ' at ' +
  date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true });

const formatPayment = (method) => ({
  mpesa:             'M-Pesa',
  cash_on_pickup:    'Cash on Pickup',
  pay_after_service: 'Pay After Service',
}[method] ?? (method || 'Pending'));

const formatStatus = (transaction) => {
  const s = transaction?.status;
  if (s === 'completed' || s === 'auto_completed') return 'Completed';
  if (s === 'cancelled') return 'Cancelled';
  return 'Pending';
};

const formatCategory = (value) =>
  value ? value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '-';

// ── Shared helpers ────────────────────────────────────────────────────────────

function drawHeader(doc, { pageWidth, headerHeight, recipientName, receiptNo, now }) {
  doc.setFillColor(...EMERALD);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.text('KUuza', 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(200, 245, 230);
  doc.text('Kenyatta University Official Marketplace', 14, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...WHITE);
  doc.text('Receipt', pageWidth - 14, 10, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(200, 245, 230);
  doc.text('FOR', pageWidth - 14, 16, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...WHITE);
  doc.text(String(recipientName).toUpperCase(), pageWidth - 14, 22, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(200, 245, 230);
  doc.text(`Reference: ${receiptNo}`, pageWidth - 14, 28, { align: 'right' });
  doc.text(`Issued on: ${formatIssuedAt(now)}`, pageWidth - 14, 34, { align: 'right' });

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.3);
  doc.line(0, headerHeight, pageWidth, headerHeight);
}

function drawKeyValue(doc, label, value, y, pageWidth, options = {}) {
  const { highlight = false } = options;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  doc.text(label.toUpperCase(), 14, y);

  doc.setFont('helvetica', highlight ? 'bold' : 'normal');
  doc.setFontSize(highlight ? 11 : 10);
  doc.setTextColor(...(highlight ? EMERALD : INK));
  doc.text(String(value || '-'), pageWidth - 14, y, { align: 'right' });
}

function drawFooter(doc, pageWidth, pageHeight) {
  const footerY = pageHeight - 12;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.2);
  doc.line(14, footerY - 4, pageWidth - 14, footerY - 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text('KUuza · hello.kuuza@gmail.com', 14, footerY);
  doc.text('Automatically generated. Valid without a signature.', pageWidth - 14, footerY, { align: 'right' });
}

// ── Single-item receipt ───────────────────────────────────────────────────────

function generateSingleReceipt({ listing, transaction, scheduledDate, scheduledTime, paymentMethod, contact }) {
  const doc        = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const headerHeight = 36;
  const now        = new Date();

  const receiptNo      = transaction?.id
    ? `#${String(transaction.id).slice(0, 8).toUpperCase()}`
    : `#${Date.now().toString(36).toUpperCase()}`;
  const isService      = listing?.listing_type === 'service';
  const scheduleLabel  = isService ? 'Service date' : 'Pickup date';
  const scheduleValue  = scheduledDate ? formatShortDate(scheduledDate) : '-';
  const scheduleDetail = !isService && scheduledTime ? `${scheduleValue} at ${scheduledTime}` : scheduleValue;
  const sellerName     = listing?.seller_name || transaction?.seller_name || 'KU Student';
  const recipientName  = transaction?.buyer_name || 'KU Student';
  const contactValue   = contact?.contact_value || '-';
  const quantity       = formatQuantity(transaction?.quantity);
  const unitPrice      = parseFloat(transaction?.agreed_price || listing?.price || 0);
  const totalPrice     = Number.isFinite(unitPrice) && unitPrice > 0
    ? unitPrice * quantity
    : transaction?.agreed_price || listing?.price;

  drawHeader(doc, { pageWidth, headerHeight, recipientName, receiptNo, now });

  doc.setFillColor(...SOFT);
  doc.roundedRect(14, 40, pageWidth - 28, 24, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('Transaction summary', 18, 47);
  doc.setFontSize(16);
  doc.setTextColor(...EMERALD);
  doc.text(formatMoney(totalPrice), 18, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(`Prepared for ${recipientName}`, 18, 61);

  let y = 76;
  drawKeyValue(doc, 'Listing',    listing?.title || '-',             y, pageWidth); y += 10;
  drawKeyValue(doc, 'Category',   formatCategory(listing?.category), y, pageWidth); y += 10;
  drawKeyValue(doc, 'Seller',     sellerName,                        y, pageWidth); y += 10;
  if (!isService) { drawKeyValue(doc, 'Quantity', quantity,          y, pageWidth); y += 10; }
  drawKeyValue(doc, scheduleLabel, scheduleDetail,                   y, pageWidth); y += 10;
  drawKeyValue(doc, 'Payment',    formatPayment(paymentMethod),      y, pageWidth); y += 10;
  drawKeyValue(doc, 'Status',     formatStatus(transaction),         y, pageWidth); y += 10;

  if (transaction?.mpesa_receipt) {
    drawKeyValue(doc, 'M-Pesa code', transaction.mpesa_receipt, y, pageWidth); y += 10;
  }
  if (contactValue !== '-') {
    drawKeyValue(doc, 'Seller contact', contactValue, y, pageWidth); y += 10;
  }

  y += 2;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.2);
  doc.line(14, y, pageWidth - 14, y);
  y += 10;
  drawKeyValue(doc, 'Total', formatMoney(totalPrice), y, pageWidth, { highlight: true });

  drawFooter(doc, pageWidth, pageHeight);
  doc.save(`KUuza_Receipt_${receiptNo.replace('#', '')}.pdf`);
}

// ── Bulk receipt ──────────────────────────────────────────────────────────────

function generateBulkReceipt({ bulkItems, bulkTotal, bulkTxns, scheduledDate, scheduledTime, paymentMethod }) {
  const doc        = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth  = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin     = 14;
  const headerHeight = 36;
  const now        = new Date();

  const firstTxn      = bulkTxns?.[0];
  const receiptNo     = firstTxn?.id
    ? `#${String(firstTxn.id).slice(0, 8).toUpperCase()}-BULK`
    : `#${Date.now().toString(36).toUpperCase()}-BULK`;
  const recipientName = firstTxn?.buyer_name || 'KU Student';
  const scheduleValue = scheduledDate ? formatShortDate(scheduledDate) : '-';
  const scheduleDetail = scheduledTime ? `${scheduleValue} at ${scheduledTime}` : scheduleValue;

  drawHeader(doc, { pageWidth, headerHeight, recipientName, receiptNo, now });

  // Summary banner
  doc.setFillColor(...SOFT);
  doc.roundedRect(margin, 40, pageWidth - margin * 2, 24, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text(`Bulk purchase — ${bulkItems.length} item${bulkItems.length === 1 ? '' : 's'}`, margin + 4, 47);
  doc.setFontSize(16);
  doc.setTextColor(...EMERALD);
  doc.text(formatMoney(bulkTotal), margin + 4, 55);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(`Prepared for ${recipientName}`, margin + 4, 61);

  let y = 74;

  // Column headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text('ITEM', margin, y);
  doc.text('QTY',        pageWidth - margin - 34, y, { align: 'right' });
  doc.text('UNIT PRICE', pageWidth - margin - 16, y, { align: 'right' });
  doc.text('SUBTOTAL',   pageWidth - margin,      y, { align: 'right' });
  y += 3;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 6;

  // Item rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  bulkItems.forEach((item, index) => {
    const qty      = formatQuantity(item.quantity);
    const unit     = parseFloat(item.price || 0);
    const subtotal = unit * qty;
    const txn      = bulkTxns?.[index];
    const seller   = item.seller_name || txn?.seller_name || 'KU Student';

    // Add a new page if we're running out of space
    if (y > pageHeight - 50) {
      doc.addPage();
      drawFooter(doc, pageWidth, pageHeight);
      y = 20;
    }

    const maxTitleWidth = pageWidth - margin * 2 - 62;
    const titleLine = doc.splitTextToSize(item.title || '-', maxTitleWidth)[0];

    doc.setTextColor(...INK);
    doc.text(titleLine, margin, y);

    doc.setTextColor(...MUTED);
    doc.text(String(qty), pageWidth - margin - 34, y, { align: 'right' });

    doc.setTextColor(...INK);
    doc.text(formatMoney(unit), pageWidth - margin - 16, y, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...EMERALD);
    doc.text(formatMoney(subtotal), pageWidth - margin, y, { align: 'right' });
    doc.setFont('helvetica', 'normal');

    // Seller sub-row
    y += 5;
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(`Seller: ${seller}`, margin, y);
    if (txn?.mpesa_receipt) {
      doc.text(`M-Pesa: ${txn.mpesa_receipt}`, pageWidth - margin, y, { align: 'right' });
    }

    doc.setFontSize(9);
    y += 3;

    // Row divider
    doc.setDrawColor(...LINE);
    doc.setLineWidth(0.1);
    doc.line(margin, y, pageWidth - margin, y);
    y += 6;
  });

  y += 2;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  drawKeyValue(doc, 'Pickup date', scheduleDetail,              y, pageWidth); y += 10;
  drawKeyValue(doc, 'Payment',     formatPayment(paymentMethod), y, pageWidth); y += 10;
  drawKeyValue(doc, 'Status',      formatStatus(firstTxn),       y, pageWidth); y += 10;

  y += 2;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  drawKeyValue(doc, `Total (${bulkItems.length} items)`, formatMoney(bulkTotal), y, pageWidth, { highlight: true });

  drawFooter(doc, pageWidth, pageHeight);
  doc.save(`KUuza_Receipt_${receiptNo.replace('#', '')}.pdf`);
}

// ── Public export ─────────────────────────────────────────────────────────────

export function generateReceipt({
  listing, transaction, scheduledDate, scheduledTime, paymentMethod, contact,
  isBulk = false, bulkItems = [], bulkTotal = 0, bulkTxns = [],
}) {
  if (isBulk) {
    generateBulkReceipt({ bulkItems, bulkTotal, bulkTxns, scheduledDate, scheduledTime, paymentMethod });
  } else {
    generateSingleReceipt({ listing, transaction, scheduledDate, scheduledTime, paymentMethod, contact });
  }
}