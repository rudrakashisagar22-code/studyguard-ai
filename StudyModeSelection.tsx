import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { Logo } from '@/components/Logo';
import { STUDY_MODES } from '@/types';
import type { StudyMode } from '@/types';

interface StudyModeSelectionProps {
  onBack: () => void;
  onSelect: (mode: StudyMode) => void;
}

export function StudyModeSelection({ onBack, onSelect }: StudyModeSelectionProps) {
  const [selected, setSelected] = useState<StudyMode | null>(null);

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
      <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-brand-200/40 blur-3xl animate-blob" />
      <div className="pointer-events-none absolute top-1/3 -left-40 h-[400px] w-[400px] rounded-full bg-accent-200/40 blur-3xl animate-blob [animation-delay:6s]" />

      {/* Nav */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <Logo />
        <button
          onClick={onBack}
          className="btn-ghost px-3 py-2 text-sm"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back</span>
        </button>
      </header>

      {/* Main */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-8 pb-20">
        <div className="text-center animate-slide-up">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
            Choose Your Study Mode
          </h1>
          <p className="mt-3 text-base sm:text-lg text-slate-600 max-w-xl mx-auto">
            Different students study differently. Select the mode that matches what you're doing — StudyGuard will adapt its monitoring accordingly.
          </p>
        </div>

        {/* Mode cards */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {STUDY_MODES.map((mode, i) => {
            const isSelected = selected === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => setSelected(mode.id)}
                className={`relative card p-6 text-left transition-all duration-300 animate-slide-up hover:shadow-card-hover ${
                  isSelected
                    ? 'ring-2 ring-brand-500 shadow-glow'
                    : 'hover:border-slate-300'
                }`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {/* Selected checkmark */}
                {isSelected && (
                  <div className="absolute top-4 right-4 h-7 w-7 rounded-full bg-brand-600 flex items-center justify-center animate-scale-in">
                    <Check size={16} className="text-white" strokeWidth={3} />
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center text-3xl shrink-0 transition-colors ${
                    isSelected ? 'bg-brand-50' : 'bg-slate-100'
                  }`}>
                    {mode.emoji}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-bold transition-colors ${
                      isSelected ? 'text-brand-700' : 'text-slate-900'
                    }`}>
                      {mode.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                      {mode.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => selected && onSelect(selected)}
            disabled={!selected}
            className="btn-primary px-8 py-4 text-base group disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Continue
            <ArrowRight size={20} className="transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </main>
    </div>
  );
}
