import Link from 'next/link';
import { 
  Zap, 
  Building2,
  Users,
  Calendar,
  Mail,
  CheckCircle,
  ArrowRight,
  Trophy,
  UserCircle,
  Briefcase
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[var(--color-surface)]/80 backdrop-blur-md border-b border-[var(--color-border)]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Trophy size={28} className="text-[var(--color-primary)]" />
            <span className="font-display font-bold text-xl">Director of Rackets</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login" className="btn btn-ghost">
              Sign In
            </Link>
            <Link href="/register" className="btn btn-primary">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-light)] text-[var(--color-primary)] text-sm font-medium mb-6">
            <Trophy size={16} />
            The Complete Tennis & Racket Sports Platform
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Manage Your Club.<br />
            <span className="text-[var(--color-primary)]">Fill Every Slot.</span>
          </h1>
          <p className="text-xl text-[var(--color-text-secondary)] mb-8 max-w-2xl mx-auto">
            Whether you're a club director managing a team of coaches, or an independent pro 
            filling your own calendar — Director of Rackets has you covered.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn btn-primary btn-lg">
              Start Free <ArrowRight size={18} />
            </Link>
            <Link href="#features" className="btn btn-secondary btn-lg">
              Explore Features
            </Link>
          </div>
        </div>
      </section>

      {/* Role Cards */}
      <section id="features" className="py-20 px-6 bg-[var(--color-surface)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
            Choose Your Path
          </h2>
          <p className="text-center text-[var(--color-text-secondary)] mb-12 max-w-2xl mx-auto">
            Director of Rackets adapts to your needs — whether you're running a club or coaching solo.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Director Card */}
            <div className="card p-8 card-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-50 rounded-bl-full" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-5">
                  <Building2 size={28} className="text-purple-600" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-3">Club Director</h3>
                <p className="text-[var(--color-text-secondary)] mb-6">
                  Run your entire tennis program. Manage unlimited coaches, see all open slots 
                  in one view, and send club-wide email blasts.
                </p>
                <ul className="space-y-3 mb-6">
                  <FeatureItem>Unlimited coaches under your club</FeatureItem>
                  <FeatureItem>Club-wide calendar view</FeatureItem>
                  <FeatureItem>Send club email blasts</FeatureItem>
                  <FeatureItem>Invite coaches with codes</FeatureItem>
                </ul>
                <Link href="/register?role=director" className="btn btn-primary w-full">
                  Register as Director
                </Link>
              </div>
            </div>

            {/* Club Coach Card */}
            <div className="card p-8 card-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-bl-full" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-5">
                  <Users size={28} className="text-blue-600" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-3">Club Coach</h3>
                <p className="text-[var(--color-text-secondary)] mb-6">
                  Join an existing club. Manage your own clients and slots while being 
                  part of a larger organization.
                </p>
                <ul className="space-y-3 mb-6">
                  <FeatureItem>Personal calendar & clients</FeatureItem>
                  <FeatureItem>Part of club ecosystem</FeatureItem>
                  <FeatureItem>Send your own blasts</FeatureItem>
                  <FeatureItem>Appear in club directory</FeatureItem>
                </ul>
                <Link href="/register?role=club_coach" className="btn btn-secondary w-full">
                  Join a Club
                </Link>
              </div>
            </div>

            {/* Independent Coach Card */}
            <div className="card p-8 card-hover relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-100 to-green-50 rounded-bl-full" />
              <div className="relative">
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-5">
                  <UserCircle size={28} className="text-green-600" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-3">Independent Coach</h3>
                <p className="text-[var(--color-text-secondary)] mb-6">
                  Go solo. Perfect for freelance coaches who manage their own book of 
                  clients without a club affiliation.
                </p>
                <ul className="space-y-3 mb-6">
                  <FeatureItem>Your own private calendar</FeatureItem>
                  <FeatureItem>Manage unlimited clients</FeatureItem>
                  <FeatureItem>Send personal blasts</FeatureItem>
                  <FeatureItem>No club overhead</FeatureItem>
                </ul>
                <Link href="/register?role=independent" className="btn btn-secondary w-full">
                  Go Independent
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-4">
            No More Email Spam
          </h2>
          <p className="text-center text-[var(--color-text-secondary)] mb-12 max-w-2xl mx-auto">
            Unlike other booking systems, we don't bombard clients with emails on every slot. 
            You control when notifications go out.
          </p>

          <div className="grid md:grid-cols-4 gap-8">
            <Step
              number={1}
              icon={Calendar}
              title="Create Slots"
              description="Add open times to your calendar. No emails sent yet."
            />
            <Step
              number={2}
              icon={Zap}
              title="Build Your List"
              description="Keep adding slots throughout the day or week."
            />
            <Step
              number={3}
              icon={Mail}
              title="Send Blast"
              description="Hit one button. Clients get ONE email with ALL slots."
            />
            <Step
              number={4}
              icon={CheckCircle}
              title="First Click Wins"
              description="Race-condition safe claiming. No double bookings."
            />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-[var(--color-surface)]">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">
            Everything You Need
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Feature
              icon={Calendar}
              title="Weekly Calendar"
              description="Beautiful, intuitive calendar view. Click to create slots instantly."
            />
            <Feature
              icon={Mail}
              title="Smart Email Blasts"
              description="One email per client with all available slots. No spam."
            />
            <Feature
              icon={Users}
              title="Client Management"
              description="Import clients in bulk, manage relationships easily."
            />
            <Feature
              icon={Building2}
              title="Club Structure"
              description="Directors see all coaches. Coaches see their own calendar."
            />
            <Feature
              icon={Zap}
              title="Race-Condition Safe"
              description="Database-level locking prevents double bookings. Always."
            />
            <Feature
              icon={Briefcase}
              title="Multi-Coach Support"
              description="Clients can belong to multiple coaches. Flexible relationships."
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-br from-[var(--color-primary)] to-indigo-600">
        <div className="max-w-3xl mx-auto text-center text-white">
          <Trophy size={48} className="mx-auto mb-6 opacity-80" />
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">
            Ready to take control?
          </h2>
          <p className="text-white/80 text-lg mb-8">
            Join directors and coaches who have streamlined their scheduling forever.
          </p>
          <Link 
            href="/register" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-[var(--color-primary)] rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            Get Started Free <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-[var(--color-primary)]" />
            <span className="font-display font-semibold">Director of Rackets</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-[var(--color-text-muted)]">
            <span>Powered by LastMinuteLesson Technology</span>
          </div>
          <div className="text-sm text-[var(--color-text-muted)]">
            © {new Date().getFullYear()} Director of Rackets. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

function Step({ 
  number, 
  icon: Icon, 
  title, 
  description 
}: { 
  number: number;
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <div className="relative inline-block mb-4">
        <div className="w-16 h-16 rounded-full bg-[var(--color-primary-light)] flex items-center justify-center">
          <Icon size={28} className="text-[var(--color-primary)]" />
        </div>
        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-[var(--color-primary)] text-white text-sm font-bold flex items-center justify-center">
          {number}
        </div>
      </div>
      <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
    </div>
  );
}

function Feature({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType;
  title: string;
  description: string;
}) {
  return (
    <div className="card p-6 card-hover">
      <div className="w-12 h-12 rounded-lg bg-[var(--color-primary-light)] flex items-center justify-center mb-4">
        <Icon size={24} className="text-[var(--color-primary)]" />
      </div>
      <h3 className="font-display text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-[var(--color-text-secondary)]">{description}</p>
    </div>
  );
}
