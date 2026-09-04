import { Brain, Camera, BarChart3, ShieldCheck, ArrowRight, LineChart } from 'lucide-react';
import { Logo } from '@/components/Logo';

interface LandingPageProps {
  onStart: () => void;
  onAnalytics: () => void;
}

export function LandingPage({ onStart, onAnalytics }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-200/40 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[400px] w-[400px] rounded-full bg-accent-200/40 blur-3xl animate-blob [animation-delay:6s]" />

      {/* Nav */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Logo />
        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
          <ShieldCheck size={16} className="text-success-600" />
          <span>Privacy-first study tracking</span>
        </div>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-20 sm:pt-20">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-sm font-medium text-slate-600 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success-500" />
            </span>
            AI-powered focus monitoring
          </div>

          <h1 className="mt-6 text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 text-balance animate-slide-up">
            Study smarter.
            <br />
            <span className="bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
              Stay focused.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl mx-auto text-balance animate-slide-up [animation-delay:0.1s]">
            StudyGuard AI helps students monitor their study sessions and improve
            concentration using real-time, on-device presence detection — no footage ever leaves your browser.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up [animation-delay:0.2s]">
            <button onClick={onStart} className="btn-primary px-8 py-4 text-base group">
              Start Studying
              <ArrowRight size={20} className="transition-transform group-hover:translate-x-0.5" />
            </button>
            <button onClick={onAnalytics} className="btn-ghost px-6 py-4 text-base group">
              <LineChart size={20} className="text-accent-600" />
              View Analytics
            </button>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldCheck size={16} className="text-success-600" />
              No sign-up needed
            </div>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {[
            {
              icon: Brain,
              title: 'Smart Focus Tracking',
              desc: 'A live timer tracks every second of your session and separates focused time from breaks automatically.',
              color: 'text-brand-600 bg-brand-50',
              delay: '0s',
            },
            {
              icon: Camera,
              title: 'On-Device Detection',
              desc: 'Your camera checks whether you are present at your desk. Detection runs locally in your browser — nothing is stored.',
              color: 'text-accent-600 bg-accent-50',
              delay: '0.1s',
            },
            {
              icon: BarChart3,
              title: 'Session Reports',
              desc: 'After each session, get a clear breakdown of total time, focused time, and your focus percentage.',
              color: 'text-success-600 bg-success-50',
              delay: '0.2s',
            },
          ].map((f) => (
            <div
              key={f.title}
              className="card p-6 hover:shadow-card-hover transition-all duration-300 animate-slide-up"
              style={{ animationDelay: f.delay }}
            >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${f.color}`}>
                <f.icon size={24} strokeWidth={2} />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Privacy banner */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="flex items-start gap-3 p-4 rounded-xl bg-white border border-slate-200 shadow-sm animate-fade-in">
            <ShieldCheck size={20} className="text-success-600 mt-0.5 shrink-0" />
            <p className="text-sm text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">Your privacy is protected.</span>{' '}
              Camera access is used only for real-time study monitoring. Camera footage is not stored
              or uploaded — all detection happens directly in your browser.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
