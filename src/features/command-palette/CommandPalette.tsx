import React, { useEffect, useMemo, useState } from 'react';
import { Palette, Search, X } from 'lucide-react';
import { ISA_8086_LIST } from '../../core/isa/arch8086';
import { ISA_TABLE } from '../../core/isa/opcodes';
import { useSimulatorStore } from '../../store/useSimulatorStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenThemeSelector: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenThemeSelector,
}) => {
  const [query, setQuery] = useState('');
  const {
    architecture,
    setArchitecture,
    assembleCode,
    stepForward,
    stepBackward,
    runProgram,
    resetCpu,
  } = useSimulatorStore();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const instructions8085 = useMemo(() => Object.values(ISA_TABLE), []);

  const filtered8085 = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return instructions8085.slice(0, 18);
    return instructions8085.filter(
      (ins) =>
        ins.mnemonic.toLowerCase().includes(q) || ins.description.toLowerCase().includes(q)
    );
  }, [query, instructions8085]);

  const filtered8086 = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ISA_8086_LIST.slice(0, 18);
    return ISA_8086_LIST.filter(
      (ins) =>
        ins.mnemonic.toLowerCase().includes(q) ||
        ins.description.toLowerCase().includes(q) ||
        ins.category.toLowerCase().includes(q)
    );
  }, [query]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-3 pt-12 backdrop-blur-sm sm:pt-20"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: 'var(--ss-bg-elevated)',
          borderColor: 'var(--ss-border-strong)',
          color: 'var(--ss-text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex shrink-0 items-center border-b px-4 py-3"
          style={{ borderColor: 'var(--ss-border-subtle)' }}
        >
          <Search className="mr-2.5 h-4 w-4 shrink-0" style={{ color: 'var(--ss-accent)' }} />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${architecture} ISA reference...`}
            className="min-w-0 w-full bg-transparent text-sm outline-none"
            style={{ color: 'var(--ss-text-primary)' }}
          />
          <button
            onClick={onClose}
            className="shrink-0 transition hover:opacity-80"
            style={{ color: 'var(--ss-text-muted)' }}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Quick Actions */}
        <div
          className="flex shrink-0 flex-wrap gap-1.5 border-b px-4 py-2"
          style={{
            backgroundColor: 'var(--ss-bg-panel-alt)',
            borderColor: 'var(--ss-border-subtle)',
          }}
        >
          {[
            { label: architecture === '8085' ? 'Assemble' : 'Validate 8086', fn: assembleCode },
            { label: 'Step Forward', fn: stepForward },
            { label: 'Step Back', fn: stepBackward },
            { label: 'Run Program', fn: runProgram },
            { label: 'Reset CPU', fn: resetCpu },
          ].map((act) => (
            <button
              key={act.label}
              onClick={() => {
                act.fn();
                onClose();
              }}
              className="rounded-md border px-2.5 py-1 text-xs font-medium transition hover:opacity-90"
              style={{
                backgroundColor: 'var(--ss-bg-input)',
                borderColor: 'var(--ss-border-strong)',
                color: 'var(--ss-accent-text)',
              }}
            >
              {act.label}
            </button>
          ))}
          <button
            onClick={() => setArchitecture(architecture === '8085' ? '8086' : '8085')}
            className="rounded-md border px-2.5 py-1 text-xs font-medium transition hover:opacity-90"
            style={{
              backgroundColor: 'var(--ss-bg-input)',
              borderColor: 'var(--ss-border-strong)',
              color: 'var(--ss-warning)',
            }}
          >
            Switch to {architecture === '8085' ? '16-bit 8086' : '8-bit 8085'}
          </button>
          <button
            onClick={() => {
              onClose();
              onOpenThemeSelector();
            }}
            className="flex items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-medium transition hover:opacity-90"
            style={{
              backgroundColor: 'var(--ss-accent-soft)',
              borderColor: 'var(--ss-accent)',
              color: 'var(--ss-accent-text)',
            }}
          >
            <Palette className="h-3 w-3" />
            Change Theme
          </button>
        </div>

        {/* Architecture-Specific ISA Reference List */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {architecture === '8085'
            ? filtered8085.map((ins) => (
                <div
                  key={ins.mnemonic}
                  className="flex items-center justify-between border-b px-4 py-2.5"
                  style={{ borderColor: 'var(--ss-border-subtle)' }}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold" style={{ color: 'var(--ss-accent)' }}>
                        {ins.mnemonic}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                        style={{
                          backgroundColor: 'var(--ss-bg-panel-alt)',
                          color: 'var(--ss-text-secondary)',
                        }}
                      >
                        {ins.bytes}B ·{' '}
                        {Array.isArray(ins.tStates)
                          ? `${ins.tStates[0]}/${ins.tStates[1]}T`
                          : `${ins.tStates}T`}
                      </span>
                      <span className="font-mono text-[10px]" style={{ color: 'var(--ss-warning)' }}>
                        [{ins.machineCycles.join(' → ')}]
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--ss-text-muted)' }}>
                      {ins.description}
                    </p>
                  </div>
                </div>
              ))
            : filtered8086.map((ins) => (
                <div
                  key={ins.mnemonic}
                  className="flex items-center justify-between border-b px-4 py-2.5"
                  style={{ borderColor: 'var(--ss-border-subtle)' }}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold" style={{ color: 'var(--ss-accent)' }}>
                        {ins.mnemonic} {ins.operands}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 font-mono text-[10px]"
                        style={{
                          backgroundColor: 'var(--ss-bg-panel-alt)',
                          color: 'var(--ss-secondary)',
                        }}
                      >
                        {ins.category}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--ss-text-muted)' }}>
                      {ins.description}
                    </p>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </div>
  );
};