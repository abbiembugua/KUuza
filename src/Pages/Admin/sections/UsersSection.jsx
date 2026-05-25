import { useState, useEffect, useMemo } from 'react';
import { UserX, UserCheck } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchAdminUsers, suspendUser, reactivateUser } from '../../../api/adminapi';
import PageSpinner from '../../../Components/shared/PageSpinner';
import { Pill, ConfirmButton, Empty, Toolbar } from '../adminShared';
import { fmtDate, buildBase, statBoxes, footers, EMERALD, WHITE } from '../adminHelpers';

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
    if (status === 'active')     d = d.filter(u =>  u.is_active);
    if (status === 'suspended')  d = d.filter(u => !u.is_active);
    if (status === 'unverified') d = d.filter(u => !u.is_email_verified);
    if (seller === 'yes')       d = d.filter(u =>  u.is_verified_seller);
    if (seller === 'no')        d = d.filter(u => !u.is_verified_seller);
    d.sort((a, b) => sort === 'newest' ? new Date(b.created_at) - new Date(a.created_at) : sort === 'oldest' ? new Date(a.created_at) - new Date(b.created_at) : a.full_name.localeCompare(b.full_name));
    return d;
  }, [rows, search, status, seller, sort]);

  const toggle = async (user) => {
    setBusy(b => ({ ...b, [user.id]: true }));
    try {
      if (user.is_active) {
        await suspendUser(user.id);
        setRows(r => r.map(u => u.id === user.id ? { ...u, is_active: false } : u));
        toast.success(`${user.full_name} suspended.`);
      } else {
        await reactivateUser(user.id);
        setRows(r => r.map(u => u.id === user.id ? { ...u, is_active: true } : u));
        toast.success(`${user.full_name} reactivated.`);
      }
    } catch (e) { toast.error(e.message); }
    finally { setBusy(b => ({ ...b, [user.id]: false })); }
  };

  const downloadPDF = async () => {
    setPdfLoading(true);
    try {
      const filters = [
        status && ({ active: 'Active', suspended: 'Suspended' }[status]),
        seller === 'yes' ? 'Verified Sellers' : seller === 'no' ? 'Unverified' : null,
      ].filter(Boolean).join(' · ');
      const reportTitle = filters ? `Members Report — ${filters}` : 'Members Report';

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

      const showStatus = !status;
      const showSeller = !seller;
      const nameWidth  = 65 + (!showStatus ? 30 : 0) + (!showSeller ? 35 : 0);

      const cols = ['Full Name', 'Email', ...(showStatus ? ['Status'] : []), ...(showSeller ? ['Verified Seller'] : []), 'Date Joined'];
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
    { id: 'status', value: status, onChange: setStatus, options: [{ value: '', label: 'All statuses' }, { value: 'active', label: 'Active' }, { value: 'suspended', label: 'Suspended' }, { value: 'unverified', label: 'Email not verified' }] },
    { id: 'seller', value: seller, onChange: setSeller, options: [{ value: '', label: 'All members' }, { value: 'yes', label: 'Verified sellers' }, { value: 'no', label: 'Not verified' }] },
    { id: 'sort',   value: sort,   onChange: setSort,   options: [{ value: 'newest', label: 'Newest first' }, { value: 'oldest', label: 'Oldest first' }, { value: 'name_az', label: 'Name A → Z' }] },
  ];

  if (loading) return <PageSpinner />;

  return (
    <>
      <Toolbar darkMode={darkMode} placeholder="Search name or email…" search={search} onSearch={setSearch} selects={selects} onPDF={downloadPDF} pdfLoading={pdfLoading} count={filtered.length} />
      {!filtered.length ? <Empty label="No members match your filters." darkMode={darkMode} /> : (() => {
        const showStatus     = !status;
        const showSellerPill = seller !== 'yes';
        const headers = ['Name', 'Email', 'Joined', ...(showStatus ? ['Status'] : []), 'Action'];
        return (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`text-left text-xs uppercase tracking-wide ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                  {headers.map(h => <th key={h} className="pb-3 pr-4 font-medium">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} className={`border-t ${darkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                    <td className={`py-3 pr-4 font-medium ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {u.full_name}
                      {showSellerPill && u.is_verified_seller && <span className="ml-2"><Pill label="Seller" color="violet" /></span>}
                    </td>
                    <td className={`py-3 pr-4 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{u.email}</td>
                    <td className={`py-3 pr-4 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>{fmtDate(u.created_at)}</td>
                    {showStatus && <td className="py-3 pr-4"><Pill label={u.is_active ? 'Active' : 'Suspended'} color={u.is_active ? 'green' : 'red'} /></td>}
                    <td className="py-3">
                      <ConfirmButton onConfirm={() => toggle(u)} label={u.is_active ? 'Suspend' : 'Reactivate'} icon={u.is_active ? UserX : UserCheck} variant={u.is_active ? 'warning' : 'success'} loading={busy[u.id]} />
                    </td>
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

export default UsersSection;