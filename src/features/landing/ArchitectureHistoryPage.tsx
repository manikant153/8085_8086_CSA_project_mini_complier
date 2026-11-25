import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Clock,
  Code2,
  Copy,
  Cpu,
  ExternalLink,
  History,
  Layers,
} from 'lucide-react';
import { ARCH_HISTORIES, type ArchitectureId } from '../../data/landingData';

interface ArchitectureHistoryPageProps {
  archId: ArchitectureId;
  onBackToOverview: () => void;
  onSwitchArch: (arch: ArchitectureId) => void;
  onLaunchStudio: () => void;
}

export const ArchitectureHistoryPage: React.FC<ArchitectureHistoryPageProps> = ({
  archId,
  onBackToOverview,
  onSwitchArch,
  onLaunchStudio,
}) => {
  const data = ARCH_HISTORIES[archId];
  const otherArch: ArchitectureId = archId === '8085' ? '8086' : '8085';
  const [imgFailed, setImgFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(data.sampleCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

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
      {/* Top Menu Bar with Launch Studio Button */}
      <header
        className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0d1424) 84%, transparent)',
          borderColor: 'var(--ss-border, #1e293b)',
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
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
              <span>Overview</span>
            </button>

            <div className="hidden items-center gap-2 sm:flex">
              <Cpu className="h-4 w-4" style={{ color: 'var(--ss-accent, #38bdf8)' }} />
              <span className="text-xs font-bold tracking-wider uppercase">
                {data.name} · History & Assembly
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setImgFailed(false);
                onSwitchArch(otherArch);
              }}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors hover:border-[var(--ss-accent,#38bdf8)]"
              style={{
                borderColor: 'var(--ss-border, #1e293b)',
                color: 'var(--ss-muted, #94a3b8)',
              }}
            >
              View {otherArch} History
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
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        {/* Hero Section */}
        <section className="grid grid-cols-1 items-center gap-8 lg:grid-cols-12">
          <div className="space-y-4 lg:col-span-7">
            <div
              className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold"
              style={{
                borderColor: 'color-mix(in srgb, var(--ss-accent, #38bdf8) 40%, transparent)',
                backgroundColor: 'color-mix(in srgb, var(--ss-accent, #38bdf8) 12%, transparent)',
                color: 'var(--ss-accent, #38bdf8)',
              }}
            >
              <History className="h-3.5 w-3.5" />
              <span>First Released: {data.released}</span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
              {data.name}:{' '}
              <span style={{ color: 'var(--ss-accent, #38bdf8)' }}>{data.tagline}</span>
            </h1>

            <p
              className="text-sm leading-relaxed sm:text-base"
              style={{ color: 'var(--ss-muted, #94a3b8)' }}
            >
              {data.overview}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={onLaunchStudio}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold shadow-lg transition-transform hover:scale-[1.02]"
                style={{
                  backgroundColor: 'var(--ss-accent, #38bdf8)',
                  color: '#06101c',
                }}
              >
                <span>Open {data.id} in Silicon Studio</span>
                <ArrowRight className="h-4 w-4" />
              </button>

              <a
                href={data.wikiUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-colors hover:border-[var(--ss-accent,#38bdf8)]"
                style={{
                  borderColor: 'var(--ss-border, #1e293b)',
                  backgroundColor: 'var(--ss-surface, #0f172a)',
                }}
              >
                <span>Wikipedia Reference</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>

          {/* Chip Photo + Silicon Card */}
          <div className="lg:col-span-5">
            <div
              className="overflow-hidden rounded-2xl border p-4 shadow-2xl"
              style={{
                borderColor: 'color-mix(in srgb, var(--ss-accent, #38bdf8) 28%, var(--ss-border, #1e293b))',
                backgroundColor: 'var(--ss-surface, #0f172a)',
              }}
            >
              {!imgFailed ? (
                <div className="grid grid-cols-1 gap-3">
                  <img
                    src={data.imageUrl}
                    alt={data.imageCaption}
                    onError={() => setImgFailed(true)}
                    className="h-52 w-full rounded-xl object-cover"
                  />
                  {data.secondaryImageUrl && (
                    <img
                      src={data.secondaryImageUrl}
                      alt={`${data.name} silicon die`}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                      className="h-36 w-full rounded-xl object-cover"
                    />
                  )}
                </div>
              ) : (
                <div
                  className="flex h-52 flex-col items-center justify-center rounded-xl border"
                  style={{
                    borderColor: 'var(--ss-border, #1e293b)',
                    backgroundColor: 'var(--ss-bg, #070b14)',
                  }}
                >
                  <Cpu className="h-14 w-14" style={{ color: 'var(--ss-accent, #38bdf8)' }} />
                  <span className="mt-2 font-mono text-sm font-bold">{data.name} · 40-Pin DIP</span>
                </div>
              )}

              <div className="mt-3 text-xs opacity-80">{data.imageCaption}</div>
              <div className="mt-1 text-[11px] opacity-65">
                <strong>Architects:</strong> {data.architects}
              </div>
            </div>
          </div>
        </section>

        {/* Hardware Specifications Grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Transistor Count', value: data.transistors },
            { label: 'Process & Package', value: data.processNode },
            { label: 'Clock Frequency', value: data.clockRange },
            { label: 'Bus & Address Space', value: data.busAndMemory },
          ].map((spec) => (
            <div
              key={spec.label}
              className="rounded-2xl border p-4"
              style={{
                borderColor: 'var(--ss-border, #1e293b)',
                backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 90%, transparent)',
              }}
            >
              <div className="text-[11px] font-semibold uppercase tracking-wider opacity-65">
                {spec.label}
              </div>
              <div className="mt-1 text-sm font-bold">{spec.value}</div>
            </div>
          ))}
        </section>

        {/* Key Breakthroughs & Historical Timeline */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div
            className="rounded-2xl border p-6 lg:col-span-6"
            style={{
              borderColor: 'var(--ss-border, #1e293b)',
              backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 90%, transparent)',
            }}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <Layers className="h-4 w-4" style={{ color: 'var(--ss-accent, #38bdf8)' }} />
              <span>Why It Was a Breakthrough</span>
            </div>
            <ul className="mt-4 space-y-3 text-xs leading-relaxed sm:text-sm">
              {data.breakthroughs.map((item) => (
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
            className="rounded-2xl border p-6 lg:col-span-6"
            style={{
              borderColor: 'var(--ss-border, #1e293b)',
              backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 90%, transparent)',
            }}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              <Clock className="h-4 w-4" style={{ color: 'var(--ss-accent, #38bdf8)' }} />
              <span>Historical Timeline ({data.projectStarted})</span>
            </div>
            <div className="mt-4 space-y-3.5">
              {data.timeline.map((step) => (
                <div
                  key={step.year}
                  className="flex items-start gap-3 rounded-xl border p-3"
                  style={{
                    borderColor: 'var(--ss-border, #1e293b)',
                    backgroundColor: 'var(--ss-bg, #070b14)',
                  }}
                >
                  <span
                    className="shrink-0 rounded-md px-2 py-0.5 font-mono text-xs font-bold"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--ss-accent, #38bdf8) 16%, transparent)',
                      color: 'var(--ss-accent, #38bdf8)',
                    }}
                  >
                    {step.year}
                  </span>
                  <span className="text-xs leading-relaxed">{step.event}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How Assembly Language Was Coded */}
        <section
          className="rounded-2xl border p-6"
          style={{
            borderColor: 'var(--ss-border, #1e293b)',
            backgroundColor: 'color-mix(in srgb, var(--ss-surface, #0f172a) 90%, transparent)',
          }}
        >
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" style={{ color: 'var(--ss-accent, #38bdf8)' }} />
              <h2 className="text-lg font-bold sm:text-xl">
                How Assembly Language Was Coded on the {data.name}
              </h2>
            </div>

            <button
              type="button"
              onClick={onLaunchStudio}
              className="inline-flex items-center gap-2 self-start rounded-xl px-4 py-2 text-xs font-bold"
              style={{
                backgroundColor: 'var(--ss-accent, #38bdf8)',
                color: '#06101c',
              }}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Try in Interactive Studio</span>
            </button>
          </div>

          <p
            className="mt-3 text-xs leading-relaxed sm:text-sm"
            style={{ color: 'var(--ss-muted, #94a3b8)' }}
          >
            {data.assemblyHistory}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold opacity-80">{data.sampleTitle}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-colors hover:border-[var(--ss-accent,#38bdf8)]"
                  style={{ borderColor: 'var(--ss-border, #1e293b)' }}
                >
                  {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre
                className="overflow-x-auto rounded-xl border p-4 font-mono text-xs leading-relaxed"
                style={{
                  borderColor: 'var(--ss-border, #1e293b)',
                  backgroundColor: 'var(--ss-bg, #070b14)',
                }}
              >
                {data.sampleCode}
              </pre>
            </div>

            <div className="flex flex-col justify-between space-y-3 lg:col-span-5">
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider opacity-70">
                  Key Programming Notes
                </div>
                {data.sampleNotes.map((note) => (
                  <div
                    key={note}
                    className="rounded-xl border p-3.5 text-xs leading-relaxed"
                    style={{
                      borderColor: 'var(--ss-border, #1e293b)',
                      backgroundColor: 'var(--ss-bg, #070b14)',
                    }}
                  >
                    {note}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={onLaunchStudio}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition-colors hover:bg-[var(--ss-accent,#38bdf8)] hover:text-[#06101c]"
                style={{
                  borderColor: 'var(--ss-accent, #38bdf8)',
                  color: 'var(--ss-accent, #38bdf8)',
                }}
              >
                <span>Launch All 7 Simulator Panels</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};