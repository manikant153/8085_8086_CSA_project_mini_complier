import React, { useEffect, useState } from 'react';
import { Check, Moon, Palette, Sparkles, Sun, X } from 'lucide-react';
import { PRESET_THEMES, type ThemeId, type ThemeMode } from '../../data/themes';
import { useSimulatorStore } from '../../store/useSimulatorStore';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const QUICK_ACCENTS = [
  '#22d3ee',
  '#34d399',
  '#f59e0b',
  '#a78bfa',
  '#fb7185',
  '#38bdf8',
  '#f97316',
  '#ec4899',
];

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({ isOpen, onClose }) => {
  const {
    themeId,
    customAccentHex,
    customMode,
    activeTheme,
    setTheme,
    generateCustomTheme,
  } = useSimulatorStore();

  const [hexDraft, setHexDraft] = useState(customAccentHex);

  useEffect(() => {
    setHexDraft(customAccentHex);
  }, [customAccentHex]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const presetList = Object.values(PRESET_THEMES);

  const handleHexChange = (val: string) => {
    setHexDraft(val);
    if (/^#?[0-9a-fA-F]{6}$/.test(val.trim())) {
      const normalized = val.trim().startsWith('#') ? val.trim() : `#${val.trim()}`;
      generateCustomTheme(normalized, customMode);
    }
  };

  const handleModeToggle = (mode: ThemeMode) => {
    generateCustomTheme(customAccentHex, mode);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border shadow-2xl"
        style={{
          backgroundColor: 'var(--ss-bg-elevated)',
          borderColor: 'var(--ss-border-strong)',
          color: 'var(--ss-text-primary)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-3.5"
          style={{ borderColor: 'var(--ss-border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg border"
              style={{
                backgroundColor: 'var(--ss-accent-soft)',
                borderColor: 'var(--ss-accent)',
                color: 'var(--ss-accent)',
              }}
            >
              <Palette className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-wide">
                Silicon Studio Theme Engine
              </h2>
              <p className="text-[11px]" style={{ color: 'var(--ss-text-muted)' }}>
                Select a curated preset or generate a custom palette from any accent color
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition hover:opacity-80"
            style={{ color: 'var(--ss-text-muted)' }}
            aria-label="Close theme selector"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {/* Curated Presets */}
          <div>
            <div
              className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: 'var(--ss-text-muted)' }}
            >
              Curated Presets
            </div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {presetList.map((preset) => {
                const isSelected = themeId === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => setTheme(preset.id as ThemeId)}
                    className="flex items-start justify-between rounded-xl border p-3 text-left transition"
                    style={{
                      backgroundColor: preset.tokens.bgSvg,
                      borderColor: isSelected ? preset.tokens.accent : preset.tokens.borderStrong,
                      boxShadow: isSelected ? `0 0 0 1px ${preset.tokens.accent}` : undefined,
                      color: preset.tokens.textPrimary,
                    }}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold">{preset.name}</span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase"
                          style={{
                            backgroundColor: preset.tokens.accentSoft,
                            color: preset.tokens.accentText,
                          }}
                        >
                          {preset.mode}
                        </span>
                      </div>
                      <p
                        className="mt-0.5 truncate text-[11px]"
                        style={{ color: preset.tokens.textMuted }}
                      >
                        {preset.tagline}
                      </p>
                      <div className="mt-2 flex items-center gap-1.5">
                        {[
                          preset.tokens.accent,
                          preset.tokens.secondary,
                          preset.tokens.success,
                          preset.tokens.warning,
                          preset.tokens.danger,
                        ].map((swatch, idx) => (
                          <span
                            key={idx}
                            className="h-3 w-3 rounded-full border border-white/20"
                            style={{ backgroundColor: swatch }}
                          />
                        ))}
                      </div>
                    </div>
                    {isSelected && (
                      <span
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                        style={{
                          backgroundColor: preset.tokens.accent,
                          color: preset.mode === 'dark' ? '#05080f' : '#ffffff',
                        }}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Theme Generator */}
          <div
            className="rounded-xl border p-4"
            style={{
              backgroundColor: 'var(--ss-bg-panel-alt)',
              borderColor:
                themeId === 'custom' ? 'var(--ss-accent)' : 'var(--ss-border-subtle)',
            }}
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" style={{ color: 'var(--ss-accent)' }} />
                <span className="text-xs font-bold">Custom Theme Generator</span>
                {themeId === 'custom' && (
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      backgroundColor: 'var(--ss-accent-soft)',
                      color: 'var(--ss-accent-text)',
                    }}
                  >
                    Active
                  </span>
                )}
              </div>

              {/* Dark / Light Base Mode Toggle */}
              <div
                className="flex items-center gap-1 rounded-lg border p-0.5"
                style={{
                  backgroundColor: 'var(--ss-bg-input)',
                  borderColor: 'var(--ss-border-subtle)',
                }}
              >
                <button
                  onClick={() => handleModeToggle('dark')}
                  className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition"
                  style={{
                    backgroundColor:
                      customMode === 'dark' ? 'var(--ss-accent-soft)' : 'transparent',
                    color:
                      customMode === 'dark' ? 'var(--ss-accent-text)' : 'var(--ss-text-muted)',
                  }}
                >
                  <Moon className="h-3 w-3" />
                  Dark
                </button>
                <button
                  onClick={() => handleModeToggle('light')}
                  className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-semibold transition"
                  style={{
                    backgroundColor:
                      customMode === 'light' ? 'var(--ss-accent-soft)' : 'transparent',
                    color:
                      customMode === 'light' ? 'var(--ss-accent-text)' : 'var(--ss-text-muted)',
                  }}
                >
                  <Sun className="h-3 w-3" />
                  Light
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Native Color Picker + Hex Input */}
              <label
                className="flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-1.5"
                style={{
                  backgroundColor: 'var(--ss-bg-input)',
                  borderColor: 'var(--ss-border-strong)',
                }}
              >
                <input
                  type="color"
                  value={customAccentHex}
                  onChange={(e) => generateCustomTheme(e.target.value, customMode)}
                  className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <input
                  type="text"
                  value={hexDraft}
                  onChange={(e) => handleHexChange(e.target.value)}
                  maxLength={7}
                  className="w-20 bg-transparent font-mono text-xs uppercase outline-none"
                  style={{ color: 'var(--ss-text-primary)' }}
                  aria-label="Custom accent hex color"
                />
              </label>

              {/* Quick Swatches */}
              <div className="flex flex-wrap items-center gap-1.5">
                {QUICK_ACCENTS.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => generateCustomTheme(hex, customMode)}
                    className="h-6 w-6 rounded-full border-2 transition hover:scale-110"
                    style={{
                      backgroundColor: hex,
                      borderColor:
                        themeId === 'custom' &&
                        customAccentHex.toLowerCase() === hex.toLowerCase()
                          ? 'var(--ss-text-primary)'
                          : 'transparent',
                    }}
                    title={`Generate theme from ${hex}`}
                  />
                ))}
              </div>
            </div>

            {/* Live Token Preview Strip */}
            <div
              className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-[11px]"
              style={{
                backgroundColor: activeTheme.tokens.bgSvg,
                borderColor: activeTheme.tokens.borderSubtle,
              }}
            >
              <span className="font-mono" style={{ color: activeTheme.tokens.synOpcode }}>
                MVI A, 48H
              </span>
              <span className="font-mono" style={{ color: activeTheme.tokens.synDirective }}>
                ORG 2000H
              </span>
              <span className="font-mono" style={{ color: activeTheme.tokens.synRegister }}>
                HL (M)
              </span>
              <span className="font-mono" style={{ color: activeTheme.tokens.synLiteral }}>
                00FFH
              </span>
              <span className="font-mono" style={{ color: activeTheme.tokens.synLabel }}>
                LOOP:
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};