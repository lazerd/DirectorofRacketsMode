'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Trophy, 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  Globe,
  Building2,
  Users,
  UserCircle,
  Ticket
} from 'lucide-react';
import { TIMEZONES } from '@/lib/dates';
import type { UserRole } from '@/types/database';

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get role from URL param
  const urlRole = searchParams.get('role');
  
  const [step, setStep] = useState<'role' | 'details'>(urlRole ? 'details' : 'role');
  const [role, setRole] = useState<UserRole>(
    urlRole === 'director' ? 'director' :
    urlRole === 'club_coach' ? 'club_coach' :
    'independent_coach'
  );
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [timezone, setTimezone] = useState('America/New_York');
  const [clubName, setClubName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (selectedRole: UserRole) => {
    setRole(selectedRole);
    setStep('details');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (role === 'director' && !clubName.trim()) {
      setError('Club name is required');
      return;
    }

    if (role === 'club_coach' && !inviteCode.trim()) {
      setError('Invite code is required to join a club');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          password, 
          role,
          timezone,
          clubName: role === 'director' ? clubName : undefined,
          inviteCode: role === 'club_coach' ? inviteCode : undefined,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Registration failed');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const roleInfo = {
    director: {
      icon: Building2,
      title: 'Club Director',
      description: 'Create and manage a club with unlimited coaches',
      color: 'purple',
    },
    club_coach: {
      icon: Users,
      title: 'Club Coach',
      description: 'Join an existing club with an invite code',
      color: 'blue',
    },
    independent_coach: {
      icon: UserCircle,
      title: 'Independent Coach',
      description: 'Manage your own clients and schedule',
      color: 'green',
    },
  };

  const currentRole = roleInfo[role];
  const RoleIcon = currentRole.icon;

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[var(--color-primary)] to-indigo-600 p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center gap-3 text-white">
            <Trophy size={36} />
            <span className="font-display font-bold text-2xl">Director of Rackets</span>
          </Link>
        </div>
        <div className="text-white">
          <h1 className="font-display text-4xl font-bold mb-4">
            Get started<br />in minutes
          </h1>
          <p className="text-white/80 text-lg mb-8">
            Whether you're running a club or coaching independently, 
            we've got you covered.
          </p>
        </div>
        <div className="text-white/60 text-sm">
          © {new Date().getFullYear()} Director of Rackets
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Trophy size={32} className="text-[var(--color-primary)]" />
            <span className="font-display font-bold text-2xl">Director of Rackets</span>
          </div>

          {step === 'role' ? (
            /* Role Selection */
            <div className="card p-8">
              <h2 className="text-2xl font-bold mb-2">How will you use this?</h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                Choose the option that best describes you
              </p>

              <div className="space-y-4">
                <RoleCard
                  role="director"
                  info={roleInfo.director}
                  onSelect={() => handleRoleSelect('director')}
                />
                <RoleCard
                  role="club_coach"
                  info={roleInfo.club_coach}
                  onSelect={() => handleRoleSelect('club_coach')}
                />
                <RoleCard
                  role="independent_coach"
                  info={roleInfo.independent_coach}
                  onSelect={() => handleRoleSelect('independent_coach')}
                />
              </div>

              <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
                Already have an account?{' '}
                <Link href="/login" className="text-[var(--color-primary)] font-medium hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          ) : (
            /* Registration Form */
            <div className="card p-8">
              <button
                onClick={() => setStep('role')}
                className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] mb-4"
              >
                ← Change role
              </button>

              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-4 ${
                role === 'director' ? 'bg-purple-100 text-purple-700' :
                role === 'club_coach' ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700'
              }`}>
                <RoleIcon size={16} />
                {currentRole.title}
              </div>

              <h2 className="text-2xl font-bold mb-2">Create your account</h2>
              <p className="text-[var(--color-text-secondary)] mb-6">
                {currentRole.description}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Your Name</label>
                  <div className="relative">
                    <User 
                      size={18} 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" 
                    />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input pl-10"
                      placeholder="Coach Smith"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Email</label>
                  <div className="relative">
                    <Mail 
                      size={18} 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" 
                    />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input pl-10"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <Lock 
                      size={18} 
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" 
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input pl-10 pr-10"
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Director: Club Name */}
                {role === 'director' && (
                  <div>
                    <label className="label">
                      <Building2 size={14} className="inline mr-1" />
                      Club Name
                    </label>
                    <input
                      type="text"
                      value={clubName}
                      onChange={(e) => setClubName(e.target.value)}
                      className="input"
                      placeholder="Sleepy Hollow Tennis Club"
                      required
                    />
                  </div>
                )}

                {/* Club Coach: Invite Code */}
                {role === 'club_coach' && (
                  <div>
                    <label className="label">
                      <Ticket size={14} className="inline mr-1" />
                      Invite Code
                    </label>
                    <input
                      type="text"
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                      className="input font-mono uppercase"
                      placeholder="ABC12345"
                      required
                    />
                    <p className="text-xs text-[var(--color-text-muted)] mt-1">
                      Get this code from your club director
                    </p>
                  </div>
                )}

                <div>
                  <label className="label flex items-center gap-1">
                    <Globe size={14} />
                    Timezone
                  </label>
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
                </div>

                {error && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner" style={{ width: 16, height: 16 }} />
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
                Already have an account?{' '}
                <Link href="/login" className="text-[var(--color-primary)] font-medium hover:underline">
                  Sign in
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function RoleCard({ 
  role, 
  info, 
  onSelect 
}: { 
  role: UserRole;
  info: { icon: React.ElementType; title: string; description: string; color: string };
  onSelect: () => void;
}) {
  const Icon = info.icon;
  
  const colorClasses = {
    purple: 'border-purple-200 hover:border-purple-400 hover:bg-purple-50',
    blue: 'border-blue-200 hover:border-blue-400 hover:bg-blue-50',
    green: 'border-green-200 hover:border-green-400 hover:bg-green-50',
  };

  const iconClasses = {
    purple: 'bg-purple-100 text-purple-600',
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${colorClasses[info.color as keyof typeof colorClasses]}`}
    >
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconClasses[info.color as keyof typeof iconClasses]}`}>
          <Icon size={24} />
        </div>
        <div>
          <h3 className="font-semibold">{info.title}</h3>
          <p className="text-sm text-[var(--color-text-secondary)]">{info.description}</p>
        </div>
      </div>
    </button>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
