import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchAdminListings, removeListing } from '../../../api/adminapi';
import PageSpinner from '../../../Components/shared/PageSpinner';
import { Pill, ConfirmButton, Empty, Toolbar } from '../adminShared';
import { fmtDate, buildBase, statBoxes, footers, EMERALD, WHITE } from '../adminHelpers';

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
    try {
      await removeListing(id);
      setRows(r => r.map(l => l.id === id ? { ...l, status: 'deactivated' } : l));
      toast.success('Listing archived.');
    } catch (e) { toast.error(e.message); }
    finally { setBusy(b => ({ ...b, [id]: false })); }
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const STATUS_LABEL = { active: 'Active', sold: 'Sold', deactivated: 'Deactivated' };
      const TYPE_LABEL   = { good: 'Goods', service: 'Services' };
      const CAT_LABEL    = { books: 'Academics', electronics: 'Electronics', fashion: 'Fashion', furniture: 'Furniture', food_beverages: 'Food & Beverages', beauty: 'Beauty & Accessories', stationery: 'Stationery & Supplies', sports: 'Sports & Fitness', tutoring: 'Tutoring & Academics', printing: 'Printing & Photocopying', design: 'Design & Creative', tech_repair: 'Tech & Repairs', laundry: 'Laundry & Cleaning', photography: 'Photography & Video', other: 'Other' };

      const filters = [
        status   && STATUS_LABEL[status],
        category && CAT_LABEL[category],
        type     && TYPE_LABEL[type],
      ].filter(Boolean).join(' · ');
      const reportTitle = filters ? `Listings Report — ${filters}` : 'Listings Report';

      const { doc, autoTable, W, Y: sy } = await buildBase(reportTitle);
      const afterBoxes = statBoxes(doc, sy, W, 'LISTING SUMMARY', [
        { label: 'Total Listings', value: filtered.length },
        { label: 'Active',  value: filtered.filter(l => l.status === 'active' && !l.is_draft).length },
        { label: 'Sold',    value: filtered.filter(l => l.status === 'sold').length },
        { label: 'Drafts',  value: filtered.filter(l => l.is_draft).length },
      ]);

      doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5); doc.setTextColor(107, 114, 128);
      doc.text(search ? `Search: "${search}"` : 'Showing all matching listings', 18, afterBoxes + 5);

      let cy = afterBoxes + 13;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(...EMERALD);
      doc.text(`${reportTitle} (${filtered.length})`, 14, cy);

      const showCategory = !category;
      const showType     = !type;
      const showStatus   = !status;
      const titleWidth = 72 + (!showCategory ? 36 : 0) + (!showType ? 22 : 0) + (!showStatus ? 27 : 0);

      const cols = ['Title', 'Seller', 'Price', ...(showCategory ? ['Category'] : []), ...(showType ? ['Type'] : []), ...(showStatus ? ['Status'] : []), 'Date Posted'];
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
    { id: 'category', value: category, onChange: setCategory, options: [{ value: '', label: 'All categories' }, { value: 'books', label: 'Academics' }, { value: 'electronics', label: 'Electronics' }, { value: 'fashion', label: 'Fashion' }, { value: 'furniture', label: 'Furniture' }, { value: 'food_beverages', label: 'Food & Beverages' }, { value: 'beauty', label: 'Beauty & Accessories' }, { value: 'stationery', label: 'Stationery & Supplies' }, { value: 'sports', label: 'Sports & Fitness' }, { value: 'tutoring', label: 'Tutoring & Academics' }, { value: 'printing', label: 'Printing & Photocopying' }, { value: 'design', label: 'Design & Creative' }, { value: 'tech_repair', label: 'Tech & Repairs' }, { value: 'laundry', label: 'Laundry & Cleaning' }, { value: 'photography', label: 'Photography & Video' }, { value: 'other', label: 'Other' }] },
    { id: 'type', value: type, onChange: setType, options: [{ value: '', label: 'All types' }, { value: 'good', label: 'Good' }, { value: 'service', label: 'Service' }] },
    { id: 'sort', value: sort, onChange: setSort, options: [{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'price_high', label: 'Price: High → Low' }, { value: 'price_low', label: 'Price: Low → High' }, { value: 'title_az', label: 'Title A → Z' }] },
  ];

  if (loading) return <PageSpinner />;

  return (
    <>
      <Toolbar darkMode={darkMode} placeholder="Search title or seller…" search={search} onSearch={setSearch} selects={selects} onPDF={downloadPDF} pdfLoading={pdfLoading} count={filtered.length} />
      {!filtered.length ? <Empty label="No listings match your filters." darkMode={darkMode} /> : (() => {
        const showCat    = !category;
        const showType   = !type;
        const showStatus = !status;
        const headers = ['Title', 'Seller', 'Price', ...(showCat ? ['Category'] : []), ...(showType ? ['Type'] : []), ...(showStatus ? ['Status'] : []), 'Date', 'Action'];
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left text-xs uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {headers.map(h => <th key={h} className="pb-3 pr-4 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id} className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                    <td className={`py-3 pr-4 font-medium max-w-[220px] ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      <div className="flex items-center gap-2.5">
                        {l.first_image ? (
                          <img src={l.first_image} alt={l.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 border border-gray-200" />
                        ) : (
                          <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-xs ${darkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400'}`}>No img</div>
                        )}
                        <div className="min-w-0">
                          {l.is_draft && <Pill label="Draft" color="gray" />}
                          <Link to={`/listings/${l.id}`} target="_blank" rel="noopener noreferrer"
                            className={`block truncate text-sm hover:underline ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>
                            {l.title}
                          </Link>
                        </div>
                      </div>
                    </td>
                    <td className={`py-3 pr-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <div className="text-sm">{l.seller_name}</div>
                      <div className="text-xs opacity-60 truncate max-w-[140px]">{l.seller_email}</div>
                    </td>
                    <td className={`py-3 pr-4 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{l.price ? `KES ${Number(l.price).toLocaleString()}` : '—'}</td>
                    {showCat    && <td className="py-3 pr-4"><Pill label={l.category} color="sky" /></td>}
                    {showType   && <td className={`py-3 pr-4 text-xs capitalize ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{l.listing_type}</td>}
                    {showStatus && <td className="py-3 pr-4"><Pill label={l.status.charAt(0).toUpperCase() + l.status.slice(1)} color={l.status === 'active' ? 'green' : l.status === 'sold' ? 'violet' : 'gray'} /></td>}
                    <td className={`py-3 pr-4 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{fmtDate(l.created_at)}</td>
                    <td className="py-3"><ConfirmButton onConfirm={() => remove(l.id)} label="Archive" icon={Trash2} variant="warning" loading={busy[l.id]} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })()}
    </>
  );
};

export default ListingsSection;
