"use client";
import Modal from "./Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
}

export default function ConfirmDialog({
  open, onClose, onConfirm, title = "Confirm", message, confirmLabel = "Delete", loading,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      <div className="flex gap-3">
        <button onClick={onClose} className="btn-secondary flex-1" disabled={loading}>Cancel</button>
        <button
          onClick={onConfirm}
          className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-crimson text-white text-sm font-semibold rounded-xl hover:bg-crimson-700 transition-colors disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
