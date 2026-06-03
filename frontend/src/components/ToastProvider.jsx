import React from 'react';
import { Toaster } from 'react-hot-toast';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          color: '#0f172a',
          fontWeight: 700,
        },
      }}
    />
  );
}
