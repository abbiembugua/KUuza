import { useState } from "react";
import { FileText, Loader2 } from "lucide-react";

const EMERALD = [5, 150, 105];
const WHITE = [255, 255, 255];
const getTransactionQuantity = (transaction) => {
  const candidates = [
    transaction?.quantity,
    transaction?.item_quantity,
    transaction?.purchase_quantity,
    transaction?.requested_quantity,
    transaction?.units,
    transaction?.count,
  ];

  for (const value of candidates) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return 1;
};

export default function ReportGenerator({
  transactions,
  currentUserId,
  dateRange,
  activeTab = "all",
  downloaderName,
}) {
  const [loading, setLoading] = useState(null);

  const completedTransactions = transactions.filter((transaction) =>
    ["completed", "auto_completed"].includes(transaction.status)
  );

  const incompleteTransactions = transactions.filter(
    (transaction) => !["completed", "auto_completed"].includes(transaction.status)
  );

  const totalEarned = completedTransactions
    .filter((transaction) => transaction.seller === currentUserId || transaction.seller?.id === currentUserId)
    .reduce((sum, transaction) => sum + (parseFloat(transaction.agreed_price || 0) * getTransactionQuantity(transaction)), 0);

  const totalSpent = completedTransactions
    .filter((transaction) => transaction.buyer === currentUserId || transaction.buyer?.id === currentUserId)
    .reduce((sum, transaction) => sum + (parseFloat(transaction.agreed_price || 0) * getTransactionQuantity(transaction)), 0);

  const incompleteEarned = incompleteTransactions
    .filter((transaction) => transaction.seller === currentUserId || transaction.seller?.id === currentUserId)
    .reduce((sum, transaction) => sum + (parseFloat(transaction.agreed_price || 0) * getTransactionQuantity(transaction)), 0);

  const incompleteSpent = incompleteTransactions
    .filter((transaction) => transaction.buyer === currentUserId || transaction.buyer?.id === currentUserId)
    .reduce((sum, transaction) => sum + (parseFloat(transaction.agreed_price || 0) * getTransactionQuantity(transaction)), 0);

  const fmtCurrency = (value) =>
    `KSh ${Number(value || 0).toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const fmtDate = (dateStr) => {
    if (!dateStr) return "-";

    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "-";

    return date.toLocaleDateString("en-KE", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fmtFull = (date) =>
    date.toLocaleDateString("en-KE", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    }) +
    " " +
    date.toLocaleTimeString("en-KE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const rangeLabel = () => {
    if (!dateRange?.from && !dateRange?.to) return "All Time";
    const from = dateRange.from ? fmtDate(dateRange.from) : "Start";
    const to = dateRange.to ? fmtDate(dateRange.to) : "Today";
    return `${from} - ${to}`;
  };

  const getAmount = (transaction) => {
    const parsed = parseFloat(transaction.agreed_price || transaction.amount || transaction.price || 0) * getTransactionQuantity(transaction);
    return Number.isNaN(parsed) ? 0 : parsed;
  };

  const formatStatus = (status) => {
    if (!status) return "-";
    if (status === "auto_completed") return "Auto-completed";
    return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const buildRows = (mode) =>
    transactions
      .filter((transaction) => {
        const isSeller = transaction.seller === currentUserId || transaction.seller?.id === currentUserId;
        if (mode === "buyer") return !isSeller;
        if (mode === "seller") return isSeller;
        return true;
      })
      .map((transaction) => ({
        date: fmtDate(transaction.created_at),
        delivery: fmtDate(transaction.scheduled_date),
        listing: transaction.listing_title ?? transaction.listing?.title ?? "-",
        amount: fmtCurrency(getAmount(transaction)),
        status: formatStatus(transaction.status),
        reference: transaction.id ?? "-",
      }));

  const purchaseRows = buildRows("buyer");
  const salesRows = buildRows("seller");

  const reportTitle =
    activeTab === "buyer"
      ? "Purchase Report"
      : activeTab === "seller"
        ? "Sales Report"
        : "Transaction Report";

  const HEADERS = ["Date", "Delivery Date", "Listing", "Amount", "Status", "Reference"];
  const KEYS = ["date", "delivery", "listing", "amount", "status", "reference"];

  const downloadPDF = async () => {
    setLoading("pdf");

    let jsPDF;
    let autoTable;

    try {
      ({ jsPDF } = await import("jspdf"));
      ({ default: autoTable } = await import("jspdf-autotable"));
    } catch {
      alert("PDF export requires jsPDF.\n\nRun:\n  npm install jspdf jspdf-autotable\n\nThen try again.");
      setLoading(null);
      return;
    }

    const now = new Date();
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();
    const headerHeight = 32;

    // Draw green header background
    doc.setFillColor(...EMERALD);
    doc.rect(0, 0, pageWidth, headerHeight, "F");

    // Left side: Platform name and description
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...WHITE);
    doc.text("KUuza", 14, 12);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(200, 245, 230);
    doc.text("Kenyatta University Official Marketplace", 14, 18);

    // Right side: Report title and metadata (all fitting within 32mm height)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...WHITE);
    doc.text(reportTitle, pageWidth - 14, 10, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(200, 245, 230);
    doc.text("For:", pageWidth - 14, 17, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.setTextColor(...WHITE);
    doc.text(String(downloaderName || "KU Student").toUpperCase(), pageWidth - 14, 22, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 245, 230);
    doc.text(fmtFull(now), pageWidth - 14, 28, { align: "right" });

    // Line separator
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.3);
    doc.line(0, headerHeight, pageWidth, headerHeight);

    let currentY = headerHeight + 6;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("Financial Summary", 14, currentY);
    currentY += 6;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Completed sales: ${fmtCurrency(totalEarned)}`, 14, currentY);
    currentY += 5;
    doc.text(`Completed purchases: ${fmtCurrency(totalSpent)}`, 14, currentY);
    currentY += 5;

    if (incompleteEarned > 0 || incompleteSpent > 0) {
      doc.text(`Pending sales: ${fmtCurrency(incompleteEarned)}`, 14, currentY);
      currentY += 5;
      doc.text(`Pending purchases: ${fmtCurrency(incompleteSpent)}`, 14, currentY);
      currentY += 5;
    }

    doc.setFillColor(240, 253, 250);
    doc.roundedRect(14, currentY - 1, 138, 11, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.text(`Period: ${rangeLabel()}`, 18, currentY + 4);
    currentY += 16;

    const drawTable = (title, rows, startY) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...EMERALD);
      doc.text(`${title} (${rows.length})`, 14, startY);

      autoTable(doc, {
        startY: startY + 3,
        head: [HEADERS],
        body: rows.map((row) => KEYS.map((key) => row[key])),
        styles: {
          fontSize: 8.5,
          cellPadding: 3,
          overflow: "ellipsize",
        },
        headStyles: {
          fillColor: EMERALD,
          textColor: WHITE,
          fontStyle: "bold",
          fontSize: 9,
        },
        alternateRowStyles: { fillColor: [240, 253, 250] },
        columnStyles: {
          0: { cellWidth: 28 },
          1: { cellWidth: 30 },
          2: { cellWidth: 85 },
          3: { cellWidth: 34 },
          4: { cellWidth: 34 },
          5: { cellWidth: 62 },
        },
      });

      return doc.lastAutoTable.finalY + 8;
    };

    if (activeTab === "all") {
      currentY = drawTable("Purchase Report", purchaseRows, currentY);
      drawTable("Sales Report", salesRows, currentY);
    } else if (activeTab === "buyer") {
      drawTable(reportTitle, purchaseRows, currentY);
    } else {
      drawTable(reportTitle, salesRows, currentY);
    }

    const pageCount = doc.internal.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      const footerY = doc.internal.pageSize.height - 7;

      doc.setDrawColor(210, 210, 210);
      doc.setLineWidth(0.2);
      doc.line(14, footerY - 2.5, pageWidth - 14, footerY - 2.5);

      doc.setFontSize(6.5);
      doc.setTextColor(150, 150, 150);
      doc.text("KUuza - Kenyatta University Official Marketplace", 14, footerY);
      doc.text(`Page ${page} of ${pageCount}`, pageWidth - 14, footerY, { align: "right" });
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
        onClick={downloadPDF}
        disabled={!!loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-sm"
      >
        {loading === "pdf" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
        PDF
      </button>
    </div>
  );
}
