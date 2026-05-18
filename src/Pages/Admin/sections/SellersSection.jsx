import { useState, useEffect, useMemo } from 'react';
import { BadgeCheck, ChevronDown, ChevronUp, Flag } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchAdminSellers, revokeSellerVerification } from '../../../api/adminapi';
import PageSpinner from '../../../Components/shared/PageSpinner';
import { ConfirmButton, Empty, Toolbar } from '../adminShared';
import { fmtDate } from '../adminHelpers';

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

  if (loading) return <PageSpinner />;

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
                    <ConfirmButton onConfirm={() => revoke(s.id, s.full_name)} label="Revoke seller verification" icon={Flag} variant="danger" loading={busy[s.id]} />
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

export default SellersSection;
