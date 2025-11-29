'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Calendar, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Trophy,
  BarChart3,
  Building2,
  Send,
  UserPlus
} from 'lucide-react';
import type { AuthUser } from '@/types/database';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      
      if (!data.success) {
        router.push('/login');
        return;
      }
      
      setUser(data.data);
    } catch {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto" />
          <p className="mt-4 text-[var(--color-text-secondary)]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Build navigation items based on role
  const navItems = [
    { href: '/dashboard', icon: Calendar, label: 'My Calendar' },
    { href: '/dashboard/clients', icon: Users, label: 'Clients' },
  ];

  // Directors get club-specific navigation
  if (user.role === 'director') {
    navItems.push(
      { href: '/dashboard/club', icon: Building2, label: 'Club Calendar' },
      { href: '/dashboard/coaches', icon: UserPlus, label: 'Coaches' },
    );
  }

  navItems.push(
    { href: '/dashboard/history', icon: BarChart3, label: 'History' },
    { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
  );

  // Role badge styling
  const roleBadgeStyles = {
    director: 'bg-purple-100 text-purple-700',
    club_coach: 'bg-blue-100 text-blue-700',
    independent_coach: 'bg-green-100 text-green-700',
  };

  const roleLabels = {
    director: 'Director',
    club_coach: 'Club Coach',
    independent_coach: 'Independent',
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[var(--color-surface)] border-b border-[var(--color-border)]">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Trophy className="text-[var(--color-primary)]" size={24} />
          <span className="font-display font-bold text-lg">Director of Rackets</span>
        </Link>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="btn btn-ghost btn-icon"
        >
          {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 h-screen w-64 bg-[var(--color-surface)] 
            border-r border-[var(--color-border)] z-40
            transform transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="p-5 border-b border-[var(--color-border)]">
              <Link href="/dashboard" className="flex items-center gap-2">
                <Trophy className="text-[var(--color-primary)]" size={28} />
                <span className="font-display font-bold text-xl">Director of Rackets</span>
              </Link>
            </div>

            {/* User Info & Role */}
            <div className="p-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
                  <span className="text-[var(--color-primary)] font-semibold">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{user.name}</div>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full ${roleBadgeStyles[user.role]}`}>
                    {roleLabels[user.role]}
                  </span>
                </div>
              </div>
              {user.club && (
                <div className="mt-3 p-2 rounded-lg bg-[var(--color-bg)] text-sm">
                  <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                    <Building2 size={14} />
                    <span className="truncate">{user.club.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 overflow-y-auto">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] hover:text-[var(--color-text)] transition-colors"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon size={20} />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Send Blast Button */}
              <div className="mt-6 px-2">
                <Link
                  href="/dashboard/blast"
                  className="btn btn-primary w-full justify-center gap-2"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Send size={18} />
                  Send Email Blast
                </Link>
              </div>
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-[var(--color-border)]">
              <button
                onClick={handleLogout}
                className="w-full btn btn-ghost justify-start gap-3 text-[var(--color-text-secondary)]"
              >
                <LogOut size={18} />
                Sign Out
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
