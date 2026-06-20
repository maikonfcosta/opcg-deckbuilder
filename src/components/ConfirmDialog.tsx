import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export interface ConfirmState {
  message: string;
  confirmLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
}

interface ConfirmDialogProps {
  confirm: ConfirmState;
  onClose: () => void;
}

export default function ConfirmDialog({ confirm, onClose }: ConfirmDialogProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleConfirm = () => {
    confirm.onConfirm();
    onClose();
  };

  return (
    <div className="modal-overlay animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label="Confirmação"
        className="glass-panel w-full max-w-sm m-4 p-6 rounded-2xl animate-slide-up"
      >
        <div className="flex items-start gap-3 mb-5">
          <div className={`p-2 rounded-lg flex-shrink-0 ${confirm.destructive ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-600'}`}>
            <AlertTriangle size={20} />
          </div>
          <p className="text-sm text-slate-700 leading-relaxed pt-1">{confirm.message}</p>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary py-2 px-4 text-xs">
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            autoFocus
            className={`btn py-2 px-4 text-xs text-white ${confirm.destructive ? 'bg-red-600 hover:bg-red-500' : 'btn-primary'}`}
          >
            {confirm.confirmLabel || 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  );
}
