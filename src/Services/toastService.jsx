// src/Services/toastService.jsx
// Centralized toast notification service using react-hot-toast

import React from 'react';
import toast from 'react-hot-toast';

/**
 * Toast Service
 * Provides consistent toast notifications across the app
 *
 * Usage:
 *   toastService.success('Item created!')
 *   toastService.error('Failed to save')
 *   toastService.loading('Processing...')
 *   toastService.promise(apiCall, messages)
 */

const toastService = {
  // ✅ SUCCESS TOAST
  success: (message, options = {}) => {
    return toast.success(message, {
      duration: 3000,
      position: 'top-right',
      style: {
        background: '#10B981',
        color: '#fff',
        padding: '16px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      },
      ...options,
    });
  },

  // ❌ ERROR TOAST
  error: (message, options = {}) => {
    return toast.error(message, {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#EF4444',
        color: '#fff',
        padding: '16px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      },
      ...options,
    });
  },

  // ⓘ INFO TOAST
  info: (message, options = {}) => {
    return toast((t) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '18px' }}>ℹ️</span>
        <span>{message}</span>
      </div>
    ), {
      duration: Infinity,
      position: 'top-right',
      style: {
        background: '#3B82F6',
        color: '#fff',
        padding: '16px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      },
      ...options,
    });
  },

  // ⚠️ WARNING TOAST
  warning: (message, options = {}) => {
    return toast((t) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '18px' }}>⚠️</span>
        <span>{message}</span>
      </div>
    ), {
      duration: 5000,
      position: 'top-right',
      style: {
        background: '#F59E0B',
        color: '#fff',
        padding: '16px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      },
      ...options,
    });
  },

  // 🔄 LOADING TOAST
  loading: (message, options = {}) => {
    return toast.loading(message, {
      position: 'top-right',
      style: {
        background: '#6366F1',
        color: '#fff',
        padding: '16px 24px',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '500',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
      },
      ...options,
    });
  },

  // 🔄 PROMISE TOAST
  promise: (promise, messages) => {
    return toast.promise(
      promise,
      {
        loading: { render: messages.loading, icon: '🔄' },
        success: { render: messages.success, icon: '✅' },
        error: { render: messages.error, icon: '❌' },
      },
      {
        position: 'top-right',
        style: {
          padding: '16px 24px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
        },
      }
    );
  },

  // 📋 CUSTOM TOAST
  custom: (component, options = {}) => {
    return toast.custom(component, { position: 'top-right', ...options });
  },

  // ❌ DISMISS ALL
  dismissAll: () => {
    toast.remove();
  },

  // ❌ DISMISS SPECIFIC
  dismiss: (toastId) => {
    if (toastId) {
      toast.dismiss(toastId);
    }
  },
};

export default toastService;
