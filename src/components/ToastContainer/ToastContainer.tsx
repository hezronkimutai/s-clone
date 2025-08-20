import React, { useState, useCallback } from 'react';
import Toast, { ToastMessage } from '../Toast/Toast';
import { ToastType } from '../../types';

const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = Math.random().toString(36).substring(2, 15);
    const newToast: ToastMessage = { id, message, type, title };
    setToasts(prev => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Expose globally for backward compatibility
  React.useEffect(() => {
    (window as any).showToast = addToast;
  }, [addToast]);

  return (
    <div id="toast-container">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={removeToast}
        />
      ))}
    </div>
  );
};

export default ToastContainer;
export { ToastContainer };
