import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const CONTENT = {
  terms: {
    title: 'Terms of Service',
    updated: 'Last updated: April 2026',
    sections: [
      {
        heading: '1. Eligibility',
        body: 'KUuza is exclusively available to currently enrolled students at Kenyatta University who hold a valid KU student email address ending in @students.ku.ac.ke. Creating an account with a false identity or on behalf of another person is grounds for immediate termination.',
      },
      {
        heading: '2. Your Account',
        body: 'You are responsible for keeping your login credentials confidential. You agree to notify us immediately at hello.kuuza@gmail.com if you suspect unauthorised access. KUuza is not liable for any loss caused by unauthorised use of your account.',
      },
      {
        heading: '3. Listings',
        body: 'You may only list items or services that you own and have the legal right to sell. Prices must be stated in Kenyan Shillings (KES). You are solely responsible for the accuracy of your listings. KUuza may remove any listing at its discretion without prior notice.',
      },
      {
        heading: '4. Transactions',
        body: 'All transactions are directly between the buyer and seller. KUuza is not a party to any transaction and accepts no liability for disputes, non-delivery, or misrepresentation of goods. All physical exchanges must take place within Kenyatta University campus.',
      },
      {
        heading: '5. Prohibited Items',
        body: 'You may not list or sell: counterfeit or stolen goods, prescription or recreational drugs, weapons or dangerous items, alcohol or tobacco, exam papers or academic-dishonesty materials, or any item illegal under Kenyan law. Violating this rule results in immediate account suspension and may be reported to university authorities.',
      },
      {
        heading: '6. Intellectual Property',
        body: 'Content you post (photos, descriptions) remains yours. By posting, you grant KUuza a non-exclusive, royalty-free licence to display that content on the platform for the purpose of facilitating the listing.',
      },
      {
        heading: '7. Limitation of Liability',
        body: 'KUuza is a peer-to-peer platform. We do not inspect, verify, or guarantee the condition, authenticity, or safety of any listed item. We are not liable for financial losses, personal injury, or any other damages arising from transactions between users.',
      },
      {
        heading: '8. Termination',
        body: 'We may suspend or permanently terminate your account if you violate these terms, engage in fraudulent activity, or behave in a way that harms other users or the platform.',
      },
      {
        heading: '9. Changes to These Terms',
        body: 'We may update these terms at any time. Continued use of KUuza after changes are posted constitutes acceptance of the updated terms.',
      },
      {
        heading: '10. Contact',
        body: 'Questions about these terms? Email us at hello.kuuza@gmail.com.',
      },
    ],
  },
  privacy: {
    title: 'Privacy Policy',
    updated: 'Last updated: April 2026',
    sections: [
      {
        heading: '1. What We Collect',
        body: 'We collect your full name, KU student email address, and password (stored as a secure hash) when you register. We also collect listing data (photos, titles, descriptions, prices), transaction data (purchase and sale history, M-Pesa reference numbers), and basic usage data (pages visited, search queries, listings viewed).',
      },
      {
        heading: '2. How We Use Your Information',
        body: 'Your data is used to operate and improve the KUuza marketplace, verify your eligibility as a KU student, send you transaction notifications and important account updates, and resolve disputes between users.',
      },
      {
        heading: '3. Information Sharing',
        body: 'We do not sell your personal information to anyone. Your contact details are only shared with another user after a transaction has been confirmed. Listing content (photos, titles, prices) is visible to all registered KU students on the platform.',
      },
      {
        heading: '4. Data Security',
        body: 'We use industry-standard security practices including HTTPS encryption and hashed passwords. However, no system is completely secure. We encourage you to use a strong, unique password and to log out on shared devices.',
      },
      {
        heading: '5. Your Rights',
        body: 'You may request to view, correct, or edit your details on your profile page. Deleting your account removes your listings and personal information from the platform within 30 days.',
      },
      {
        heading: '6. Cookies',
        body: 'KUuza uses cookies to maintain your login session and remember your preferences. You can disable cookies in your browser settings, but doing so may affect certain features.',
      },
      {
        heading: '7. Changes to This Policy',
        body: 'We may update this policy from time to time. We will notify you of significant changes by email or via a notice on the platform.',
      },
      {
        heading: '8. Contact',
        body: 'For any privacy concerns or data requests, contact us at hello.kuuza@gmail.com.',
      },
    ],
  },
};

const PolicyModal = ({ type, onClose, darkMode }) => {
  // Close on Escape key
  useEffect(() => {
    if (!type) return;
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [type, onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (type) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [type]);

  if (!type) return null;

  const { title, updated, sections } = CONTENT[type];

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Dim overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal panel — stop click propagation so inner clicks don't close */}
      <div
        className={`relative w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl shadow-2xl
          transition-colors duration-300 ${
          darkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white border border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b flex-shrink-0 ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <div>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              {title}
            </h2>
            <p className={`text-xs mt-0.5 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              {updated}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              darkMode ? 'hover:bg-gray-800 text-gray-400 hover:text-white' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
            }`}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-6 py-6 space-y-6">
          {sections.map((s) => (
            <div key={s.heading}>
              <h3 className={`font-semibold mb-1.5 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                {s.heading}
              </h3>
              <p className={`text-sm leading-relaxed ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {s.body}
              </p>
            </div>
          ))}
        </div>

        {/* Sticky footer */}
        <div className={`px-6 py-4 border-t flex-shrink-0 ${
          darkMode ? 'border-gray-700' : 'border-gray-100'
        }`}>
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm transition-all duration-200"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyModal;