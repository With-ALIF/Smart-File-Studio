import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error'; id: number } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToast({ message, type, id });
    setTimeout(() => {
      setToast(prev => (prev?.id === id ? null : prev));
    }, 3000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[100] animate-fade-in-up">
          <div className={`flex items-center space-x-3 px-6 py-4 rounded-xl shadow-2xl border ${
            toast.type === 'success' 
              ? 'bg-slate-900 border-green-500/50 text-green-400' 
              : 'bg-slate-900 border-red-500/50 text-red-400'
          }`}>
            {toast.type === 'success' ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
            <span className="font-medium text-slate-100">{toast.message}</span>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
};