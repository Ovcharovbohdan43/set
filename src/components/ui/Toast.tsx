import * as ToastPrimitive from '@radix-ui/react-toast';
// Close icon SVG inline to avoid dependency on lucide-react
const CloseIcon = () => (
  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  showToast: (toast: Omit<Toast, 'id'>) => void;
  showError: (title: string, description?: string) => void;
  showSuccess: (title: string, description?: string) => void;
  showInfo: (title: string, description?: string) => void;
  showWarning: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      ...toast,
      id,
      duration: toast.duration ?? (toast.type === 'error' ? 6000 : 4000),
    };
    setToasts((prev) => [...prev, newToast]);
  }, []);

  const showError = useCallback((title: string, description?: string) => {
    showToast({ type: 'error', title, description });
  }, [showToast]);

  const showSuccess = useCallback((title: string, description?: string) => {
    showToast({ type: 'success', title, description });
  }, [showToast]);

  const showInfo = useCallback((title: string, description?: string) => {
    showToast({ type: 'info', title, description });
  }, [showToast]);

  const showWarning = useCallback((title: string, description?: string) => {
    showToast({ type: 'warning', title, description });
  }, [showToast]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'error':
        return 'bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-900/20 dark:border-rose-500/30 dark:text-rose-200';
      case 'success':
        return 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/20 dark:border-green-500/30 dark:text-green-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-900 dark:bg-yellow-900/20 dark:border-yellow-500/30 dark:text-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/20 dark:border-blue-500/30 dark:text-blue-200';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess, showInfo, showWarning }}>
      {children}
      <ToastPrimitive.Provider swipeDirection="right" duration={4000}>
        {toasts.map((toast) => (
          <ToastPrimitive.Root
            key={toast.id}
            className={`${getToastStyles(toast.type)} group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-lg border p-4 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full`}
            duration={toast.duration}
            onOpenChange={(open) => {
              if (!open) {
                removeToast(toast.id);
              }
            }}
          >
            <div className="flex flex-1 flex-col space-y-1">
              <ToastPrimitive.Title className="text-sm font-semibold">{toast.title}</ToastPrimitive.Title>
              {toast.description && (
                <ToastPrimitive.Description className="text-xs opacity-90">{toast.description}</ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close className="absolute right-2 top-2 rounded-md p-1 text-current opacity-0 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100">
              <CloseIcon />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

