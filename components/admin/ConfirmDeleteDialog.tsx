"use client";

import React, { useEffect } from "react";

export interface ConfirmDeletePreviewItem {
  id: string;
  label: string;
  meta?: string;
}

export interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  isSubmitting?: boolean;
  error?: string | null;
  items?: ConfirmDeletePreviewItem[];
  cascadeSummary?: string;
  cascadeToggle?: {
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    helperText?: string;
  };
}

export function ConfirmDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm Delete",
  isSubmitting = false,
  error = null,
  items = [],
  cascadeSummary,
  cascadeToggle,
}: ConfirmDeleteDialogProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const visibleItems = items.slice(0, 6);
  const remainingCount = Math.max(0, items.length - visibleItems.length);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
        onClick={() => !isSubmitting && onClose()}
        aria-hidden="true"
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className="relative bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 text-left"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-delete-title"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="w-11 h-11 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors disabled:opacity-50"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <h3 id="confirm-delete-title" className="mt-3 text-lg font-bold text-slate-900">
            {title}
          </h3>
          <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
            {description}
          </p>

          {items.length > 0 && (
            <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 max-h-40 overflow-y-auto">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Selected Items ({items.length})
              </p>
              <ul className="space-y-1.5 text-xs">
                {visibleItems.map((item) => (
                  <li key={item.id} className="flex items-center justify-between gap-2 text-slate-700">
                    <span className="font-semibold truncate">{item.label}</span>
                    {item.meta && (
                      <span className="font-mono text-[11px] text-slate-500 shrink-0">
                        {item.meta}
                      </span>
                    )}
                  </li>
                ))}
                {remainingCount > 0 && (
                  <li className="text-[11px] font-medium text-slate-500 pt-1 border-t border-slate-200">
                    + {remainingCount} more item{remainingCount === 1 ? "" : "s"}
                  </li>
                )}
              </ul>
            </div>
          )}

          {cascadeToggle && (
            <label className="mt-4 flex items-start gap-2.5 p-3 rounded-lg border border-red-200 bg-red-50/60 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={cascadeToggle.checked}
                onChange={(e) => cascadeToggle.onChange(e.target.checked)}
                disabled={isSubmitting}
                className="mt-0.5 w-4 h-4 rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <div className="text-xs">
                <span className="font-bold text-slate-900 block">
                  {cascadeToggle.label}
                </span>
                {cascadeToggle.helperText && (
                  <span className="text-slate-600 block mt-0.5 leading-normal">
                    {cascadeToggle.helperText}
                  </span>
                )}
              </div>
            </label>
          )}

          {cascadeSummary && (
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-900 leading-relaxed">
              <strong className="font-bold">Cascade Impact:</strong> {cascadeSummary}
            </div>
          )}

          {error && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {isSubmitting ? "Deleting..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
