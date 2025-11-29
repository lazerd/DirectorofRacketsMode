'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Calendar, 
  User,
  Loader2,
  Zap
} from 'lucide-react';
import { format } from 'date-fns';

function ClaimPageContent() {
  const searchParams = useSearchParams();
  const slotId = searchParams.get('slot');
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'loading' | 'ready' | 'claiming' | 'success' | 'already_claimed' | 'error'>('loading');
  const [slotData, setSlotData] = useState<{
    startTime: string;
    endTime: string;
    note: string | null;
    coach: { name: string; email: string; timezone: string };
  } | null>(null);
  const [claimResult, setClaimResult] = useState<{
    clientName: string;
    coachName: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!slotId || !token || !email) {
      setStatus('error');
      setErrorMessage('Invalid claim link');
      return;
    }
    checkSlotStatus();
  }, [slotId, token, email]);

  const checkSlotStatus = async () => {
    try {
      const res = await fetch(`/api/claim?slot_id=${slotId}&token=${token}`);
      const data = await res.json();

      if (!data.success) {
        setStatus('error');
        setErrorMessage(data.error || 'Invalid slot');
        return;
      }

      setSlotData(data.data);

      if (data.data.status === 'claimed') {
        setStatus('already_claimed');
      } else if (data.data.status === 'cancelled') {
        setStatus('error');
        setErrorMessage('This slot is no longer available');
      } else {
        setStatus('ready');
      }
    } catch {
      setStatus('error');
      setErrorMessage('Failed to load slot information');
    }
  };

  const handleClaim = async () => {
    setStatus('claiming');

    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: slotId,
          token,
          email,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        if (data.status === 'claimed') {
          setStatus('already_claimed');
        } else {
          setStatus('error');
          setErrorMessage(data.error || 'Failed to claim slot');
        }
        return;
      }

      setClaimResult({
        clientName: data.data.clientName,
        coachName: data.data.coachName,
      });
      setStatus('success');
    } catch {
      setStatus('error');
      setErrorMessage('An error occurred. Please try again.');
    }
  };

  const formatSlotTime = (startTime: string, endTime: string, timezone: string) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    return {
      date: format(start, 'EEEE, MMMM d, yyyy'),
      time: `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-bg)] to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Zap size={32} className="text-[var(--color-primary)]" />
          <span className="font-display font-bold text-2xl">LastMinuteLesson</span>
        </div>

        <div className="card p-8">
          {/* Loading State */}
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 size={48} className="mx-auto text-[var(--color-primary)] animate-spin" />
              <p className="mt-4 text-[var(--color-text-secondary)]">Loading slot details...</p>
            </div>
          )}

          {/* Ready to Claim */}
          {status === 'ready' && slotData && (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto bg-[var(--color-primary-light)] rounded-full flex items-center justify-center mb-4">
                  <Calendar size={32} className="text-[var(--color-primary)]" />
                </div>
                <h1 className="text-2xl font-bold mb-2">Lesson Slot Available!</h1>
                <p className="text-[var(--color-text-secondary)]">
                  {slotData.coach.name} has an open slot
                </p>
              </div>

              <div className="bg-[var(--color-primary-light)] rounded-xl p-5 mb-6">
                <div className="flex items-start gap-3 mb-3">
                  <Calendar size={20} className="text-[var(--color-primary)] mt-0.5" />
                  <div>
                    <div className="font-semibold">
                      {formatSlotTime(slotData.startTime, slotData.endTime, slotData.coach.timezone).date}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 mb-3">
                  <Clock size={20} className="text-[var(--color-primary)] mt-0.5" />
                  <div className="font-semibold">
                    {formatSlotTime(slotData.startTime, slotData.endTime, slotData.coach.timezone).time}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User size={20} className="text-[var(--color-primary)] mt-0.5" />
                  <div>
                    with <span className="font-semibold">{slotData.coach.name}</span>
                  </div>
                </div>
                {slotData.note && (
                  <div className="mt-3 pt-3 border-t border-[var(--color-primary)]/20 text-sm italic">
                    "{slotData.note}"
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-amber-800 text-sm font-medium">
                  ⚡ First come, first served! Click now to secure your spot.
                </p>
              </div>

              <button
                onClick={handleClaim}
                className="btn btn-primary btn-lg w-full"
              >
                Claim This Slot
              </button>
            </>
          )}

          {/* Claiming State */}
          {status === 'claiming' && (
            <div className="text-center py-8">
              <Loader2 size={48} className="mx-auto text-[var(--color-primary)] animate-spin" />
              <p className="mt-4 text-lg font-medium">Claiming your slot...</p>
              <p className="text-[var(--color-text-secondary)]">Please wait</p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && claimResult && (
            <>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={40} className="text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-green-700 mb-2">You're Booked!</h1>
                <p className="text-[var(--color-text-secondary)] mb-6">
                  Congratulations, {claimResult.clientName}! Your lesson with {claimResult.coachName} is confirmed.
                </p>
              </div>

              {slotData && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-5 mb-6">
                  <div className="flex items-start gap-3 mb-3">
                    <Calendar size={20} className="text-green-600 mt-0.5" />
                    <div className="font-semibold">
                      {formatSlotTime(slotData.startTime, slotData.endTime, slotData.coach.timezone).date}
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Clock size={20} className="text-green-600 mt-0.5" />
                    <div className="font-semibold">
                      {formatSlotTime(slotData.startTime, slotData.endTime, slotData.coach.timezone).time}
                    </div>
                  </div>
                </div>
              )}

              <p className="text-sm text-[var(--color-text-secondary)] text-center">
                A confirmation email has been sent to your inbox.
              </p>
            </>
          )}

          {/* Already Claimed */}
          {status === 'already_claimed' && (
            <>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle size={40} className="text-amber-600" />
                </div>
                <h1 className="text-2xl font-bold text-amber-700 mb-2">Already Claimed</h1>
                <p className="text-[var(--color-text-secondary)] mb-6">
                  Sorry! Someone else grabbed this slot just before you. Better luck next time!
                </p>
              </div>

              {slotData && (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Keep an eye on your inbox for future openings from {slotData.coach.name}.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Error State */}
          {status === 'error' && (
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-4">
                <XCircle size={40} className="text-red-600" />
              </div>
              <h1 className="text-2xl font-bold text-red-700 mb-2">Oops!</h1>
              <p className="text-[var(--color-text-secondary)]">
                {errorMessage}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-[var(--color-text-muted)] mt-6">
          Powered by LastMinuteLesson
        </p>
      </div>
    </div>
  );
}

export default function ClaimPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    }>
      <ClaimPageContent />
    </Suspense>
  );
}
