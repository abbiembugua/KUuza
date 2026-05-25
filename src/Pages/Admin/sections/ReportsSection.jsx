import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trash2, UserX, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchAdminReports, dismissReport, reportRemoveListing, reportSuspendUser } from '../../../api/adminapi';
import PageSpinner from '../../../Components/shared/PageSpinner';
import { Pill, ConfirmButton, Empty, Toolbar } from '../adminShared';
import { fmtDate } from '../adminHelpers';

const REASONS = [
  { value: '',                    label: 'All reasons'             },
  { value: 'fake_misleading',     label: 'Fake / misleading'       },
  { value: 'prohibited_item',     label: 'Prohibited item'         },
  { value: 'suspected_scam',      label: 'Suspected scam'          },
  { value: 'inappropriate_content', label: 'Inappropriate content' },
  { value: 'other',               label: 'Other'                   },
];

const DATE_RANGES = [
  { value: '',       label: 'Any date'   },
  { value: 'today',  label: 'Today'      },
  { value: 'week',   label: 'This week'  },
  { value: 'month',  label: 'This month' },
];

const withinRange = (dateStr, range) => {
  if (!range) return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (range === 'today') {
    return d.toDateString() === now.toDateString();
  }
  if (range === 'week') {
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
    return d >= weekAgo;
  }
  if (range === 'month') {
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }
  return true;
};

const ReportsSection = ({ darkMode }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('pending');
  const [reason, setReason] = useState('');
  const [reportType, setReportType] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [sort, setSort] = useState('newest');

  useEffect(() => {
    fetchAdminReports().then(setRows).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let d = [...rows];
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(r =>
        r.listing_title?.toLowerCase().includes(q) ||
        r.reporter_name?.toLowerCase().includes(q) ||
        r.reporter_email?.toLowerCase().includes(q) ||
        r.reason?.toLowerCase().includes(q) ||
        r.reported_user_name?.toLowerCase().includes(q) ||
        r.reported_user_email?.toLowerCase().includes(q) ||
        r.details?.toLowerCase().includes(q)
      );
    }
    if (status)     d = d.filter(r => r.status === status);
    if (reason)     d = d.filter(r => r.reason === reason);
    if (reportType === 'listing') d = d.filter(r => !!r.listing_id);
    if (reportType === 'user')    d = d.filter(r => !r.listing_id && !!r.reported_user_id);
    if (dateRange)  d = d.filter(r => withinRange(r.created_at, dateRange));
    d.sort((a, b) =>
      sort === 'newest'
        ? new Date(b.created_at) - new Date(a.created_at)
        : new Date(a.created_at) - new Date(b.created_at)
    );
    return d;
  }, [rows, search, status, reason, reportType, dateRange, sort]);

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
    {
      id: 'status', value: status, onChange: setStatus,
      options: [
        { value: '',          label: 'All statuses' },
        { value: 'pending',   label: 'Pending'      },
        { value: 'dismissed', label: 'Dismissed'    },
        { value: 'acted',     label: 'Acted'        },
      ],
    },
    { id: 'reason',     value: reason,     onChange: setReason,     options: REASONS },
    {
      id: 'reportType', value: reportType, onChange: setReportType,
      options: [
        { value: '',        label: 'Listing & user reports' },
        { value: 'listing', label: 'Listing reports only'   },
        { value: 'user',    label: 'User reports only'      },
      ],
    },
    { id: 'dateRange', value: dateRange, onChange: setDateRange, options: DATE_RANGES },
    {
      id: 'sort', value: sort, onChange: setSort,
      options: [
        { value: 'newest', label: 'Newest first' },
        { value: 'oldest', label: 'Oldest first' },
      ],
    },
  ];

  if (loading) return <PageSpinner />;

  return (
    <>
      <Toolbar darkMode={darkMode} placeholder="Search listing, reporter, email, details…" search={search} onSearch={setSearch} selects={selects} count={filtered.length} />
      {!filtered.length ? <Empty label="No reports match your filters." darkMode={darkMode} /> : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div key={r.id} className={`rounded-xl border p-4 ${r.status === 'pending' ? darkMode ? 'border-red-900/40 bg-red-500/5' : 'border-red-200 bg-red-50' : darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Pill label={r.status === 'pending' ? 'Pending' : r.status === 'dismissed' ? 'Dismissed' : 'Acted'} color={r.status === 'pending' ? 'red' : r.status === 'dismissed' ? 'gray' : 'green'} />
                    {r.dispute_escalated && <Pill label="Escalated" color="red" />}
                    {r.dispute_resolved  && <Pill label="Dispute Closed" color="green" />}
                  </div>
                  <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{r.reason}</p>

                  {r.listing_id ? (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className="font-medium">Listing reported:</span>{' '}
                      <Link to={`/listings/${r.listing_id}`} target="_blank" rel="noopener noreferrer"
                        className={`hover:underline ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>
                        {r.listing_title} ↗
                      </Link>
                    </p>
                  ) : r.reported_user_id ? (
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className="font-medium">Seller reported directly</span> — no specific listing
                    </p>
                  ) : (
                    <p className={`text-sm italic opacity-60 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      Listing no longer available
                    </p>
                  )}

                  {r.reported_user_name && (
                    <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <span className="font-medium">Reported user:</span> {r.reported_user_name} ({r.reported_user_email})
                    </p>
                  )}
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    <span className="font-medium">Reported by:</span> {r.reporter_name} ({r.reporter_email}) on {fmtDate(r.created_at)}
                  </p>
                  {r.details && <p className={`text-xs mt-1 italic ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>"{r.details}"</p>}
                  {r.dispute_deadline && r.status === 'pending' && (
                    <div className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${r.dispute_escalated ? 'text-red-500' : new Date(r.dispute_deadline) > new Date() ? 'text-emerald-600' : 'text-red-500'}`}>
                      {r.dispute_escalated ? <AlertTriangle size={12} /> : <Clock size={12} />}
                      {r.dispute_escalated
                        ? `Deadline passed. Action required (was ${fmtDate(r.dispute_deadline)})`
                        : `Seller must resolve by ${new Date(r.dispute_deadline).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true })}`}
                    </div>
                  )}
                </div>
                {r.status === 'pending' && (
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <ConfirmButton onConfirm={() => act(r.id, 'dismiss', dismissReport)} label="Dismiss" icon={CheckCircle} variant="success" loading={busy[`${r.id}_dismiss`]} />
                    {r.listing_id && <ConfirmButton onConfirm={() => act(r.id, 'remove_listing', reportRemoveListing)} label="Archive listing" icon={Trash2} variant="warning" loading={busy[`${r.id}_remove_listing`]} />}
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

export default ReportsSection;
