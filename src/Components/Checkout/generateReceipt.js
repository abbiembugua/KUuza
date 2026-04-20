/**
 * generateReceipt.js
 * Generates a brief KUuza PDF receipt styled to match the purchases report.
 */

import { jsPDF } from 'jspdf';

const EMERALD = [5, 150, 105];
const WHITE = [255, 255, 255];
const INK = [17, 24, 39];
const MUTED = [107, 114, 128];
const LINE = [229, 231, 235];
const SOFT = [240, 253, 250];

const formatMoney = (value) => {
  const amount = parseFloat(value || 0);
  if (!Number.isFinite(amount) || amount <= 0) return 'Negotiable';
  return `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatShortDate = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString('en-KE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatIssuedAt = (date) =>
  date.toLocaleDateString('en-KE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }) +
  ' at ' +
  date.toLocaleTimeString('en-KE', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

const formatPayment = (method) => {
  const labels = {
    mpesa: 'M-Pesa',
    cash_on_pickup: 'Cash',
    pay_after_service: 'Pay after service',
  };

  return labels[method] ?? (method || 'Pending');
};

const formatStatus = (transaction) => {
  const status = transaction?.status;
  if (status === 'completed' || status === 'auto_completed') return 'Completed';
  if (status === 'cancelled') return 'Cancelled';
  return 'Pending';
};

const formatCategory = (value) => {
  if (!value) return '-';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
};

export function generateReceipt({ listing, transaction, scheduledDate, scheduledTime, paymentMethod, contact }) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const headerHeight = 30;
  const now = new Date();
  const receiptNo = transaction?.id
    ? `#${String(transaction.id).slice(0, 8).toUpperCase()}`
    : `#${Date.now().toString(36).toUpperCase()}`;
  const isService = listing?.listing_type === 'service';
  const scheduleLabel = isService ? 'Service date' : 'Pickup date';
  const scheduleValue = scheduledDate ? formatShortDate(scheduledDate) : '-';
  const scheduleDetail = !isService && scheduledTime ? `${scheduleValue} at ${scheduledTime}` : scheduleValue;
  const sellerName = listing?.seller_name || transaction?.seller_username || 'KU Student';
  const contactValue = contact?.contact_value || '-';

  const drawKeyValue = (label, value, y, options = {}) => {
    const { highlight = false } = options;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), margin, y);

    doc.setFont('helvetica', highlight ? 'bold' : 'normal');
    doc.setFontSize(highlight ? 11 : 10);
    doc.setTextColor(...(highlight ? EMERALD : INK));
    doc.text(String(value || '-'), pageWidth - margin, y, { align: 'right' });
  };

  doc.setFillColor(...EMERALD);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...WHITE);
  doc.text('KUuza', margin, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(200, 245, 230);
  doc.text('Kenyatta University Official Marketplace', margin, 23);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Receipt', pageWidth - margin, 13, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Reference: ${receiptNo}`, pageWidth - margin, 20, { align: 'right' });
  doc.text(`Issued: ${formatIssuedAt(now)}`, pageWidth - margin, 25, { align: 'right' });

  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.3);
  doc.line(0, headerHeight, pageWidth, headerHeight);

  doc.setFillColor(...SOFT);
  doc.roundedRect(margin, 40, pageWidth - margin * 2, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  doc.text('Transaction summary', margin + 4, 47);
  doc.setFontSize(16);
  doc.setTextColor(...EMERALD);
  doc.text(formatMoney(transaction?.agreed_price || listing?.price), margin + 4, 55);

  let y = 70;

  drawKeyValue('Listing', listing?.title || '-', y);
  y += 10;
  drawKeyValue('Category', formatCategory(listing?.category), y);
  y += 10;
  drawKeyValue('Seller', sellerName, y);
  y += 10;
  drawKeyValue(scheduleLabel, scheduleDetail, y);
  y += 10;
  drawKeyValue('Payment', formatPayment(paymentMethod), y);
  y += 10;
  drawKeyValue('Status', formatStatus(transaction), y);
  y += 10;

  if (transaction?.mpesa_receipt) {
    drawKeyValue('M-Pesa code', transaction.mpesa_receipt, y);
    y += 10;
  }

  if (contactValue !== '-') {
    drawKeyValue('Seller contact', contactValue, y);
    y += 10;
  }

  y += 2;
  doc.setDrawColor(...LINE);
  doc.setLineWidth(0.2);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;
  drawKeyValue('Total', formatMoney(transaction?.agreed_price || listing?.price), y, { highlight: true });

  const footerY = pageHeight - 12;
  doc.setDrawColor(...LINE);
  doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text('Automatically generated by KUuza.', margin, footerY);
  doc.text('Valid without a signature.', pageWidth - margin, footerY, { align: 'right' });

  doc.save(`KUuza_Receipt_${receiptNo.replace('#', '')}.pdf`);
}
