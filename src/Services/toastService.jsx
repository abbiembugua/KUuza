import toast from 'react-hot-toast';

// Neutral card base — works in both light and dark mode
const base = {
  borderRadius: '10px',
  fontSize: '14px',
  fontWeight: '500',
  padding: '12px 16px',
  boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
  background: '#ffffff',
  color: '#111827',
  border: '1px solid #e5e7eb',
};

const toastService = {
  // Uses react-hot-toast's built-in checkmark icon (clean SVG, no emoji)
  success: (message, options = {}) =>
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: { ...base, borderLeft: '4px solid #059669' },
      iconTheme: { primary: '#059669', secondary: '#ffffff' },
      ...options,
    }),

  error: (message, options = {}) =>
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
      style: { ...base, borderLeft: '4px solid #dc2626' },
      iconTheme: { primary: '#dc2626', secondary: '#ffffff' },
      ...options,
    }),

  warning: (message, options = {}) =>
    toast(message, {
      duration: 5000,
      position: 'top-right',
      style: { ...base, borderLeft: '4px solid #d97706' },
      icon: null,
      ...options,
    }),

  info: (message, options = {}) =>
    toast(message, {
      duration: 4000,
      position: 'top-right',
      style: { ...base, borderLeft: '4px solid #6b7280' },
      icon: null,
      ...options,
    }),

  loading: (message, options = {}) =>
    toast.loading(message, {
      position: 'top-right',
      style: { ...base, borderLeft: '4px solid #059669' },
      ...options,
    }),

  promise: (promise, messages, options = {}) =>
    toast.promise(
      promise,
      {
        loading: messages.loading,
        success: messages.success,
        error:   messages.error,
      },
      {
        position: 'top-right',
        style: base,
        success: { iconTheme: { primary: '#059669', secondary: '#ffffff' } },
        error:   { iconTheme: { primary: '#dc2626', secondary: '#ffffff' } },
        ...options,
      }
    ),

  custom: (component, options = {}) =>
    toast.custom(component, { position: 'top-right', ...options }),

  dismissAll: () => toast.remove(),

  dismiss: (toastId) => { if (toastId) toast.dismiss(toastId); },
};

export const showToast = (message, type = 'info', options = {}) => {
  switch (type) {
    case 'success': return toastService.success(message, options);
    case 'error':   return toastService.error(message, options);
    case 'warning': return toastService.warning(message, options);
    default:        return toastService.info(message, options);
  }
};

export default toastService;