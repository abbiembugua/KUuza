/**
 * generateReceipt.js
 * Generates a clean KUuza PDF receipt using jsPDF.
 * Call: generateReceipt({ listing, transaction, scheduledDate, scheduledTime, paymentMethod, contact })
 */

import { jsPDF } from 'jspdf';

const BRAND_GREEN = [16, 185, 129];   // emerald-500
const BRAND_DARK  = [17,  24,  39];   // gray-900
const GRAY_MID    = [107, 114, 128];  // gray-500
const GRAY_LIGHT  = [243, 244, 246];  // gray-100
const WHITE       = [255, 255, 255];

// ── helpers ───────────────────────────────────────────────────────────────────

const fmt = (price) =>
  price ? `KSh ${parseFloat(price).toLocaleString('en-KE')}` : 'Negotiable';

const fmtDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-KE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
};

const fmtPayment = (method) => {
  const map = {
    mpesa:            'M-Pesa (STK Push)',
    cash_on_pickup:   'Cash on Pickup',
    pay_after_service:'Pay After Service',
  };
  return map[method] ?? method;
};

const fmtStatus = (txn) => {
  if (!txn) return 'Pending';
  if (txn.status === 'completed') return 'Paid';
  return 'Pending';
};

// ── main export ───────────────────────────────────────────────────────────────

export function generateReceipt({ listing, transaction, scheduledDate, scheduledTime, paymentMethod, contact }) {
  const doc    = new jsPDF({ unit: 'mm', format: 'a4' });
  const W      = doc.internal.pageSize.getWidth();   // 210
  const margin = 20;
  const col2   = 120; // x start for right-aligned values
  let   y      = 0;

  const isService = listing?.listing_type === 'service';

  // ── Header band ────────────────────────────────────────────────────────────
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, 0, W, 40, 'F');

  // Logo text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...WHITE);
  doc.text('KUuza', margin, 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(200, 240, 220);
  doc.text('Campus Marketplace · Kenyatta University', margin, 25);

  // Receipt label (top-right)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...WHITE);
  doc.text('RECEIPT', W - margin, 18, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(200, 240, 220);
  const receiptNo = transaction?.id
    ? `#${String(transaction.id).substring(0, 8).toUpperCase()}`
    : `#${Date.now().toString(36).toUpperCase()}`;
  doc.text(receiptNo, W - margin, 25, { align: 'right' });
  doc.text(`Issued: ${new Date().toLocaleDateString('en-KE')}`, W - margin, 30, { align: 'right' });

  y = 52;

  // ── Section helper ─────────────────────────────────────────────────────────
  const sectionTitle = (title) => {
    doc.setFillColor(...GRAY_LIGHT);
    doc.roundedRect(margin, y, W - margin * 2, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GRAY_MID);
    doc.text(title.toUpperCase(), margin + 3, y + 5.5);
    y += 12;
  };

  const row = (label, value, highlight = false) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...GRAY_MID);
    doc.text(label, margin, y);

    doc.setFont('helvetica', highlight ? 'bold' : 'normal');
    doc.setTextColor(highlight ? BRAND_GREEN[0] : BRAND_DARK[0],
                     highlight ? BRAND_GREEN[1] : BRAND_DARK[1],
                     highlight ? BRAND_GREEN[2] : BRAND_DARK[2]);
    doc.text(String(value ?? '—'), W - margin, y, { align: 'right' });
    y += 7;
  };

  const divider = () => {
    doc.setDrawColor(229, 231, 235);
    doc.line(margin, y, W - margin, y);
    y += 5;
  };

  // ── Listing info ───────────────────────────────────────────────────────────
  sectionTitle('Item Details');
  row('Title',    listing?.title ?? '—');
  row('Type',     isService ? 'Service' : 'Physical Good');
  row('Category', listing?.category?.replace('_', ' ') ?? '—');
  row('Seller',   listing?.seller_name ?? 'KU Student');
  row('Location', listing?.area_of_operation ?? '—');
  divider();

  // ── Scheduling ─────────────────────────────────────────────────────────────
  sectionTitle(isService ? 'Service Appointment' : 'Pickup Details');
  row(isService ? 'Service Date' : 'Pickup Date', fmtDate(scheduledDate));
  if (!isService && scheduledTime) row('Pickup Time', scheduledTime);
  divider();

  // ── Payment ────────────────────────────────────────────────────────────────
  sectionTitle('Payment');
  row('Method',         fmtPayment(paymentMethod));
  row('Status',         fmtStatus(transaction));
  if (transaction?.mpesa_receipt) row('M-Pesa Receipt', transaction.mpesa_receipt);
  divider();

  // ── Total ──────────────────────────────────────────────────────────────────
  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...BRAND_DARK);
  doc.text('Total Amount', margin, y);
  doc.setTextColor(...BRAND_GREEN);
  doc.text(fmt(listing?.price), W - margin, y, { align: 'right' });
  y += 12;

  // ── Contact block (only if revealed) ──────────────────────────────────────
  if (contact?.contact_value) {
    divider();
    sectionTitle('Seller Contact');
    row('Method', contact.contact_preference === 'whatsapp' ? 'WhatsApp' : 'Email');
    row('Contact', contact.contact_value);
    y += 2;
  }

  // ── Footer ─────────────────────────────────────────────────────────────────
  const footerY = doc.internal.pageSize.getHeight() - 22;
  doc.setFillColor(...BRAND_GREEN);
  doc.rect(0, footerY, W, 22, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...WHITE);
  doc.text('Thank you for using KUuza — the KU campus marketplace.', W / 2, footerY + 7, { align: 'center' });
  doc.text('For support, contact support@kuuza.ku.ac.ke', W / 2, footerY + 13, { align: 'center' });
  doc.setTextColor(200, 240, 220);
  doc.text('This receipt was generated automatically and is valid without a signature.', W / 2, footerY + 19, { align: 'center' });

  // ── Save ───────────────────────────────────────────────────────────────────
  const filename = `KUuza_Receipt_${receiptNo.replace('#', '')}.pdf`;
  doc.save(filename);
}