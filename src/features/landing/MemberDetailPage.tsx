import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FileCode2, Layers, Users } from 'lucide-react';
import { TEAM_MEMBERS } from '../../data/landingData';
import { getSavedLandingPalette, LANDING_PALETTES } from './LandingTheme';

interface MemberDetailPageProps {
  memberId: string;
  onBackToOverview: () => void;
  onSelectMember: (memberId: string) => void;
  onLaunchStudio: () => void;
}

export const MemberDetailPage: React.FC<MemberDetailPageProps> = ({
  memberId,
  onBackToOverview,
  onSelectMember,
  onLaunchStudio,
}) => {
  const member = TEAM_MEMBERS.find((m) => m.id === memberId) ?? TEAM_MEMBERS[0];
  const p = LANDING_PALETTES[getSavedLandingPalette()];

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{
        backgroundColor: p.bg,
        color: p.text,
        backgroundImage: `linear-gradient(to right, ${p.gridLine} 1px, transparent 1px), linear-gradient(to bottom, ${p.gridLine} 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }}
    >
      {/* Top Menu Bar */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{
          backgroundColor: `color-mix(in srgb, ${p.surface} 84%, transparent)`,
          borderColor: p.border,
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onBackToOverview}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold"
            style={{ borderColor: p.border, backgroundColor: p.surfaceAlt }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Overview</span>
          </button>

          <button
            type="button"
            onClick={onLaunchStudio}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold shadow-md transition-transform hover:scale-[1.03]"
            style={{ backgroundColor: p.accent, color: p.accentText }}
          >
            <span>Launch Studio</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
        {/* Member Header Card */}
        <section
          className="rounded-2xl border p-6 shadow-2xl sm:p-8"
          style={{
            borderColor: `color-mix(in srgb, ${p.accent} 32%, ${p.border})`,
            backgroundColor: p.surface,
          }}
        >
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border font-mono text-xl font-extrabold"
              style={{
                borderColor: p.accent,
                backgroundColor: `color-mix(in srgb, ${p.accent} 14%, transparent)`,
                color: p.accent,
              }}
            >
              {member.initials}
            </div>

            <div className="space-y-1.5">
              <div
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: p.accent }}
              >
                Project Builder Profile
              </div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">{member.name}</h1>
              <div className="text-sm font-medium opacity-85">{member.role}</div>
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed" style={{ color: p.muted }}>
            {member.summary}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {member.techFocus.map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-3 py-1 text-xs font-medium"
                style={{
                  borderColor: `color-mix(in srgb, ${p.accent} 35%, transparent)`,
                  backgroundColor: `color-mix(in srgb, ${p.accent} 10%, transparent)`,
                  color: p.accent,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </section>

        {/* Contributions & Key Modules */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div
            className="rounded-2xl border p-6 md:col-span-7"
            style={{ borderColor: p.border, backgroundColor: p.surface }}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <Layers className="h-4 w-4" style={{ color: p.accent }} />
              <span>Key Project Contributions</span>
            </div>

            <ul className="mt-4 space-y-3 text-xs leading-relaxed sm:text-sm">
              {member.contributions.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" style={{ color: p.accent }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-2xl border p-6 md:col-span-5"
            style={{ borderColor: p.border, backgroundColor: p.surface }}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <FileCode2 className="h-4 w-4" style={{ color: p.accentSecondary }} />
              <span>Owned Modules</span>
            </div>

            <div className="mt-4 space-y-2">
              {member.modules.map((mod) => (
                <div
                  key={mod}
                  className="rounded-xl border px-3 py-2 font-mono text-xs"
                  style={{ borderColor: p.border, backgroundColor: p.surfaceAlt }}
                >
                  {mod}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Switch Between Team Members */}
        <section
          className="rounded-2xl border p-5"
          style={{ borderColor: p.border, backgroundColor: p.surface }}
        >
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-75">
            <Users className="h-3.5 w-3.5" style={{ color: p.accent }} />
            <span>Explore Other Team Members</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {TEAM_MEMBERS.map((m) => {
              const active = m.id === member.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => onSelectMember(m.id)}
                  className="rounded-xl border px-4 py-2 text-xs font-semibold transition-all"
                  style={{
                    borderColor: active ? p.accent : p.border,
                    backgroundColor: active
                      ? `color-mix(in srgb, ${p.accent} 15%, transparent)`
                      : p.surfaceAlt,
                    color: active ? p.accent : p.text,
                  }}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
};