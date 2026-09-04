import { ShieldCheck } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: { box: 'h-8 w-8', icon: 18, text: 'text-base' },
    md: { box: 'h-10 w-10', icon: 22, text: 'text-lg' },
    lg: { box: 'h-12 w-12', icon: 26, text: 'text-xl' },
  } as const;
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${s.box} rounded-xl bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center shadow-sm`}>
        <ShieldCheck className="text-white" size={s.icon} strokeWidth={2.5} />
      </div>
      <span className={`${s.text} font-bold tracking-tight text-slate-900`}>
        StudyGuard <span className="text-brand-600">AI</span>
      </span>
    </div>
  );
}
