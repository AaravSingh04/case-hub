'use client';

import React from 'react';
import { Trash2, AlertCircle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  isDeleting?: boolean;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  isDeleting = false,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-xs">
      <div className="bg-white border border-neutral-border rounded shadow-elevation max-w-md w-full p-6 animate-in fade-in">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-border">
          <div className="flex items-center gap-2 text-academic-error">
            <Trash2 className="w-5 h-5" />
            <h3 className="font-serif text-lg font-bold text-navy-deep">
              {title}
            </h3>
          </div>
          <button onClick={onClose} className="text-neutral-muted hover:text-navy-deep">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <div className="p-3 bg-red-50 text-academic-error border border-academic-error/30 rounded text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>This action cannot be undone. All associated team listings and saved entries will also be permanently removed.</span>
          </div>

          <p className="text-xs text-neutral-text leading-relaxed">
            {message}
          </p>

          <div className="pt-4 border-t border-neutral-border flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="btn-secondary text-xs px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="bg-academic-error hover:bg-red-800 text-white font-medium text-xs px-4 py-2 rounded transition-colors"
            >
              {isDeleting ? 'Deleting...' : 'Confirm Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
