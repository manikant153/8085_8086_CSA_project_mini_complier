import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, FileCode2, Layers, Users } from 'lucide-react';
import { TEAM_MEMBERS } from '../../data/landingData';

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

  return (
    <div
      className="min-h-screen w-full overflow-x-hidden"
      style={{
        backgroundColor: 'var(--ss-bg, #070b14)',
        color: 'var(--ss-text, #e2e8f0)',
        backgroundImage:
          'linear-gradient(to right, rgba(56, 189, 248, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(56, 189, 248, 0.04) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }}
    >
      {/* Top Menu Bar */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0d1424) 84%, transparent)',
          borderColor: 'var(--ss-border, #1e293b)',
        }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            onClick={onBackToOverview}
            className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:border-[var(--ss-accent,#38bdf8)]"
            style={{
              borderColor: 'var(--ss-border, #1e293b)',
              backgroundColor: 'var(--ss-bg, #070b14)',
            }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Overview</span>
          </button>

          <button
            type="button"
            onClick={onLaunchStudio}
            className="inline-flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-xs font-bold shadow-md transition-transform hover:scale-[1.03]"
            style={{
              backgroundColor: 'var(--ss-accent, #38bdf8)',
              color: '#06101c',
            }}
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
            borderColor: 'color-mix(in srgb, var(--ss-accent, #38bdf8) 28%, var(--ss-border, #1e293b))',
            backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 92%, transparent)',
          }}
        >
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border font-mono text-xl font-extrabold"
              style={{
                borderColor: 'var(--ss-accent, #38bdf8)',
                backgroundColor: 'color-mix(in srgb, var(--ss-accent, #38bdf8) 14%, transparent)',
                color: 'var(--ss-accent, #38bdf8)',
              }}
            >
              {member.initials}
            </div>

            <div className="space-y-1.5">
              <div
                className="text-xs font-bold tracking-wider uppercase"
                style={{ color: 'var(--ss-accent, #38bdf8)' }}
              >
                Project Builder Profile
              </div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">{member.name}</h1>
              <div className="text-sm font-medium opacity-85">{member.role}</div>
            </div>
          </div>

          <p
            className="mt-5 text-sm leading-relaxed"
            style={{ color: 'var(--ss-muted, #94a3b8)' }}
          >
            {member.summary}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {member.techFocus.map((tag) => (
              <span
                key={tag}
                className="rounded-full border px-3 py-1 text-xs font-medium"
                style={{
                  borderColor: 'color-mix(in srgb, var(--ss-accent, #38bdf8) 35%, transparent)',
                  backgroundColor: 'color-mix(in srgb, var(--ss-accent, #38bdf8) 10%, transparent)',
                  color: 'var(--ss-accent, #38bdf8)',
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
            style={{
              borderColor: 'var(--ss-border, #1e293b)',
              backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 90%, transparent)',
            }}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <Layers className="h-4 w-4" style={{ color: 'var(--ss-accent, #38bdf8)' }} />
              <span>Key Project Contributions</span>
            </div>

            <ul className="mt-4 space-y-3 text-xs leading-relaxed sm:text-sm">
              {member.contributions.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: 'var(--ss-accent, #38bdf8)' }}
                  />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-2xl border p-6 md:col-span-5"
            style={{
              borderColor: 'var(--ss-border, #1e293b)',
              backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 90%, transparent)',
            }}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <FileCode2 className="h-4 w-4" style={{ color: 'var(--ss-accent, #38bdf8)' }} />
              <span>Owned Modules</span>
            </div>

            <div className="mt-4 space-y-2">
              {member.modules.map((mod) => (
                <div
                  key={mod}
                  className="rounded-xl border px-3 py-2 font-mono text-xs"
                  style={{
                    borderColor: 'var(--ss-border, #1e293b)',
                    backgroundColor: 'var(--ss-bg, #070b14)',
                  }}
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
          style={{
            borderColor: 'var(--ss-border, #1e293b)',
            backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 90%, transparent)',
          }}
        >
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-75">
            <Users className="h-3.5 w-3.5" style={{ color: 'var(--ss-accent, #38bdf8)' }} />
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
                    borderColor: active
                      ? 'var(--ss-accent, #38bdf8)'
                      : 'var(--ss-border, #1e293b)',
                    backgroundColor: active
                      ? 'color-mix(in srgb, var(--ss-accent, #38bdf8) 15%, transparent)'
                      : 'var(--ss-bg, #070b14)',
                    color: active ? 'var(--ss-accent, #38bdf8)' : 'var(--ss-text, #e2e8f0)',
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