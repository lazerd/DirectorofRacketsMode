'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { formatDate, formatTimeSlot } from '@/lib/dates';
import { 
  Clock, 
  User, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Filter
} from 'lucide-react';
import type { Slot, AuthUser } from '@/types/database';

type SlotWithClient = Slot & { client?: { name: string; email: string } | null };

export default function HistoryPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [slots, setSlots] = useState<SlotWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'claimed' | 'open' | 'cancelled'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sessionRes, slotsRes] = await Promise.all([
        fetch('/api/auth/session'),
        fetch('/api/slots'),
      ]);
      
      const sessionData = await sessionRes.json();
      const slotsData = await slotsRes.json();
      
      if (sessionData.success) {
        setUser(sessionData.data);
      }
      
      if (slotsData.success) {
        // Sort by date, most recent first
        const sorted = slotsData.data.sort(
          (a: Slot, b: Slot) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        );
        setSlots(sorted);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredSlots = slots.filter((slot) => {
    if (filter === 'all') return true;
    return slot.status === filter;
  });

  const stats = {
    total: slots.length,
    claimed: slots.filter((s) => s.status === 'claimed').length,
    open: slots.filter((s) => s.status === 'open').length,
    cancelled: slots.filter((s) => s.status === 'cancelled').length,
  };

  const claimRate = stats.total > 0 
    ? Math.round((stats.claimed / (stats.claimed + stats.cancelled)) * 100) 
    : 0;

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
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Booking History</h1>
          <p className="text-[var(--color-text-secondary)]">
            View all your past and upcoming lesson slots.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <div className="text-sm text-[var(--color-text-secondary)]">Total Slots</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-[var(--color-text-secondary)]">Claimed</div>
            <div className="text-2xl font-bold text-green-600">{stats.claimed}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-[var(--color-text-secondary)]">Open</div>
            <div className="text-2xl font-bold text-[var(--color-primary)]">{stats.open}</div>
          </div>
          <div className="card p-4">
            <div className="text-sm text-[var(--color-text-secondary)]">Claim Rate</div>
            <div className="text-2xl font-bold text-purple-600">{claimRate}%</div>
          </div>
        </div>

        {/* Filter */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <Filter size={18} className="text-[var(--color-text-muted)]" />
              <span className="text-sm font-medium">Filter:</span>
              <div className="flex gap-2">
                {(['all', 'claimed', 'open', 'cancelled'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`btn btn-sm ${
                      filter === f ? 'btn-primary' : 'btn-ghost'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                    {f !== 'all' && (
                      <span className="ml-1 text-xs opacity-70">
                        ({f === 'claimed' ? stats.claimed : f === 'open' ? stats.open : stats.cancelled})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Slots List */}
          <div className="divide-y divide-[var(--color-border-light)]">
            {filteredSlots.length === 0 ? (
              <div className="p-8 text-center text-[var(--color-text-secondary)]">
                <Calendar size={40} className="mx-auto mb-3 opacity-30" />
                <p>No slots found</p>
              </div>
            ) : (
              filteredSlots.map((slot) => (
                <HistorySlotRow 
                  key={slot.id} 
                  slot={slot} 
                  timezone={user?.timezone || 'America/New_York'} 
                />
              ))
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

interface HistorySlotRowProps {
  slot: SlotWithClient;
  timezone: string;
}

function HistorySlotRow({ slot, timezone }: HistorySlotRowProps) {
  const statusConfig = {
    open: {
      icon: Clock,
      badge: 'badge-primary',
      label: 'Open',
    },
    claimed: {
      icon: CheckCircle,
      badge: 'badge-success',
      label: 'Claimed',
    },
    cancelled: {
      icon: XCircle,
      badge: 'badge-error',
      label: 'Cancelled',
    },
  };

  const config = statusConfig[slot.status];
  const StatusIcon = config.icon;
  const isPast = new Date(slot.end_time) < new Date();

  return (
    <div className={`p-4 hover:bg-[var(--color-bg)] transition-colors ${isPast ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            slot.status === 'open' ? 'bg-[var(--color-primary-light)]' :
            slot.status === 'claimed' ? 'bg-green-100' :
            'bg-gray-100'
          }`}>
            <StatusIcon size={20} className={
              slot.status === 'open' ? 'text-[var(--color-primary)]' :
              slot.status === 'claimed' ? 'text-green-600' :
              'text-gray-500'
            } />
          </div>
          <div>
            <div className="font-medium">
              {formatDate(slot.start_time, 'EEEE, MMMM d, yyyy', timezone)}
            </div>
            <div className="text-sm text-[var(--color-text-secondary)]">
              {formatTimeSlot(slot.start_time, slot.end_time, timezone)}
            </div>
            {slot.note && (
              <div className="text-sm text-[var(--color-text-muted)] mt-1">
                {slot.note}
              </div>
            )}
          </div>
        </div>
        <div className="text-right">
          <span className={`badge ${config.badge}`}>{config.label}</span>
          {slot.status === 'claimed' && slot.client && (
            <div className="mt-2 flex items-center gap-1 text-sm text-[var(--color-text-secondary)]">
              <User size={14} />
              {slot.client.name}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
