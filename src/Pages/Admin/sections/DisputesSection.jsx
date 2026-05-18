import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { fetchAdminDisputes, resolveDisputeBuyer, resolveDisputeSeller, closeDispute } from '../../../api/adminapi';
import PageSpinner from '../../../Components/shared/PageSpinner';
import { Pill, ConfirmButton, Empty, Toolbar } from '../adminShared';
import { fmtDate } from '../adminHelpers';

const DisputesSection = ({ darkMode }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [search, setSearch] = useState('');
  const [notes, setNotes] = useState({});

  const setNote = (id, side, value) =>
    setNotes(prev => ({ ...prev, [id]: { ...prev[id], [side]: value } }));

  useEffect(() => {
    fetchAdminDisputes().then(setRows).catch((e) => toast.error(e.message)).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(d =>
      d.listing_title.toLowerCase().includes(q) ||
      d.buyer_name.toLowerCase().includes(q) ||
      d.seller_name.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const act = async (id, action, fn) => {
    setBusy(b => ({ ...b, [`${id}_${action}`]: true }));
    try {
      await fn(id);
      setRows(r => r.filter(d => d.id !== id));
      toast.success('Done.');
    } catch (e) { toast.error(e.message); }
    finally { setBusy(b => ({ ...b, [`${id}_${action}`]: false })); }
  };

  if (loading) return <PageSpinner />;

  return (
    <>
      <Toolbar darkMode={darkMode} placeholder="Search listing, buyer or seller…" search={search} onSearch={setSearch} selects={[]} count={filtered.length} />
      {!filtered.length ? <Empty label="No escalated disputes." darkMode={darkMode} /> : (
        <div className="space-y-3">
          {filtered.map(d => (
            <div key={d.id} className={`rounded-xl border p-4 space-y-4 ${darkMode ? 'border-red-900/40 bg-red-500/5' : 'border-red-200 bg-red-50'}`}>

              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Pill label="Escalated" color="red" />
                    <span className={`font-semibold text-sm ${darkMode ? 'text-gray-200' : 'text-gray-800'}`}>
                      {d.listing_id ? (
                        <a href={`/listings/${d.listing_id}`} target="_blank" rel="noopener noreferrer"
                          className={`hover:underline ${darkMode ? 'text-sky-400' : 'text-sky-600'}`}>
                          {d.listing_title} ↗
                        </a>
                      ) : d.listing_title}
                    </span>
                  </div>
                  <div className={`grid grid-cols-2 gap-x-6 gap-y-1 text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <p><span className="font-medium">Buyer:</span> {d.buyer_name} ({d.buyer_email})</p>
                    <p><span className="font-medium">Seller:</span> {d.seller_name} ({d.seller_email})</p>
                    {d.agreed_price  && <p><span className="font-medium">Amount:</span> KES {Number(d.agreed_price).toLocaleString()}</p>}
                    {d.payment_method && <p><span className="font-medium">Payment:</span> {d.payment_method}</p>}
                    {d.scheduled_date && <p><span className="font-medium">Scheduled:</span> {fmtDate(d.scheduled_date)}</p>}
                    {d.disputed_at    && <p><span className="font-medium">Disputed:</span> {fmtDate(d.disputed_at)}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-2 shrink-0">
                  <ConfirmButton onConfirm={() => act(d.id, 'resolve_buyer',  resolveDisputeBuyer)}  label="Buyer is right"  icon={CheckCircle} variant="danger"  loading={busy[`${d.id}_resolve_buyer`]} />
                  <ConfirmButton onConfirm={() => act(d.id, 'resolve_seller', resolveDisputeSeller)} label="Seller is right" icon={CheckCircle} variant="success" loading={busy[`${d.id}_resolve_seller`]} />
                  <ConfirmButton onConfirm={() => act(d.id, 'dismiss',        closeDispute)}         label="Close dispute"  icon={X}           variant="warning" loading={busy[`${d.id}_dismiss`]} />
                </div>
              </div>

              {d.buyer_reason && (
                <div className={`rounded-lg p-3 text-xs ${darkMode ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
                  <p className={`font-semibold mb-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>BUYER'S REASON</p>
                  <p className={`leading-relaxed ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{d.buyer_reason}</p>
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
