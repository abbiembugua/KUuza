import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchLogoBase64, drawLogo } from '../../utils/pdfLogo';
import {
  Trash2, UserX, UserCheck, BadgeCheck,
  ChevronDown, ChevronUp, Loader2, CheckCircle,
  Search, FileText, X, Flag,
} from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import {
  fetchAdminListings, removeListing,
  fetchAdminUsers, suspendUser, reactivateUser,
  fetchAdminReports, dismissReport, reportRemoveListing, reportSuspendUser,
  fetchAdminSellers, revokeSellerVerification,
} from '../../api/adminapi';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useTheme } from '../../context/Themecontext';
import AdminLayout from './AdminLayout';

// ─── PDF constants ────────────────────────────────────────────────────────────
const EMERALD = [5, 150, 105];
const WHITE   = [255, 255, 255];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const fmtFull = (d) =>
  d.toLocaleDateString('en-KE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }) +
  ' at ' + d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true });

const Pill = ({ label, color }) => {
  const map = {
    green:  'bg-emerald-100 text-emerald-700',
    red:    'bg-red-100    text-red-600',
    amber:  'bg-amber-100  text-amber-700',
    gray:   'bg-gray-100   text-gray-500',
    violet: 'bg-violet-100 text-violet-700',
    sky:    'bg-sky-100    text-sky-700',
  };
  return (
    <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${map[color] ?? map.gray}`}>
      {label}
    </span>
  );
};

const ConfirmButton = ({ onConfirm, label, icon: Icon, variant = 'danger', loading }) => {
  const [armed, setArmed] = useState(false);
  const styles = {
    danger:  'bg-red-50   text-red-600   hover:bg-red-100   border border-red-200',
    warning: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200',
    success: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200',
  };
  if (armed) return (
    <div className="flex items-center gap-2">
      <button onClick={() => { setArmed(false); onConfirm(); }} disabled={loading}
        className="text-xs px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">
        Confirm
      </button>
      <button onClick={() => setArmed(false)}
        className="text-xs px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition">
        Cancel
      </button>
    </div>
  );
  return (
    <button onClick={() => setArmed(true)} disabled={loading}
      className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition ${styles[variant]}`}>
      {loading ? <Loader2 size={13} className="animate-spin" /> : Icon && <Icon size={13} />}
      {label}
    </button>
  );
};

