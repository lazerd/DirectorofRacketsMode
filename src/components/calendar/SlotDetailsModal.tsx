'use client';

import { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { formatTimeSlot, formatDate } from '@/lib/dates';
import { 
  Clock, 
  User, 
  Mail, 
  MessageSquare, 
  Trash2, 
  XCircle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import type { Slot } from '@/types/database';

interface SlotDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slot: (Slot & { client?: { name: string; email: string } | null }) | null;
  timezone: string;
  onCancel: (slotId: string) => Promise<void>;
  onDelete: (slotId: string) => Promise<void>;
}

export default function SlotDetailsModal({
  isOpen,
  onClose,
  slot,
  timezone,
  onCancel,
  onDelete,
}: SlotDetailsModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!slot) return null;

  const handleCancel = async () => {
    setIsCancelling(true);
    try {
      await onCancel(slot.id);
      onClose();
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(slot.id);
      onClose();
    } finally {
      setIsDeleting(false);
      setShowConfirmDelete(false);
    }
  };

  const statusInfo = {
    open: {
      label: 'Open',
      badge: 'badge-primary',
      icon: Clock,
      description: 'This slot is available and clients have been notified.',
    },
    claimed: {
      label: 'Claimed',
      badge: 'badge-success',
      icon: CheckCircle,
      description: 'This slot has been claimed by a client.',
    },
    cancelled: {
      label: 'Cancelled',
      badge: 'badge-error',
      icon: XCircle,
      description: 'This slot has been cancelled.',
    },
  };

  const status = statusInfo[slot.status];
  const StatusIcon = status.icon;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Slot Details">
      <div className="space-y-5">
        {/* Status Banner */}
        <div className={`p-4 rounded-lg ${
          slot.status === 'open' ? 'bg-[var(--color-primary-light)] border border-[var(--color-primary)]' :
          slot.status === 'claimed' ? 'bg-green-50 border border-green-200' :
          'bg-gray-100 border border-gray-300'
        }`}>
          <div className="flex items-center gap-2">
            <StatusIcon size={18} className={
              slot.status === 'open' ? 'text-[var(--color-primary)]' :
              slot.status === 'claimed' ? 'text-green-600' :
              'text-gray-500'
            } />
            <span className={`badge ${status.badge}`}>{status.label}</span>
          </div>
          <p className="text-sm mt-2 text-[var(--color-text-secondary)]">
            {status.description}
          </p>
        </div>

        {/* Date & Time */}
        <div className="flex items-start gap-3">
          <Calendar size={18} className="text-[var(--color-text-muted)] mt-0.5" />
          <div>
            <div className="font-medium">
              {formatDate(slot.start_time, 'EEEE, MMMM d, yyyy', timezone)}
            </div>
            <div className="text-[var(--color-text-secondary)]">
              {formatTimeSlot(slot.start_time, slot.end_time, timezone)}
            </div>
          </div>
        </div>

        {/* Client Info (if claimed) */}
        {slot.status === 'claimed' && slot.client && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200">
            <div className="flex items-center gap-2 mb-2 text-green-700 font-medium">
              <User size={16} />
              Claimed by
            </div>
            <div className="font-semibold text-lg">{slot.client.name}</div>
            <div className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
              <Mail size={14} />
              <a href={`mailto:${slot.client.email}`} className="hover:underline">
                {slot.client.email}
              </a>
            </div>
          </div>
        )}

        {/* Note */}
        {slot.note && (
          <div className="flex items-start gap-3">
            <MessageSquare size={18} className="text-[var(--color-text-muted)] mt-0.5" />
            <div>
              <div className="text-sm text-[var(--color-text-secondary)]">Note</div>
              <div className="mt-1">{slot.note}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        {slot.status !== 'cancelled' && (
          <div className="pt-4 border-t border-[var(--color-border)]">
            {showConfirmDelete ? (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200">
                <p className="text-red-700 mb-3">
                  Are you sure you want to delete this slot? This cannot be undone.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleDelete}
                    className="btn btn-danger btn-sm"
                    disabled={isDeleting}
                  >
                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                  </button>
                  <button
                    onClick={() => setShowConfirmDelete(false)}
                    className="btn btn-secondary btn-sm"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                {slot.status === 'open' && (
                  <>
                    <button
                      onClick={handleCancel}
                      className="btn btn-secondary btn-sm"
                      disabled={isCancelling}
                    >
                      <XCircle size={16} />
                      {isCancelling ? 'Cancelling...' : 'Cancel Slot'}
                    </button>
                    <button
                      onClick={() => setShowConfirmDelete(true)}
                      className="btn btn-ghost btn-sm text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </>
                )}
                {slot.status === 'claimed' && (
                  <button
                    onClick={handleCancel}
                    className="btn btn-secondary btn-sm"
                    disabled={isCancelling}
                  >
                    <XCircle size={16} />
                    {isCancelling ? 'Cancelling...' : 'Cancel Booking'}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
