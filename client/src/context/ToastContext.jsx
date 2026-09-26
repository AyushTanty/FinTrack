import React, { createContext, useContext, useState } from 'react';
import ToastContainer from '../components/common/ToastContainer';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, variant = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, variant }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} onClose={(id) => setToasts(p => p.filter(t => t.id !== id))} />
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
