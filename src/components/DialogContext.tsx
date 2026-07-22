/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, Edit3 } from 'lucide-react';
import './CustomDialog.css';

interface DialogOptions {
  title?: string;
  message: string;
  type?: 'alert' | 'confirm' | 'success' | 'prompt';
  onConfirm?: (inputValue: string) => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  defaultValue?: string;
}

interface DialogContextType {
  showAlert: (message: string, title?: string, type?: 'alert' | 'success') => void;
  showConfirm: (message: string, onConfirm: () => void, title?: string) => void;
  showPrompt: (message: string, onConfirm: (val: string) => void, defaultValue?: string, title?: string) => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export const useDialog = () => {
  const context = useContext(DialogContext);
  if (!context) throw new Error('useDialog must be used within DialogProvider');
  return context;
};

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [dialog, setDialog] = useState<DialogOptions | null>(null);
  const [inputValue, setInputValue] = useState('');

  const showAlert = (message: string, title?: string, type: 'alert' | 'success' = 'alert') => {
    setDialog({ message, title, type, confirmText: 'OK' });
  };

  const showConfirm = (message: string, onConfirm: () => void, title?: string) => {
    setDialog({ 
      message, 
      title, 
      type: 'confirm', 
      onConfirm, 
      confirmText: 'Confirmar', 
      cancelText: 'Cancelar' 
    });
  };

  const showPrompt = (message: string, onConfirm: (val: string) => void, defaultValue: string = '', title?: string) => {
    setInputValue(defaultValue);
    setDialog({
      message,
      title,
      type: 'prompt',
      onConfirm,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      defaultValue
    });
  };

  const handleClose = () => {
    if (dialog?.onCancel) dialog.onCancel();
    setDialog(null);
  };

  const handleConfirm = () => {
    if (dialog?.onConfirm) dialog.onConfirm(inputValue);
    setDialog(null);
  };

  return (
    <DialogContext.Provider value={{ showAlert, showConfirm, showPrompt }}>
      {children}
      <AnimatePresence>
        {dialog && (
          <motion.div 
            className="dialog-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="dialog-box"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="dialog-header">
                {dialog.type === 'success' ? (
                  <CheckCircle className="dialog-icon success" size={28} />
                ) : dialog.type === 'confirm' ? (
                  <AlertCircle className="dialog-icon warning" size={28} />
                ) : dialog.type === 'prompt' ? (
                  <Edit3 className="dialog-icon info" size={28} />
                ) : (
                  <Info className="dialog-icon info" size={28} />
                )}
                <h3>{dialog.title || (dialog.type === 'confirm' ? 'Atenção' : dialog.type === 'prompt' ? 'Entrada' : 'Aviso')}</h3>
              </div>
              <div className="dialog-body">
                <p>{dialog.message}</p>
                {dialog.type === 'prompt' && (
                  <input 
                    type="text" 
                    className="dialog-input" 
                    value={inputValue} 
                    onChange={(e) => setInputValue(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleConfirm();
                      if (e.key === 'Escape') handleClose();
                    }}
                  />
                )}
              </div>
              <div className="dialog-actions">
                {(dialog.type === 'confirm' || dialog.type === 'prompt') && (
                  <button className="btn-cancel" onClick={handleClose}>
                    {dialog.cancelText}
                  </button>
                )}
                <button className="btn-confirm" onClick={handleConfirm}>
                  {dialog.confirmText}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
};
