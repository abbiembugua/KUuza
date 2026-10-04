import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchAdminDisputes, resolveDisputeBuyer, resolveDisputeSeller, closeDispute } from '../../../api/adminapi';
import PageSpinner from '../../../Components/shared/PageSpinner';
import { Pill, ConfirmButton, Empty, Toolbar } from '../adminShared';
import { fmtDate } from '../adminHelpers';

const DATE_RANGES = [
  { value: '',       label: 'Any date'   },
  { value: 'today',  label: 'Today'      },
  { value: 'week',   label: 'This week'  },
  { value: 'month',  label: 'This month' },
];

const withinRange = (dateStr, range) => {
  if (!range || !dateStr) return true;
  const d = new Date(dateStr);
  const now = new Date();
  if (range === 'today') return d.toDateString() === now.toDateString();
  if (range === 'week')  { const w = new Date(now); w.setDate(now.getDate() - 7); return d >= w; }
  if (range === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  return true;
};

const DisputesSection = ({ darkMode }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [responseFilter, setResponseFilter] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [sort, setSort] = useState('newest');
  useEffect(() => {
    fetchAdminDisputes().then(setRows).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let d = [...rows];
    if (statusFilter === 'open')      d = d.filter(r => r.is_disputed);
    if (statusFilter === 'escalated') d = d.filter(r => r.is_disputed && r.dispute_escalated);
    if (statusFilter === 'resolved')  d = d.filter(r => !r.is_disputed);
    if (responseFilter === 'has_response')     d = d.filter(r => !!r.seller_response);
    if (responseFilter === 'awaiting_response') d = d.filter(r => r.is_disputed && !r.seller_response);
    if (dateRange) d = d.filter(r => withinRange(r.disputed_at || r.created_at, dateRange));
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(r =>
        r.listing_title?.toLowerCase().includes(q) ||
        r.buyer_name?.toLowerCase().includes(q) ||
        r.buyer_email?.toLowerCase().includes(q) ||
        r.seller_name?.toLowerCase().includes(q) ||
        r.seller_email?.toLowerCase().includes(q) ||
        r.buyer_reason?.toLowerCase().includes(q) ||
        r.seller_response?.toLowerCase().includes(q)
      );
    }
    d.sort((a, b) => {
      const dateA = new Date(a.disputed_at || a.created_at);
      const dateB = new Date(b.disputed_at || b.created_at);
      return sort === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return d;
  }, [rows, search, statusFilter, responseFilter, dateRange, sort]);

  const act = async (id, action, fn) => {
    setBusy(b => ({ ...b, [`${id}_${action}`]: true }));
    try {
      await fn(id);
      setRows(r => r.map(d =>
        d.id === id ? { ...d, is_disputed: false, dispute_escalated: false } : d
      ));
      toast.success('Done.');
    } catch (e) { toast.error(e.message); }
    finally { setBusy(b => ({ ...b, [`${id}_${action}`]: false })); }
  };

  if (loading) return <PageSpinner />;

  return (
    <>
      <Toolbar
        darkMode={darkMode}
        placeholder="Search listing, buyer, seller, claim…"
        search={search}
        onSearch={setSearch}
        selects={[
          {
            id: 'status', value: statusFilter, onChange: setStatusFilter,
            options: [
              { value: '',          label: 'All disputes'  },
              { value: 'open',      label: 'Open'          },
              { value: 'escalated', label: 'Escalated'     },
              { value: 'resolved',  label: 'Resolved'      },
            ],
          },
          {
            id: 'response', value: responseFilter, onChange: setResponseFilter,
            options: [
              { value: '',                  label: 'Any response status'     },
              { value: 'has_response',      label: 'Seller responded'        },
              { value: 'awaiting_response', label: 'Awaiting seller response'},
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
        ]}
        count={filtered.length}
      />
      {!filtered.length ? <Empty label="No disputes match your filters." darkMode={darkMode} /> : (
        <div className="space-y-3">
          {filtered.map(d => (
            <div key={d.id} className={`rounded-xl border p-4 space-y-4 ${
              d.is_disputed
                ? darkMode ? 'border-red-900/40 bg-red-500/5' : 'border-red-200 bg-red-50'
                : darkMode ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'
            }`}>

              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {d.is_disputed
                      ? <Pill label={d.dispute_escalated ? 'Escalated' : 'Disputed'} color="red" />
                      : <Pill label="Resolved" color="green" />
                    }
                    {d.seller_response
                      ? <Pill label="Seller responded" color="green" />
                      : d.is_disputed && <Pill label="Awaiting seller" color="gray" />
                    }
                    <span className={`font-semibold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {d.listing_id ? (
                        <a href={`/listings/${d.listing_id}`} target="_blank" rel="noopener noreferrer"
                          className="hover:underline">
                          {d.listing_title}
                        </a>
                      ) : d.listing_title}
                    </span>
                  </div>
                  <div className={`grid grid-cols-2 gap-x-6 gap-y-1 text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <p><span className="font-medium">Buyer:</span> {d.buyer_name} ({d.buyer_email})</p>
                    <p><span className="font-medium">Seller:</span> {d.seller_name} ({d.seller_email})</p>
                    {d.agreed_price   && <p><span className="font-medium">Amount:</span> KES {Number(d.agreed_price).toLocaleString()}</p>}
                    {d.payment_method && <p><span className="font-medium">Payment:</span> {d.payment_method}</p>}
                    {d.scheduled_date && <p><span className="font-medium">Scheduled:</span> {fmtDate(d.scheduled_date)}</p>}
                    {d.disputed_at    && <p><span className="font-medium">Disputed:</span> {fmtDate(d.disputed_at)}</p>}
                  </div>
                </div>

                {d.is_disputed && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <ConfirmButton onConfirm={() => act(d.id, 'resolve_buyer',  resolveDisputeBuyer)}  label="Buyer is right"  icon={CheckCircle} variant="danger"  loading={busy[`${d.id}_resolve_buyer`]} />
                    <ConfirmButton onConfirm={() => act(d.id, 'resolve_seller', resolveDisputeSeller)} label="Seller is right" icon={CheckCircle} variant="success" loading={busy[`${d.id}_resolve_seller`]} />
                    <ConfirmButton onConfirm={() => act(d.id, 'dismiss',        closeDispute)}         label="Close dispute"  icon={X}           variant="warning" loading={busy[`${d.id}_dismiss`]} />
                  </div>
                )}
              </div>

              {/* Buyer's claim + Seller's response side by side */}
              {(d.buyer_reason || d.seller_response) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className={`rounded-lg p-3 text-xs ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                    <p className={`font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>BUYER'S CLAIM</p>
                    <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {d.buyer_reason || <span className="italic opacity-50">No reason provided</span>}
                    </p>
                  </div>
                  <div className={`rounded-lg p-3 text-xs ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                    <p className={`font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>SELLER'S RESPONSE</p>
                    <p className={`leading-relaxed ${d.seller_response ? (darkMode ? 'text-gray-300' : 'text-gray-700') : 'italic opacity-50'}`}>
                      {d.seller_response || 'Seller has not responded yet'}
                    </p>
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

export default DisputesSection;