const Empty = ({ label, darkMode }) => (
  <div className={`py-16 text-center ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
    <CheckCircle size={36} className="mx-auto mb-3 opacity-40" />
    <p className="text-sm">{label}</p>
  </div>
);

// ─── Toolbar ─────────────────────────────────────────────────────────────────
const Toolbar = ({ darkMode, placeholder, search, onSearch, selects = [], onPDF, pdfLoading, count }) => {
  const base = `py-2 rounded-xl border text-sm focus:outline-none transition ${
    darkMode
      ? 'bg-gray-800 border-gray-700 text-gray-200 focus:border-emerald-500'
      : 'bg-white border-gray-300 text-gray-800 focus:border-emerald-500'
  }`;
  return (
    <div className="flex flex-wrap items-center gap-3 mb-6">
      <div className="relative">
        <Search size={14} className={`absolute left-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        <input type="text" placeholder={placeholder} value={search} onChange={(e) => onSearch(e.target.value)}
          className={`${base} pl-9 pr-8 w-64`} />
        {search && (
          <button onClick={() => onSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <X size={13} className={darkMode ? 'text-gray-500' : 'text-gray-400'} />
          </button>
        )}
      </div>

      {selects.map((s) => (
        <div key={s.id} className="relative">
          <select value={s.value} onChange={(e) => s.onChange(e.target.value)}
            className={`${base} pl-3 pr-7 appearance-none`}>
            {s.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={12} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
        </div>
      ))}

      <span className={`text-xs ml-auto ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
        {count} result{count !== 1 ? 's' : ''}
      </span>

      {onPDF && (
        <button onClick={onPDF} disabled={pdfLoading || count === 0}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-cyan-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition">
          {pdfLoading ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
          PDF
        </button>
      )}
    </div>
  );
};

// ─── Shared PDF helpers ───────────────────────────────────────────────────────
async function buildBase(title) {
  const { jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
  const now = new Date();
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();

  const logoBase64 = await fetchLogoBase64();

  doc.setFillColor(...EMERALD); doc.rect(0, 0, W, 30, 'F');
  const textX = drawLogo(doc, logoBase64, 30);
  doc.setFont('helvetica', 'bold');   doc.setFontSize(16); doc.setTextColor(...WHITE); doc.text('KUuza', textX, 16);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);  doc.setTextColor(200, 245, 230);
  doc.text('Kenyatta University Official Marketplace', textX, 23);
  doc.setFont('helvetica', 'bold');   doc.setFontSize(13); doc.setTextColor(...WHITE);
  doc.text(title, W - 14, 10, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);  doc.setTextColor(200, 245, 230);
  doc.text('GENERATED BY', W - 14, 16, { align: 'right' });
  doc.setFont('helvetica', 'bold');   doc.setFontSize(11); doc.setTextColor(...WHITE);
  doc.text('KUuza Admin', W - 14, 22, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);  doc.setTextColor(200, 245, 230);
  doc.text(`Issued on: ${fmtFull(now)}`, W - 14, 28, { align: 'right' });
  doc.setDrawColor(16, 185, 129); doc.setLineWidth(0.3); doc.line(0, 30, W, 30);

  return { doc, autoTable, W, Y: 36 };
}

function statBoxes(doc, Y, W, heading, boxes) {
  const uw = W - 28, gap = 5;
  const bw = (uw - gap * (boxes.length - 1)) / boxes.length;
  const bh = 20, bg = bh + 18;
  doc.setFillColor(240, 253, 250); doc.roundedRect(14, Y, uw, bg, 2, 2, 'F');
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(...EMERALD);
  doc.text(heading, 18, Y + 6);
  const top = Y + 9;
  boxes.forEach((b, i) => {
    const bx = 14 + i * (bw + gap);
    doc.setFillColor(255, 255, 255); doc.roundedRect(bx, top, bw, bh, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5); doc.setTextColor(107, 114, 128);
    doc.text(b.label.toUpperCase(), bx + 4, top + 6);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(12); doc.setTextColor(...EMERALD);
    doc.text(String(b.value), bx + 4, top + 15);
  });
  return Y + bg;
}

function footers(doc, W) {
  const n = doc.internal.getNumberOfPages();
  for (let p = 1; p <= n; p++) {
    doc.setPage(p);
    const fy = doc.internal.pageSize.height - 7;
    doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.2);
    doc.line(14, fy - 2.5, W - 14, fy - 2.5);
    doc.setFontSize(6.5); doc.setTextColor(150, 150, 150);
    doc.text('KUuza · Kenyatta University Official Marketplace · hello.kuuza@gmail.com', 14, fy);
    doc.text(`Page ${p} of ${n}`, W - 14, fy, { align: 'right' });
  }
}

// ─── Listings section ─────────────────────────────────────────────────────────
const ListingsSection = ({ darkMode }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState('');
  const [sort, setSort] = useState('newest');
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetchAdminListings().then(setRows).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let d = [...rows];
    if (search) { const q = search.toLowerCase(); d = d.filter(l => l.title.toLowerCase().includes(q) || l.seller_name.toLowerCase().includes(q) || l.seller_email.toLowerCase().includes(q)); }
    if (status)   d = d.filter(l => l.status === status);
    if (category) d = d.filter(l => l.category_code === category);
    if (type)     d = d.filter(l => l.listing_type === type);
    d.sort((a, b) => {
      if (sort === 'newest')     return new Date(b.created_at) - new Date(a.created_at);
      if (sort === 'oldest')     return new Date(a.created_at) - new Date(b.created_at);
      if (sort === 'price_high') return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0);
      if (sort === 'price_low')  return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0);
      if (sort === 'title_az')   return a.title.localeCompare(b.title);
      return 0;
    });
    return d;
  }, [rows, search, status, category, type, sort]);

  const remove = async (id) => {
    setBusy(b => ({ ...b, [id]: true }));
    try { await removeListing(id); setRows(r => r.filter(l => l.id !== id)); toast.success('Listing removed.'); }
    catch (e) { toast.error(e.message); }
    finally { setBusy(b => ({ ...b, [id]: false })); }
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      // Build a descriptive title from active filters so redundant columns can be dropped
      const STATUS_LABEL = { active: 'Active', sold: 'Sold', deactivated: 'Deactivated' };
      const TYPE_LABEL   = { good: 'Goods', service: 'Services' };
      const CAT_LABEL    = { books: 'Books', electronics: 'Electronics', fashion: 'Fashion', furniture: 'Furniture', food_beverages: 'Food & Beverages', beauty: 'Beauty', other: 'Other' };

      const reportTitle = [
        status   && STATUS_LABEL[status],
        category && CAT_LABEL[category],
        type     && TYPE_LABEL[type],
        'Listings Report',
      ].filter(Boolean).join(' ');

      const { doc, autoTable, W, Y: sy } = await buildBase(reportTitle);
      const afterBoxes = statBoxes(doc, sy, W, 'LISTING SUMMARY', [
        { label: 'Total Listings', value: filtered.length },
        { label: 'Active',  value: filtered.filter(l => l.status === 'active' && !l.is_draft).length },
        { label: 'Sold',    value: filtered.filter(l => l.status === 'sold').length },
        { label: 'Drafts',  value: filtered.filter(l => l.is_draft).length },
      ]);

      // Search filter note only — status/category/type are already in the title
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(107, 114, 128);
      doc.text(search ? `Search: "${search}"` : 'Showing all matching listings', 18, afterBoxes + 5);

      let cy = afterBoxes + 13;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...EMERALD);
      doc.text(`${reportTitle} (${filtered.length})`, 14, cy);

      // Omit columns whose values are already expressed in the report title
      const showCategory = !category;
      const showType     = !type;
      const showStatus   = !status;

      // Redistribute freed-up width to the Title column
      const titleWidth = 72 + (!showCategory ? 36 : 0) + (!showType ? 22 : 0) + (!showStatus ? 27 : 0);

      const cols = [
        'Title', 'Seller', 'Price',
        ...(showCategory ? ['Category'] : []),
        ...(showType     ? ['Type']     : []),
        ...(showStatus   ? ['Status']   : []),
        'Date Posted',
      ];

      const colStyles = { 0: { cellWidth: titleWidth }, 1: { cellWidth: 45 }, 2: { cellWidth: 33 } };
      let ci = 3;
      if (showCategory) { colStyles[ci] = { cellWidth: 36 }; ci++; }
      if (showType)     { colStyles[ci] = { cellWidth: 22 }; ci++; }
      if (showStatus)   { colStyles[ci] = { cellWidth: 27 }; ci++; }
      colStyles[ci] = { cellWidth: 32 };

      autoTable(doc, {
        startY: cy + 3,
        head: [cols],
        body: filtered.map(l => [
          l.is_draft ? `[Draft] ${l.title}` : l.title,
          l.seller_name,
          l.price ? `KSh ${Number(l.price).toLocaleString('en-KE', { minimumFractionDigits: 2 })}` : '—',
          ...(showCategory ? [l.category]                                                       : []),
          ...(showType     ? [l.listing_type === 'good' ? 'Good' : 'Service']                  : []),
          ...(showStatus   ? [l.status.charAt(0).toUpperCase() + l.status.slice(1)]            : []),
          fmtDate(l.created_at),
        ]),
        styles: { fontSize: 8.5, cellPadding: 3, overflow: 'ellipsize' },
        headStyles: { fillColor: EMERALD, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [240, 253, 250] },
        columnStyles: colStyles,
      });
      footers(doc, W);
      doc.save(`KUuza_Listings_Report_${Date.now()}.pdf`);
    } catch { toast.error('PDF generation failed.'); }
    finally { setPdfLoading(false); }
  };

  const selects = [
    { id: 'status', value: status, onChange: setStatus, options: [{ value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'sold', label: 'Sold' }, { value: 'deactivated', label: 'Deactivated' }] },
    { id: 'category', value: category, onChange: setCategory, options: [{ value: '', label: 'All categories' }, { value: 'books', label: 'Books' }, { value: 'electronics', label: 'Electronics' }, { value: 'fashion', label: 'Fashion' }, { value: 'furniture', label: 'Furniture' }, { value: 'food_beverages', label: 'Food & Beverages' }, { value: 'beauty', label: 'Beauty' }, { value: 'other', label: 'Other' }] },
    { id: 'type', value: type, onChange: setType, options: [{ value: '', label: 'All types' }, { value: 'good', label: 'Good' }, { value: 'service', label: 'Service' }] },
    { id: 'sort', value: sort, onChange: setSort, options: [{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'price_high', label: 'Price: High → Low' }, { value: 'price_low', label: 'Price: Low → High' }, { value: 'title_az', label: 'Title A → Z' }] },
  ];

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-emerald-500" /></div>;

  return (
    <>
      <Toolbar darkMode={darkMode} placeholder="Search title or seller…" search={search} onSearch={setSearch} selects={selects} onPDF={downloadPDF} pdfLoading={pdfLoading} count={filtered.length} />
      {!filtered.length ? <Empty label="No listings match your filters." darkMode={darkMode} /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-left text-xs uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {['Title', 'Seller', 'Price', 'Category', 'Type', 'Status', 'Date', 'Action'].map(h => <th key={h} className="pb-3 pr-4 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(l => (
                <tr key={l.id} className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                  <td className={`py-3 pr-4 font-medium max-w-[180px] ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    <div className="flex items-center gap-1.5 truncate">{l.is_draft && <Pill label="Draft" color="gray" />}<span className="truncate">{l.title}</span></div>
                  </td>
                  <td className={`py-3 pr-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    <div className="text-sm">{l.seller_name}</div>
                    <div className="text-xs opacity-60 truncate max-w-[140px]">{l.seller_email}</div>
                  </td>
                  <td className={`py-3 pr-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{l.price ? `KES ${Number(l.price).toLocaleString()}` : '—'}</td>
                  <td className="py-3 pr-4"><Pill label={l.category} color="sky" /></td>
                  <td className={`py-3 pr-4 text-xs capitalize ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{l.listing_type}</td>
                  <td className="py-3 pr-4"><Pill label={l.status.charAt(0).toUpperCase() + l.status.slice(1)} color={l.status === 'active' ? 'green' : l.status === 'sold' ? 'violet' : 'gray'} /></td>
                  <td className={`py-3 pr-4 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{fmtDate(l.created_at)}</td>
                  <td className="py-3"><ConfirmButton onConfirm={() => remove(l.id)} label="Remove" icon={Trash2} variant="danger" loading={busy[l.id]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

// ─── Users section ────────────────────────────────────────────────────────────
const UsersSection = ({ darkMode }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [seller, setSeller] = useState('');
  const [sort, setSort] = useState('newest');
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    fetchAdminUsers().then(setRows).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let d = [...rows];
    if (search) { const q = search.toLowerCase(); d = d.filter(u => u.full_name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)); }
    if (status === 'active')    d = d.filter(u =>  u.is_active);
    if (status === 'suspended') d = d.filter(u => !u.is_active);
    if (seller === 'yes')       d = d.filter(u =>  u.is_verified_seller);
    if (seller === 'no')        d = d.filter(u => !u.is_verified_seller);
    d.sort((a, b) => sort === 'newest' ? new Date(b.created_at) - new Date(a.created_at) : sort === 'oldest' ? new Date(a.created_at) - new Date(b.created_at) : a.full_name.localeCompare(b.full_name));
    return d;
  }, [rows, search, status, seller, sort]);

  const toggle = async (user) => {
    setBusy(b => ({ ...b, [user.id]: true }));
    try {
      if (user.is_active) { await suspendUser(user.id); setRows(r => r.map(u => u.id === user.id ? { ...u, is_active: false } : u)); toast.success(`${user.full_name} suspended.`); }
      else { await reactivateUser(user.id); setRows(r => r.map(u => u.id === user.id ? { ...u, is_active: true } : u)); toast.success(`${user.full_name} reactivated.`); }
    } catch (e) { toast.error(e.message); }
    finally { setBusy(b => ({ ...b, [user.id]: false })); }
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      // Build title from active filters
      const statusLabel = { active: 'Active', suspended: 'Suspended' }[status] || '';
      const sellerLabel = seller === 'yes' ? 'Verified Sellers' : seller === 'no' ? 'Unverified Members' : 'Members';
      const reportTitle = [statusLabel, sellerLabel, 'Report'].filter(Boolean).join(' ');

      const { doc, autoTable, W, Y: sy } = await buildBase(reportTitle);
      const afterBoxes = statBoxes(doc, sy, W, 'MEMBER SUMMARY', [
        { label: 'Total Members',    value: filtered.length },
        { label: 'Active',           value: filtered.filter(u =>  u.is_active).length },
        { label: 'Suspended',        value: filtered.filter(u => !u.is_active).length },
        { label: 'Verified Sellers', value: filtered.filter(u =>  u.is_verified_seller).length },
      ]);

      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(107, 114, 128);
      doc.text(search ? `Search: "${search}"` : 'Showing all matching members', 18, afterBoxes + 5);

      let cy = afterBoxes + 13;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...EMERALD);
      doc.text(`${reportTitle} (${filtered.length})`, 14, cy);

      // Drop columns already expressed in the title
      const showStatus = !status;
      const showSeller = !seller;

      const nameWidth = 65 + (!showStatus ? 30 : 0) + (!showSeller ? 35 : 0);

      const cols = [
        'Full Name', 'Email',
        ...(showStatus ? ['Status']          : []),
        ...(showSeller ? ['Verified Seller'] : []),
        'Date Joined',
      ];

      const colStyles = { 0: { cellWidth: nameWidth }, 1: { cellWidth: 95 } };
      let ci = 2;
      if (showStatus) { colStyles[ci] = { cellWidth: 30 }; ci++; }
      if (showSeller) { colStyles[ci] = { cellWidth: 35 }; ci++; }
      colStyles[ci] = { cellWidth: 35 };

      autoTable(doc, {
        startY: cy + 3,
        head: [cols],
        body: filtered.map(u => [
          u.full_name,
          u.email,
          ...(showStatus ? [u.is_active ? 'Active' : 'Suspended'] : []),
          ...(showSeller ? [u.is_verified_seller ? 'Yes' : 'No']  : []),
          fmtDate(u.created_at),
        ]),
        styles: { fontSize: 8.5, cellPadding: 3, overflow: 'ellipsize' },
        headStyles: { fillColor: EMERALD, textColor: WHITE, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: [240, 253, 250] },
        columnStyles: colStyles,
      });
      footers(doc, W);
      doc.save(`KUuza_Members_Report_${Date.now()}.pdf`);
    } catch { toast.error('PDF generation failed.'); }
    finally { setPdfLoading(false); }
  };

  const selects = [
    { id: 'status', value: status, onChange: setStatus, options: [{ value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }] },
    { id: 'seller', value: seller, onChange: setSeller, options: [{ value: '', label: 'All members' }, { value: 'yes', label: 'Verified sellers' }, { value: 'no', label: 'Not verified' }] },
    { id: 'sort',   value: sort,   onChange: setSort,   options: [{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'name_az', label: 'Name A → Z' }] },
  ];

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-emerald-500" /></div>;

  return (
    <>
      <Toolbar darkMode={darkMode} placeholder="Search name or email…" search={search} onSearch={setSearch} selects={selects} onPDF={downloadPDF} pdfLoading={pdfLoading} count={filtered.length} />
      {!filtered.length ? <Empty label="No members match your filters." darkMode={darkMode} /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-left text-xs uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                {['Name', 'Email', 'Joined', 'Status', 'Action'].map(h => <th key={h} className="pb-3 pr-4 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                  <td className={`py-3 pr-4 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                    {u.full_name}{u.is_verified_seller && <span className="ml-2"><Pill label="Seller" color="violet" /></span>}
                  </td>
                  <td className={`py-3 pr-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{u.email}</td>
                  <td className={`py-3 pr-4 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{fmtDate(u.created_at)}</td>
                  <td className="py-3 pr-4"><Pill label={u.is_active ? 'Active' : 'Suspended'} color={u.is_active ? 'green' : 'red'} /></td>
                  <td className="py-3"><ConfirmButton onConfirm={() => toggle(u)} label={u.is_active ? 'Suspend' : 'Reactivate'} icon={u.is_active ? UserX : UserCheck} variant={u.is_active ? 'warning' : 'success'} loading={busy[u.id]} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

// ─── Reports section ──────────────────────────────────────────────────────────
const ReportsSection = ({ darkMode }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('pending');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    fetchAdminReports().then(setRows).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let d = [...rows];
    if (search) { const q = search.toLowerCase(); d = d.filter(r => r.listing_title?.toLowerCase().includes(q) || r.reporter_name.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q) || r.reported_user_name?.toLowerCase().includes(q)); }
    if (status) d = d.filter(r => r.status === status);
    d.sort((a, b) => sort === 'newest' ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at));
    return d;
  }, [rows, search, status, sort]);

  const act = async (id, action, fn) => {
    setBusy(b => ({ ...b, [`${id}_${action}`]: true }));
    try {
      await fn(id);
      const next = action === 'dismiss' ? 'dismissed' : 'acted';
      setRows(r => r.map(rep => rep.id === id ? { ...rep, status: next } : rep));
      toast.success('Done.');
    } catch (e) { toast.error(e.message); }
    finally { setBusy(b => ({ ...b, [`${id}_${action}`]: false })); }
  };

  const selects = [
    { id: 'status', value: status, onChange: setStatus, options: [{ value: '', label: 'All statuses' }, { value: 'pending', label: 'Pending' }, { value: 'dismissed', label: 'Dismissed' }, { value: 'acted', label: 'Acted' }] },
    { id: 'sort',   value: sort,   onChange: setSort,   options: [{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }] },
  ];

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-emerald-500" /></div>;

  return (
    <>
      <Toolbar darkMode={darkMode} placeholder="Search listing, reporter, reason…" search={search} onSearch={setSearch} selects={selects} count={filtered.length} />
      {!filtered.length ? <Empty label="No reports match your filters." darkMode={darkMode} /> : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className={`rounded-xl border p-4 ${r.status === 'pending' ? darkMode ? 'border-amber-700/40 bg-amber-500/5' : 'border-amber-200 bg-amber-50' : darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Pill label={r.status === 'pending' ? 'Pending' : r.status === 'dismissed' ? 'Dismissed' : 'Acted'} color={r.status === 'pending' ? 'amber' : r.status === 'dismissed' ? 'gray' : 'green'} />
                    <span className={`text-xs font-semibold ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{r.reason}</span>
                  </div>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <span className="font-medium">Flagged:</span>{' '}
                    {r.listing_title ? <span className={darkMode ? 'text-sky-400' : 'text-sky-600'}>{r.listing_title}</span> : <span className="italic opacity-60">Listing removed</span>}
                  </p>
                  {r.reported_user_name && <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Seller: {r.reported_user_name} · {r.reported_user_email}</p>}
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Reporter: {r.reporter_name} · {r.reporter_email} · {fmtDate(r.created_at)}</p>
                  {r.details && <p className={`text-xs mt-1 italic ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>"{r.details}"</p>}
                </div>
                {r.status === 'pending' && (
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <ConfirmButton onConfirm={() => act(r.id, 'dismiss', dismissReport)} label="Dismiss" icon={CheckCircle} variant="success" loading={busy[`${r.id}_dismiss`]} />
                    {r.listing_id && <ConfirmButton onConfirm={() => act(r.id, 'remove_listing', reportRemoveListing)} label="Remove listing" icon={Trash2} variant="danger" loading={busy[`${r.id}_remove_listing`]} />}
                    {r.reported_user_id && <ConfirmButton onConfirm={() => act(r.id, 'suspend_user', reportSuspendUser)} label="Suspend user" icon={UserX} variant="warning" loading={busy[`${r.id}_suspend_user`]} />}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

// ─── Sellers section ──────────────────────────────────────────────────────────
const SellersSection = ({ darkMode }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [busy, setBusy] = useState({});
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    fetchAdminSellers().then(setRows).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  const revoke = async (id, name) => {
    setBusy(b => ({ ...b, [id]: true }));
    try {
      await revokeSellerVerification(id);
      setRows(r => r.filter(s => s.id !== id));
      toast.success(`${name}'s seller verification revoked.`);
    } catch (e) { toast.error(e.message); }
    finally { setBusy(b => ({ ...b, [id]: false })); }
  };

  const filtered = useMemo(() => {
    let d = [...rows];
    if (search) { const q = search.toLowerCase(); d = d.filter(s => s.full_name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)); }
    d.sort((a, b) => sort === 'newest' ? new Date(b.created_at) - new Date(a.created_at) : sort === 'oldest' ? new Date(a.created_at) - new Date(b.created_at) : a.full_name.localeCompare(b.full_name));
    return d;
  }, [rows, search, sort]);

  const selects = [
    { id: 'sort', value: sort, onChange: setSort, options: [{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'name_az', label: 'Name A → Z' }] },
  ];

  if (loading) return <div className="flex justify-center py-16"><Loader2 size={28} className="animate-spin text-emerald-500" /></div>;

  return (
    <>
      <Toolbar darkMode={darkMode} placeholder="Search name or email…" search={search} onSearch={setSearch} selects={selects} count={filtered.length} />
      {!filtered.length ? <Empty label="No verified sellers match your search." darkMode={darkMode} /> : (
        <div className="space-y-2">
          {filtered.map(s => (
            <div key={s.id} className={`rounded-xl border overflow-hidden ${darkMode ? 'border-gray-800 bg-gray-900' : 'border-gray-200 bg-white'}`}>
              <button onClick={() => setExpanded(p => p === s.id ? null : s.id)}
                className={`w-full flex items-center justify-between px-5 py-4 text-left transition ${darkMode ? 'hover:bg-gray-800/60' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center gap-3">
                  <BadgeCheck size={18} className="text-violet-500 shrink-0" />
                  <div>
                    <p className={`font-semibold text-sm ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{s.full_name}</p>
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{s.email}</p>
                  </div>
                </div>
                {expanded === s.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              {expanded === s.id && (
                <div className={`px-5 pb-5 border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3 text-sm">
                    {[['Full Name', s.full_name], ['Student ID', s.student_id || '—'], ['National ID', s.national_id || '—'], ['Course', s.course || '—'], ['Department', s.department || '—'], ['School', s.school || '—'], ['Year of Study', s.year_of_study || '—'], ['M-Pesa Number', s.mpesa_phone || '—'], ['Joined', fmtDate(s.created_at)]].map(([label, value]) => (
                      <div key={label} className="pt-3">
                        <p className={`text-xs mb-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{label}</p>
                        <p className={`font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>{value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="pt-4">
                    <ConfirmButton
                      onConfirm={() => revoke(s.id, s.full_name)}
                      label="Revoke seller verification"
                      icon={Flag}
                      variant="danger"
                      loading={busy[s.id]}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

// ─── Section titles ───────────────────────────────────────────────────────────
const TITLES = {
  listings: 'Listings',
  users:    'Users',
  reports:  'Reports',
  sellers:  'Sellers',
};

// ─── Page ─────────────────────────────────────────────────────────────────────
const AdminManagePage = ({ section }) => {
  const { darkMode } = useTheme();
  const { adminUser, adminLoading } = useAdminAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (adminLoading) return;
    if (!adminUser) navigate('/kuuza-control/');
  }, [adminUser, adminLoading, navigate]);

  if (adminLoading) return (
    <AdminLayout title={TITLES[section] ?? 'Management'}>
      <div className="flex items-center justify-center py-24">
        <Loader2 size={28} className="animate-spin text-emerald-500" />
      </div>
    </AdminLayout>
  );

  return (
    <AdminLayout title={TITLES[section] ?? 'Management'}>
      <Toaster position="top-center" />
      {section === 'listings' && <ListingsSection darkMode={darkMode} />}
      {section === 'users'    && <UsersSection    darkMode={darkMode} />}
      {section === 'reports'  && <ReportsSection  darkMode={darkMode} />}
      {section === 'sellers'  && <SellersSection  darkMode={darkMode} />}
    </AdminLayout>
  );
};

export default AdminManagePage;
