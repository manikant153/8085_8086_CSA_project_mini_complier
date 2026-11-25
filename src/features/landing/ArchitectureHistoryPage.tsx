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
import { Chip3DExplorer } from './Chip3DExplorer';

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
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(data.sampleCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f5f5f7] text-[#1d1d1f]">
      {/* Sticky Apple-Style Header */}
      <header className="sticky top-0 z-40 border-b border-black/10 bg-white/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onBackToOverview}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-[#f5f5f7] px-3.5 py-1.5 text-xs font-semibold hover:bg-[#e8e8ed]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Overview</span>
            </button>

            <div className="hidden items-center gap-2 sm:flex">
              <Cpu className="h-4 w-4 text-[#0071e3]" />
              <span className="text-xs font-bold tracking-wider uppercase">
                {data.name} · 3D Design & History
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSwitchArch(otherArch)}
              className="rounded-full border border-black/10 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#6e6e73] hover:text-[#1d1d1f]"
            >
              View {otherArch} 3D
            </button>

            <button
              type="button"
              onClick={onLaunchStudio}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0071e3] px-4 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0077ed]"
            >
              <span>Launch Studio</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10 sm:px-6">
        {/* Hero Intro */}
        <section className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#0071e3]/10 px-3 py-1 text-xs font-semibold text-[#0071e3]">
            <History className="h-3.5 w-3.5" />
            <span>First Released: {data.released}</span>
          </div>

          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div className="max-w-3xl space-y-2">
              <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                {data.name}. <span className="text-[#6e6e73]">{data.tagline}</span>
              </h1>
              <p className="text-sm leading-relaxed text-[#6e6e73] sm:text-base">{data.overview}</p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={data.wikiUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-4 py-2 text-xs font-semibold hover:bg-[#f0f0f3]"
              >
                <span>Wikipedia</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={onLaunchStudio}
                className="inline-flex items-center gap-2 rounded-full bg-[#1d1d1f] px-5 py-2 text-xs font-semibold text-white hover:bg-black"
              >
                <span>Open in Studio</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* Interactive 3D Spatial Chip Digital Twin */}
        <section>
          <Chip3DExplorer archId={archId} />
        </section>

        {/* Hardware Specifications Grid */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Transistor Count', value: data.transistors },
            { label: 'Process & Package', value: data.processNode },
            { label: 'Clock Frequency', value: data.clockRange },
            { label: 'Bus & Address Space', value: data.busAndMemory },
          ].map((spec) => (
            <div key={spec.label} className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6e6e73]">
                {spec.label}
              </div>
              <div className="mt-1.5 text-sm font-bold text-[#1d1d1f]">{spec.value}</div>
            </div>
          ))}
        </section>

        {/* Key Breakthroughs & Historical Timeline */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Layers className="h-4 w-4 text-[#0071e3]" />
              <span>Why It Was a Breakthrough</span>
            </div>
            <ul className="mt-4 space-y-3 text-xs leading-relaxed text-[#3a3a3c] sm:text-sm">
              {data.breakthroughs.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0071e3]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm lg:col-span-6">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Clock className="h-4 w-4 text-[#e05a33]" />
              <span>Historical Timeline ({data.projectStarted})</span>
            </div>
            <div className="mt-4 space-y-3">
              {data.timeline.map((step) => (
                <div
                  key={step.year}
                  className="flex items-start gap-3 rounded-2xl bg-[#f5f5f7] p-3.5"
                >
                  <span className="shrink-0 rounded-md bg-[#1d1d1f] px-2 py-0.5 font-mono text-xs font-bold text-white">
                    {step.year}
                  </span>
                  <span className="text-xs leading-relaxed text-[#3a3a3c]">{step.event}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How Assembly Language Was Coded */}
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#0071e3]" />
              <h2 className="text-lg font-bold sm:text-xl">
                How Assembly Language Was Coded on the {data.name}
              </h2>
            </div>

            <button
              type="button"
              onClick={onLaunchStudio}
              className="inline-flex items-center gap-2 self-start rounded-full bg-[#0071e3] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0077ed]"
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>Try in Interactive Studio</span>
            </button>
          </div>

          <p className="mt-3 text-xs leading-relaxed text-[#6e6e73] sm:text-sm">
            {data.assemblyHistory}
          </p>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-semibold text-[#6e6e73]">{data.sampleTitle}</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-[#f5f5f7] px-3 py-1 text-[11px] font-semibold"
                >
                  {copied ? (
                    <Check className="h-3 w-3 text-[#059669]" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="overflow-x-auto rounded-2xl bg-[#1d1d1f] p-4 font-mono text-xs leading-relaxed text-emerald-300">
                {data.sampleCode}
              </pre>
            </div>

            <div className="flex flex-col justify-between space-y-3 lg:col-span-5">
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#6e6e73]">
                  Key Programming Notes
                </div>
                {data.sampleNotes.map((note) => (
                  <div
                    key={note}
                    className="rounded-2xl bg-[#f5f5f7] p-3.5 text-xs leading-relaxed text-[#3a3a3c]"
                  >
                    {note}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={onLaunchStudio}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#1d1d1f] px-4 py-3 text-xs font-semibold text-white hover:bg-black"
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