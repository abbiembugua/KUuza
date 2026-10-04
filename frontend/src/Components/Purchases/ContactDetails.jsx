import { useState, useEffect } from 'react';
import { Loader2, Phone, Mail, Shield } from 'lucide-react';
import { fetchContactDetails } from '../../api/transactionapi';

export default function ContactDetails({ listingId, token, darkMode }) {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  useEffect(() => {
    if (!listingId || !token) { setLoading(false); return; }
    fetchContactDetails(listingId, token)
      .then(setContact)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [listingId, token]);

  if (loading) return (
    <div className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
      <Loader2 size={12} className="animate-spin" /> Loading contact details...
    </div>
  );

  if (error || !contact) return (
    <div className={`flex items-center gap-2 text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
      <Shield size={12} /> Contact details unavailable
    </div>
  );

  const isWhatsApp = contact.contact_preference === 'whatsapp';
  const Icon = isWhatsApp ? Phone : Mail;
  const href = isWhatsApp
    ? `https://wa.me/${contact.contact_value.replace(/[^0-9]/g, '')}`
    : `mailto:${contact.contact_value}`;

  return (
    <div className={`rounded-xl p-3 ${darkMode ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
      <div className="flex items-center gap-2 mb-2">
        <Shield size={13} className="text-emerald-500" />
        <span className={`text-xs font-bold uppercase tracking-wider ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          Seller Contact
        </span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Icon size={14} className={darkMode ? 'text-gray-300' : 'text-gray-600'} />
          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            {contact.contact_value}
          </span>
        </div>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-emerald-600 hover:opacity-90 text-white text-xs font-semibold rounded-lg transition-opacity flex-shrink-0"
        >
          {isWhatsApp ? 'WhatsApp' : 'Email'}
        </a>
      </div>
    </div>
  );
}
