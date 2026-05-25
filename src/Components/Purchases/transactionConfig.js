import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

export const STATUS_CONFIG = {
  pending: {
    label:  'Pending',
    color:  'text-amber-600',
    bg:     'bg-amber-50',
    border: 'border-l-amber-400',
    icon:   Clock,
  },
  completed: {
    label:  'Completed',
    color:  'text-emerald-600',
    bg:     'bg-emerald-50',
    border: 'border-l-emerald-400',
    icon:   CheckCircle,
  },
  auto_completed: {
    label:  'Auto-completed',
    color:  'text-emerald-600',
    bg:     'bg-emerald-50',
    border: 'border-l-emerald-400',
    icon:   CheckCircle,
  },
  cancelled: {
    label:  'Cancelled',
    color:  'text-red-500',
    bg:     'bg-red-50',
    border: 'border-l-red-400',
    icon:   AlertCircle,
  },
};

export const PAYMENT_LABELS = {
  mpesa:             'M-Pesa',
  cash_on_pickup:    'Cash on Pickup',
  pay_after_service: 'Pay After Service',
};

export const getTransactionQuantity = (transaction) => {
  const q = Number(transaction?.quantity);
  return Number.isFinite(q) && q > 0 ? q : 1;
};

export const formatShortDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-KE', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};