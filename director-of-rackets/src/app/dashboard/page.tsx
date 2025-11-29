'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import DashboardLayout from '@/components/layout/DashboardLayout';
import WeeklyCalendar from '@/components/calendar/WeeklyCalendar';
import CreateSlotModal from '@/components/calendar/CreateSlotModal';
import SlotDetailsModal from '@/components/calendar/SlotDetailsModal';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { startOfWeek, endOfWeek, addDays } from 'date-fns';
import { Send, Bell, AlertCircle } from 'lucide-react';
import type { Slot, Client, AuthUser } from '@/types/database';

export default function DashboardPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const [sessionRes, clientsRes] = await Promise.all([
        fetch('/api/auth/session'),
        fetch('/api/clients'),
      ]);
      
      const sessionData = await sessionRes.json();
      const clientsData = await clientsRes.json();
      
      if (sessionData.success) {
        setUser(sessionData.data);
        fetchSlots();
      }
      
      if (clientsData.success) {
        setClients(clientsData.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async () => {
    try {
      const now = new Date();
      const start = startOfWeek(now, { weekStartsOn: 0 });
      const end = addDays(endOfWeek(now, { weekStartsOn: 0 }), 14);
      
      const res = await fetch(
        `/api/slots?start=${start.toISOString()}&end=${end.toISOString()}`
      );
      const data = await res.json();
      
      if (data.success) {
        setSlots(data.data);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
  };

  const handleCreateSlot = (date: Date, hour: number) => {
    setSelectedDate(date);
    setSelectedHour(hour);
    setCreateModalOpen(true);
  };

  const handleSlotClick = (slot: Slot) => {
    setSelectedSlot(slot);
    setDetailsModalOpen(true);
  };

  // NO LONGER SENDS EMAILS - just creates the slot
  const handleSubmitSlot = async (data: {
    start_time: string;
    end_time: string;
    note?: string;
  }) => {
    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setSlots((prev) => [...prev, result.data]);
      success('Slot created! Use "Send Email Blast" to notify clients.');
    } catch (err) {
      throw err;
    }
  };

  const handleCancelSlot = async (slotId: string) => {
    try {
      const res = await fetch(`/api/slots/${slotId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setSlots((prev) =>
        prev.map((s) => (s.id === slotId ? { ...s, status: 'cancelled' } : s))
      );
      success('Slot cancelled');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to cancel slot');
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    try {
      const res = await fetch(`/api/slots/${slotId}`, {
        method: 'DELETE',
      });
      
      const result = await res.json();
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      setSlots((prev) => prev.filter((s) => s.id !== slotId));
      success('Slot deleted');
    } catch (err) {
      error(err instanceof Error ? err.message : 'Failed to delete slot');
    }
  };

  // Count unnotified slots
  const unnotifiedSlots = slots.filter(
    s => s.status === 'open' && !s.notifications_sent && new Date(s.start_time) > new Date()
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="spinner" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="page-enter">
        {/* Page Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">My Calendar</h1>
            <p className="text-[var(--color-text-secondary)]">
              Click any time slot to create an open lesson.
            </p>
          </div>
          
          {/* Send Blast CTA */}
          {unnotifiedSlots.length > 0 && (
            <Link
              href="/dashboard/blast"
              className="btn btn-primary gap-2"
            >
              <Send size={18} />
              Send Blast ({unnotifiedSlots.length})
            </Link>
          )}
        </div>

        {/* Pending Notification Banner */}
        {unnotifiedSlots.length > 0 && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="text-amber-600" size={20} />
              <div>
                <span className="font-medium text-amber-800">
                  {unnotifiedSlots.length} slot{unnotifiedSlots.length !== 1 ? 's' : ''} ready to send
                </span>
                <p className="text-sm text-amber-700">
                  Clients haven't been notified yet. Send an email blast when you're ready.
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/blast"
              className="btn btn-sm bg-amber-600 text-white hover:bg-amber-700"
            >
              Send Now
            </Link>
          </div>
        )}

        {/* No Clients Warning */}
        {clients.length === 0 && (
          <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-center gap-3">
            <AlertCircle className="text-blue-600" size={20} />
            <div className="flex-1">
              <span className="font-medium text-blue-800">No clients yet</span>
              <p className="text-sm text-blue-700">
                Add clients before creating slots so you can notify them.
              </p>
            </div>
            <Link href="/dashboard/clients" className="btn btn-sm btn-secondary">
              Add Clients
            </Link>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Clients"
            value={clients.length}
            color="primary"
          />
          <StatCard
            label="Open Slots"
            value={slots.filter((s) => s.status === 'open').length}
            color="warning"
          />
          <StatCard
            label="Claimed"
            value={slots.filter((s) => s.status === 'claimed').length}
            color="success"
          />
          <StatCard
            label="Pending Notify"
            value={unnotifiedSlots.length}
            color="secondary"
          />
        </div>

        {/* Calendar */}
        <WeeklyCalendar
          timezone={user?.timezone || 'America/New_York'}
          slots={slots}
          onCreateSlot={handleCreateSlot}
          onSlotClick={handleSlotClick}
        />

        {/* Create Slot Modal - NO AUTO EMAIL */}
        <CreateSlotModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          selectedDate={selectedDate}
          selectedHour={selectedHour}
          timezone={user?.timezone || 'America/New_York'}
          onSubmit={handleSubmitSlot}
          clientCount={clients.length}
        />

        {/* Slot Details Modal */}
        <SlotDetailsModal
          isOpen={detailsModalOpen}
          onClose={() => {
            setDetailsModalOpen(false);
            setSelectedSlot(null);
          }}
          slot={selectedSlot}
          timezone={user?.timezone || 'America/New_York'}
          onCancel={handleCancelSlot}
          onDelete={handleDeleteSlot}
        />

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </DashboardLayout>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  color: 'primary' | 'success' | 'warning' | 'secondary';
}

function StatCard({ label, value, color }: StatCardProps) {
  const colorClasses = {
    primary: 'text-[var(--color-primary)]',
    success: 'text-green-600',
    warning: 'text-amber-600',
    secondary: 'text-purple-600',
  };

  return (
    <div className="card p-4">
      <div className="text-sm text-[var(--color-text-secondary)] mb-1">{label}</div>
      <div className={`text-2xl font-bold ${colorClasses[color]}`}>
        {value}
      </div>
    </div>
  );
}
