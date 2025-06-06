import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
  duration?: number;
}

interface ToastProviderProps {
  children: React.ReactNode;
}

const toastStore = {
  toasts: [] as Toast[],
  listeners: [] as ((toasts: Toast[]) => void)[],
  
  addToast(toast: Omit<Toast, 'id'>) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id };
    this.toasts.push(newToast);
    this.notify();
    
    // Auto remove after duration
    const duration = toast.duration || 5000;
    setTimeout(() => {
      this.removeToast(id);
    }, duration);
  },
  
  removeToast(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.notify();
  },
  
  subscribe(listener: (toasts: Toast[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  },
  
  notify() {
    this.listeners.forEach(listener => listener(this.toasts));
  }
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    return toastStore.subscribe(setToasts);
  }, []);

  return (
    <>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <ToastComponent key={toast.id} toast={toast} />
        ))}
      </div>
    </>
  );
}

function ToastComponent({ toast }: { toast: Toast }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      toastStore.removeToast(toast.id);
    }, 150);
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getColorClasses = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800';
      case 'error':
        return 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800';
      case 'warning':
        return 'bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800';
      case 'info':
        return 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800';
    }
  };

  return (
    <div
      className={`
        transform transition-all duration-300 ease-in-out p-4 rounded-lg border shadow-lg
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        ${getColorClasses()}
      `}
    >
      <div className="flex items-start gap-3">
        {getIcon()}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
            {toast.title}
          </p>
          {toast.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={handleClose}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Export toast functions for use in components
export const toast = {
  success: (title: string, description?: string, duration?: number) => {
    toastStore.addToast({ type: 'success', title, description, duration });
  },
  error: (title: string, description?: string, duration?: number) => {
    toastStore.addToast({ type: 'error', title, description, duration });
  },
  warning: (title: string, description?: string, duration?: number) => {
    toastStore.addToast({ type: 'warning', title, description, duration });
  },
  info: (title: string, description?: string, duration?: number) => {
    toastStore.addToast({ type: 'info', title, description, duration });
  },
};
