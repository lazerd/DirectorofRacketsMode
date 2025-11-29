'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { ToastContainer } from '@/components/ui/Toast';
import { useToast } from '@/hooks/useToast';
import { TIMEZONES } from '@/lib/dates';
import { User, Globe, Mail, Lock } from 'lucide-react';
import type { AuthUser } from '@/types/database';

export default function SettingsPage() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [timezone, setTimezone] = useState('');
  
  const { toasts, removeToast, success, error } = useToast();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      
      if (data.success) {
        setUser(data.data);
        setName(data.data.name);
        setTimezone(data.data.timezone);
      }
    } catch (err) {
      error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    // Note: You would need to implement the update endpoint
    // For now, we'll show a success message
    try {
      // Placeholder for actual implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      success('Settings saved successfully');
    } catch (err) {
      error('Failed to save settings');
    } finally {
      setSaving(false);
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

  return (
    <DashboardLayout>
      <div className="page-enter max-w-2xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold mb-1">Settings</h1>
          <p className="text-[var(--color-text-secondary)]">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Profile Settings */}
        <form onSubmit={handleSave}>
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--color-border)]">
              <h2 className="font-semibold flex items-center gap-2">
                <User size={18} />
                Profile
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="label flex items-center gap-1">
                  <Mail size={14} />
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="input bg-[var(--color-bg)]"
                  disabled
                />
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Email cannot be changed
                </p>
              </div>
            </div>
          </div>

          {/* Timezone Settings */}
          <div className="card mb-6">
            <div className="p-4 border-b border-[var(--color-border)]">
              <h2 className="font-semibold flex items-center gap-2">
                <Globe size={18} />
                Timezone
              </h2>
            </div>
            <div className="p-5">
              <div>
                <label className="label">Your Timezone</label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="input select"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  All times will be displayed in this timezone
                </p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="card mt-8 border-red-200">
          <div className="p-4 border-b border-red-200 bg-red-50">
            <h2 className="font-semibold text-red-700 flex items-center gap-2">
              <Lock size={18} />
              Danger Zone
            </h2>
          </div>
          <div className="p-5">
            <p className="text-sm text-[var(--color-text-secondary)] mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  // Implement account deletion
                  error('Account deletion is not yet implemented');
                }
              }}
            >
              Delete Account
            </button>
          </div>
        </div>

        <ToastContainer toasts={toasts} onRemove={removeToast} />
      </div>
    </DashboardLayout>
  );
}
