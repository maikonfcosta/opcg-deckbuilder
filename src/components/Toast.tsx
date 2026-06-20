import { CheckCircle, AlertTriangle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastData {
  message: string;
  type: ToastType;
}

const STYLES: Record<ToastType, { cls: string; icon: typeof CheckCircle }> = {
  success: { cls: 'bg-emerald-50 border-emerald-200 text-emerald-700', icon: CheckCircle },
  error: { cls: 'bg-red-50 border-red-200 text-red-700', icon: AlertTriangle },
  info: { cls: 'bg-blue-50 border-blue-200 text-blue-700', icon: Info },
};

export default function Toast({ toast }: { toast: ToastData | null }) {
  if (!toast) return null;
  const { cls, icon: Icon } = STYLES[toast.type];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-lg text-xs font-bold animate-slide-up ${cls}`}
    >
      <Icon size={16} />
      <span>{toast.message}</span>
    </div>
  );
}
