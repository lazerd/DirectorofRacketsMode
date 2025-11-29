'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Trophy, Mail, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || 'Login failed');
        return;
      }

      router.push('/dashboard');
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[var(--color-primary)] p-12 flex-col justify-between">
        <div>
          <Link href="/" className="flex items-center gap-3 text-white">
            <Trophy size={36} />
            <span className="font-display font-bold text-2xl">Director of Rackets</span>
          </Link>
        </div>
        <div className="text-white">
          <h1 className="font-display text-4xl font-bold mb-4">
            Welcome back
          </h1>
          <p className="text-white/80 text-lg">
            Sign in to manage your slots, clients, and email blasts.
          </p>
        </div>
        <div className="text-white/60 text-sm">
          © {new Date().getFullYear()} Director of Rackets
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Trophy size={32} className="text-[var(--color-primary)]" />
            <span className="font-display font-bold text-2xl">Director of Rackets</span>
          </div>

          <div className="card p-8">
            <h2 className="text-2xl font-bold mb-2">Sign in</h2>
            <p className="text-[var(--color-text-secondary)] mb-6">
              Enter your credentials to continue
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
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
                    autoComplete="email"
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
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
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
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-[var(--color-text-secondary)]">
              Don't have an account?{' '}
              <Link href="/register" className="text-[var(--color-primary)] font-medium hover:underline">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
