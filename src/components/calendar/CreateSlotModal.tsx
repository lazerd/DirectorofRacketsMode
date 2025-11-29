'use client';

import { useState, useEffect } from 'react';
import Modal from '@/components/ui/Modal';
import { format } from 'date-fns';
import { getTimeOptions, parseTimeString, createDateWithTime } from '@/lib/dates';
import { Clock, MessageSquare, MapPin, Info } from 'lucide-react';

interface CreateSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedHour: number | null;
  timezone: string;
  onSubmit: (data: {
    start_time: string;
    end_time: string;
    note?: string;
    location?: string;
  }) => Promise<void>;
  clientCount: number;
}

export default function CreateSlotModal({
  isOpen,
  onClose,
  selectedDate,
  selectedHour,
  timezone,
  onSubmit,
  clientCount,
}: CreateSlotModalProps) {
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');
  const [location, setLocation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const timeOptions = getTimeOptions();

  // Set default times when modal opens
  useEffect(() => {
    if (isOpen && selectedHour !== null) {
      const start = `${selectedHour.toString().padStart(2, '0')}:00`;
      const end = `${(selectedHour + 1).toString().padStart(2, '0')}:00`;
      setStartTime(start);
      setEndTime(end);
    }
  }, [isOpen, selectedHour]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedDate || !startTime || !endTime) {
      setError('Please select start and end times');
      return;
    }

    const { hours: startHours, minutes: startMinutes } = parseTimeString(startTime);
    const { hours: endHours, minutes: endMinutes } = parseTimeString(endTime);

    const startDateTime = createDateWithTime(selectedDate, startHours, startMinutes, timezone);
    const endDateTime = createDateWithTime(selectedDate, endHours, endMinutes, timezone);

    if (endDateTime <= startDateTime) {
      setError('End time must be after start time');
      return;
    }

    if (startDateTime < new Date()) {
      setError('Cannot create slots in the past');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        start_time: startDateTime.toISOString(),
        end_time: endDateTime.toISOString(),
        note: note.trim() || undefined,
        location: location.trim() || undefined,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStartTime('');
    setEndTime('');
    setNote('');
    setLocation('');
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Open Slot">
      <form onSubmit={handleSubmit}>
        {selectedDate && (
          <div className="mb-5 p-4 rounded-lg bg-[var(--color-primary-light)] border border-[var(--color-primary)]">
            <div className="font-semibold text-[var(--color-primary)]">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="label">
              <Clock size={14} className="inline mr-1" />
              Start Time
            </label>
            <select
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="input select"
              required
            >
              <option value="">Select time</option>
              {timeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">
              <Clock size={14} className="inline mr-1" />
              End Time
            </label>
            <select
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="input select"
              required
            >
              <option value="">Select time</option>
              {timeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="label">
            <MapPin size={14} className="inline mr-1" />
            Location (optional)
          </label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input"
            placeholder="e.g., Court 3, Indoor courts"
            maxLength={100}
          />
        </div>

        <div className="mb-4">
          <label className="label">
            <MessageSquare size={14} className="inline mr-1" />
            Note (optional)
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="input"
            rows={2}
            placeholder="e.g., Available for beginners"
            maxLength={200}
          />
          <div className="text-xs text-[var(--color-text-muted)] mt-1">
            {note.length}/200 characters
          </div>
        </div>

        {/* Info Box - No auto-send */}
        <div className="mb-5 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-blue-600 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-800">Clients won't be notified yet</p>
              <p className="text-blue-700 mt-1">
                After creating slots, use the <strong>"Send Email Blast"</strong> button 
                to notify {clientCount > 0 ? `your ${clientCount} client${clientCount !== 1 ? 's' : ''}` : 'your clients'} about all available times at once.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={handleClose}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16 }} />
                Creating...
              </>
            ) : (
              'Create Slot'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
