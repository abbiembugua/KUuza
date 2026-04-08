// src/Components/transactions/ReportGenerator.jsx

import { useState } from "react";
import { FileText, Table2, Loader2 } from "lucide-react";

export default function ReportGenerator({ transactions, currentUserId, dateRange }) {
  const [loading, setLoading] = useState(null);

  // Calculate financial summary for the document only
  const completedTransactions = transactions.filter(t =>
    ['completed', 'auto_completed'].includes(t.status)
  );
  
  const incompleteTransactions = transactions.filter(t =>
    !['completed', 'auto_completed'].includes(t.status)
  );

  const totalEarned = completedTransactions
    .filter(t => (t.seller === currentUserId || t.seller?.id === currentUserId) && t.agreed_price)
    .reduce((sum, t) => sum + parseFloat(t.agreed_price || 0), 0);

  const totalSpent = completedTransactions
    .filter(t => (t.buyer === currentUserId || t.buyer?.id === currentUserId) && t.agreed_price)
    .reduce((sum, t) => sum + parseFloat(t.agreed_price || 0), 0);

  const incompleteEarned = incompleteTransactions
    .filter(t => (t.seller === currentUserId || t.seller?.id === currentUserId) && t.agreed_price)
    .reduce((sum, t) => sum + parseFloat(t.agreed_price || 0), 0);

  const incompleteSpent = incompleteTransactions
    .filter(t => (t.buyer === currentUserId || t.buyer?.id === currentUserId) && t.agreed_price)
    .reduce((sum, t) => sum + parseFloat(t.agreed_price || 0), 0);

  // Format currency
  const fmtCurrency = (n) =>
    `KSh ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Date helpers
  const fmt = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fmtFull = (date) =>
    date.toLocaleDateString("en-KE", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    }) +
    " at " +
    date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: true });

  const rangeLabel = () => {
    if (!dateRange?.from && !dateRange?.to) return "All Time";
    const f = dateRange.from ? fmt(dateRange.from) : "Start";
    const t = dateRange.to ? fmt(dateRange.to) : "Today";
    return `${f} – ${t}`;
  };

  // Helper to get amount from transaction
  const getAmount = (tx) => {
    const amount = tx.agreed_price || tx.amount || tx.price || 0;
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Build rows for the report
  const buildRows = () =>
    transactions.map((tx) => {
      const isSeller = tx.seller === currentUserId || tx.seller?.id === currentUserId;
      const counterparty = isSeller
        ? (tx.buyer_username ?? tx.buyer?.username ?? "Buyer")
        : (tx.seller_username ?? tx.seller?.username ?? "Seller");

      const amountValue = getAmount(tx);

      return {
        date: fmt(tx.created_at),
        delivery: fmt(tx.scheduled_date),
        type: isSeller ? "Sale" : "Purchase",
        counterparty,
        listing: tx.listing_title ?? tx.listing?.title ?? "—",
        amount: amountValue > 0 ? `KES ${amountValue.toLocaleString("en-KE")}` : "KES 0",
        status: tx.status ?? "—",
        reference: tx.id ?? "—",
      };
    });

  const HEADERS = ["Date", "Delivery Date", "Type", "Counterparty", "Listing", "Amount", "Status", "Reference"];
  const KEYS = ["date", "delivery", "type", "counterparty", "listing", "amount", "status", "reference"];

  // CSV download
  const downloadCSV = async () => {
    setLoading("csv");
    await new Promise((r) => setTimeout(r, 300));

    const now = new Date();
    const rows = buildRows();
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;

    const lines = [
      `# KUuza — Kenyatta University Official Marketplace`,
      `# Transaction Report`,
      `# Period: ${rangeLabel()}`,
      `# Downloaded: ${fmtFull(now)}`,
      `# Transactions: ${rows.length}`,
      ``,
      `# COMPLETED TRANSACTIONS:`,
      `#   Total Earned (from sales): ${fmtCurrency(totalEarned)}`,
      `#   Total Spent (on purchases): ${fmtCurrency(totalSpent)}`,
      ``,
      `# INCOMPLETE TRANSACTIONS:`,
      `#   Total Earned (from sales): ${fmtCurrency(incompleteEarned)}`,
      `#   Total Spent (on purchases): ${fmtCurrency(incompleteSpent)}`,
      ``,
      `# ALL TRANSACTIONS:`,
      `#   Total Earned: ${fmtCurrency(totalEarned + incompleteEarned)}`,
      `#   Total Spent: ${fmtCurrency(totalSpent + incompleteSpent)}`,
      "",
      HEADERS.map(esc).join(","),
      ...rows.map((r) => KEYS.map((k) => esc(r[k])).join(",")),
    ];

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `KUuza_Report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(null);
  };

  // PDF download
  const downloadPDF = async () => {
    setLoading("pdf");

    let jsPDF, autoTable;
    try {
      ({ jsPDF } = await import("jspdf"));
      ({ default: autoTable } = await import("jspdf-autotable"));
    } catch {
      alert("PDF export requires jsPDF.\n\nRun:\n  npm install jspdf jspdf-autotable\n\nThen try again.");
      setLoading(null);
      return;
    }

    const now = new Date();
    const rows = buildRows();
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const PAGE_W = 297;
    const HDR_H = 30;
    const EMERALD = [5, 150, 105];
    const WHITE = [255, 255, 255];

    // Header band
    doc.setFillColor(...EMERALD);
    doc.rect(0, 0, PAGE_W, HDR_H, "F");

    // Logo and title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...WHITE);
    doc.text("KUuza", 14, 16);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(200, 245, 230);
    doc.text("Kenyatta University Official Marketplace", 14, 23);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("Transaction Report", PAGE_W - 14, 13, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(200, 245, 230);
    doc.text(`Period: ${rangeLabel()}`, PAGE_W - 14, 20, { align: "right" });
    doc.text(`Downloaded: ${fmtFull(now)}`, PAGE_W - 14, 26, { align: "right" });

    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.3);
    doc.line(0, HDR_H, PAGE_W, HDR_H);

    // Financial Summary Section (in document only)
    let currentY = HDR_H + 6;
    
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Financial Summary", 14, currentY);
    currentY += 6;
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    
    // Completed Transactions
    doc.setFont("helvetica", "bold");
    doc.setTextColor(5, 150, 105);
    doc.text("Completed Transactions:", 14, currentY);
    currentY += 5;
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.text(`  Earned from sales: ${fmtCurrency(totalEarned)}`, 14, currentY);
    currentY += 4;
    doc.text(`  Spent on purchases: ${fmtCurrency(totalSpent)}`, 14, currentY);
    currentY += 6;
    
    // Incomplete Transactions
    if (incompleteEarned > 0 || incompleteSpent > 0) {
      doc.setFont("helvetica", "bold");
      doc.setTextColor(180, 120, 0);
      doc.text("Incomplete Transactions:", 14, currentY);
      currentY += 5;
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);
      doc.text(`  Earned from sales: ${fmtCurrency(incompleteEarned)}`, 14, currentY);
      currentY += 4;
      doc.text(`  Spent on purchases: ${fmtCurrency(incompleteSpent)}`, 14, currentY);
      currentY += 6;
    }
    
    // All Transactions Total
    const totalAllEarned = totalEarned + incompleteEarned;
    const totalAllSpent = totalSpent + incompleteSpent;
    
    doc.setFillColor(240, 253, 250);
    doc.roundedRect(14, currentY - 2, 120, 12, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("TOTAL (All Transactions):", 18, currentY + 3);
    doc.setTextColor(5, 150, 105);
    doc.text(`Earned: ${fmtCurrency(totalAllEarned)}`, 18, currentY + 8);
    doc.setTextColor(180, 120, 0);
    doc.text(`Spent: ${fmtCurrency(totalAllSpent)}`, 65, currentY + 8);
    
    currentY += 15;
    
    // Transaction count
    doc.setFontSize(7.5);
    doc.setTextColor(70, 70, 70);
    doc.text(`Total transactions in report: ${rows.length} (${completedTransactions.length} completed, ${incompleteTransactions.length} incomplete)`, 14, currentY);
    currentY += 6;

    // Data table
    autoTable(doc, {
      startY: currentY,
      head: [HEADERS],
      body: rows.map((r) => KEYS.map((k) => r[k])),
      styles: { fontSize: 7.5, cellPadding: 2.5, overflow: "ellipsize" },
      headStyles: { fillColor: EMERALD, textColor: WHITE, fontStyle: "bold", fontSize: 8 },
      alternateRowStyles: { fillColor: [240, 253, 250] },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: 24 },
        2: { cellWidth: 22 },
        3: { cellWidth: 32 },
        4: { cellWidth: 48 },
        5: { cellWidth: 28 },
        6: { cellWidth: 22 },
        7: { cellWidth: 48 },
      },
      didParseCell: (data) => {
        if (data.section === "body" && data.column.index === 2) {
          data.cell.styles.textColor = data.cell.raw === "Sale" ? [5, 150, 105] : [180, 120, 0];
          data.cell.styles.fontStyle = "bold";
        }
      },
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const footerY = doc.internal.pageSize.height - 7;

      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.2);
      doc.line(14, footerY - 2.5, PAGE_W - 14, footerY - 2.5);

      doc.setFontSize(6.5);
      doc.setTextColor(150, 150, 150);
      doc.text("KUuza — Kenyatta University Official Marketplace", 14, footerY);
      doc.text(`Page ${i} of ${pageCount}`, PAGE_W - 14, footerY, { align: "right" });
    }

    doc.save(`KUuza_Report_${Date.now()}.pdf`);
    setLoading(null);
  };

  if (!transactions?.length) return null;

  return (
    <div className="flex items-center gap-3 justify-end">
        <span className="text-xs text-gray-500 dark:text-gray-400">
  Export {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
</span>
      <button
        onClick={downloadCSV}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500
                   text-emerald-600 dark:text-emerald-400 text-sm font-medium
                   hover:bg-emerald-50 dark:hover:bg-emerald-900/20
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading === "csv" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Table2 className="w-4 h-4" />}
        CSV
      </button>

      <button
        onClick={downloadPDF}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                   bg-gradient-to-r from-emerald-600 to-cyan-600
                   text-white text-sm font-medium
                   hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-opacity shadow-sm"
      >
        {loading === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        PDF
      </button>
    </div>
  );
}