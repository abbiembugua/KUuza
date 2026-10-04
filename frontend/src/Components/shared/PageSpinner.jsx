import React from 'react';
import { Loader2 } from 'lucide-react';

const PageSpinner = ({ label, className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-10 gap-2 ${className}`}>
    <Loader2 size={28} className="animate-spin text-emerald-500" />
    {label && <p className="text-sm text-gray-400">{label}</p>}
  </div>
);

export default PageSpinner;
