'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { formatDate, formatTimeSlot } from '@/lib/dates';
import { 
  Send, 
  Mail, 
  Clock, 
  Users, 
  Building2,
  AlertCircle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import type { AuthUser, Slot } from '@/types/database';

export default function BlastPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [blastType, setBlastType] = useState<'coach' | 'club'>('coach');
  
  // Unnotified slots
  const [coachSlots, setCoachSlots] = useState<Slot[]>([]);
  const [clubSlots, setClubSlots] = useState<Slot[]>([]);
  const [clientCount, setClientCount] = useState(0);
  
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Get session
      const sessionRes = await fetch('/api/auth/session');
      const sessionData = await sessionRes.json();
      
      if (sessionData.success) {
        setUser(sessionData.data);
        
        // Get coach's unnotified slots
        const slotsRes = await fetch('/api/slots');
        const slotsData = await slotsRes.json();
        
        if (slotsData.success) {
          const unnotified = slotsData.data.filter(
            (s: Slot) => s.status === 'open' && !s.notifications_sent && new Date(s.start_time) > new Date()
          );
          setCoachSlots(unnotified);
        }
        
        // Get client count
        const clientsRes = await fetch('/api/clients');
        const clientsData = await clientsRes.json();
        if (clientsData.success) {
          setClientCount(clientsData.data.length);
        }
        
        // If director, also get club slots
        if (sessionData.data.role === 'director' && sessionData.data.club_id) {
          const clubSlotsRes = await fetch('/api/slots?club=true');
          const clubSlotsData = await clubSlotsRes.json();
          
          if (clubSlotsData.success) {
            const unnotifiedClub = clubSlotsData.data.filter(
              (s: Slot) => s.status === 'open' && !s.notifications_sent && new Date(s.start_time) > new Date()
            );
            setClubSlots(unnotifiedClub);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendBlast = async () => {
    setSending(true);
    
    try {
      const endpoint = blastType === 'coach' ? '/api/blast/coach' : '/api/blast/club';
      const res = await fetch(endpoint, { method: 'POST' });
      const data = await res.json();
      
      if (!data.success) {
        error(data.error || 'Failed to send blast');
        return;
      }
      
      const { slots_notified, emails_sent, emails_failed } = data.data;
      
      if (emails_sent > 0) {
        success(`Blast sent! ${emails_sent} email${emails_sent > 1 ? 's' : ''} delivered for ${slots_notified} slot${slots_notified > 1 ? 's' : ''}.`);
      }
      
      if (emails_failed > 0) {
        error(`${emails_failed} email${emails_failed > 1 ? 's' : ''} failed to send.`);
      }
      
      // Refresh data
      await fetchData();
      
    } catch (err) {
      error('An error occurred while sending the blast');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="spinner" />
        </div>
      </DashboardLayout>
    );
  }

  const isDirector = user?.role === 'director';
  const currentSlots = blastType === 'coach' ? coachSlots : clubSlots;
  const canSend = currentSlots.length > 0 && clientCount > 0;

  return (
    <DashboardLayout>
      <div className="page-enter max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Send Email Blast</h1>
          <p className="text-[var(--color-text-secondary)]">
            Notify clients about your open slots. One email per client with all available times.
          </p>
        </div>

        {/* Blast Type Selector (for directors) */}
        {isDirector && (
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--color-border)]">
              <h2 className="font-semibold">Blast Type</h2>
            </div>
            <div className="p-4 grid grid-cols-2 gap-4">
              <button
                onClick={() => setBlastType('coach')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  blastType === 'coach'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary-light)]'
                    : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
                }`}
              >
                <Mail size={24} className={blastType === 'coach' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'} />
                <h3 className="font-semibold mt-2">My Slots Only</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Email my clients about my {coachSlots.length} open slot{coachSlots.length !== 1 ? 's' : ''}
                </p>
              </button>
              <button
                onClick={() => setBlastType('club')}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  blastType === 'club'
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]'
                }`}
              >
                <Building2 size={24} className={blastType === 'club' ? 'text-purple-600' : 'text-[var(--color-text-muted)]'} />
                <h3 className="font-semibold mt-2">Club-Wide Blast</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Email all club clients about {clubSlots.length} open slot{clubSlots.length !== 1 ? 's' : ''}
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Slots Preview */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Clock size={18} />
              Slots to Include ({currentSlots.length})
            </h2>
            {currentSlots.length > 0 && (
              <span className="badge badge-warning">
                Not yet sent
              </span>
            )}
          </div>
          
          {currentSlots.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar size={40} className="mx-auto mb-3 text-[var(--color-text-muted)] opacity-50" />
              <p className="text-[var(--color-text-secondary)]">
                No unnotified open slots to send.
              </p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">
                Create some open slots first, then come back to send a blast.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border-light)] max-h-[300px] overflow-y-auto">
              {currentSlots.map((slot) => (
                <div key={slot.id} className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center">
                    <Clock size={18} className="text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <div className="font-medium">
                      {formatDate(slot.start_time, 'EEE, MMM d', user?.timezone || 'America/New_York')}
                    </div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      {formatTimeSlot(slot.start_time, slot.end_time, user?.timezone || 'America/New_York')}
                    </div>
                  </div>
                  {slot.note && (
                    <div className="text-sm text-[var(--color-text-muted)] italic ml-auto">
                      "{slot.note}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recipients */}
        <div className="card mb-6">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h2 className="font-semibold flex items-center gap-2">
              <Users size={18} />
              Recipients
            </h2>
          </div>
          <div className="p-4">
            {clientCount === 0 ? (
              <div className="flex items-center gap-3 text-amber-600">
                <AlertCircle size={20} />
                <span>No clients to notify. Add clients first.</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-[var(--color-text-secondary)]">
                <CheckCircle size={20} className="text-green-500" />
                <span>
                  {blastType === 'coach' 
                    ? `${clientCount} client${clientCount !== 1 ? 's' : ''} will receive this email`
                    : `All club clients will receive this email`
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Send Button */}
        <div className="flex items-center justify-between p-6 bg-[var(--color-surface)] rounded-xl border border-[var(--color-border)]">
          <div>
            <h3 className="font-semibold">Ready to send?</h3>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Each client will receive one email listing all {currentSlots.length} available slot{currentSlots.length !== 1 ? 's' : ''}.
            </p>
          </div>
          <button
            onClick={handleSendBlast}
            disabled={!canSend || sending}
            className="btn btn-primary btn-lg"
          >
            {sending ? (
              <>
                <span className="spinner" style={{ width: 18, height: 18 }} />
                Sending...
              </>
            ) : (
              <>
                <Send size={18} />
                Send Blast
              </>
            )}
          </button>
        </div>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </DashboardLayout>
  );
}
