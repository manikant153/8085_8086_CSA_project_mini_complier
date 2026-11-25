import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CircleDot,
  Hash,
  Search,
  X,
} from 'lucide-react';
import { DIRECTIVES } from '../../core/assembler/parser';
import {
  type ArchitectureId,
  DIRECTIVES_8086,
  ISA_8086_MAP,
  REG_8086_SET,
} from '../../core/isa/arch8086';
import { ISA_TABLE } from '../../core/isa/opcodes';
import { useSimulatorStore } from '../../store/useSimulatorStore';

const REG_8085_SET = new Set(['A', 'B', 'C', 'D', 'E', 'H', 'L', 'M', 'SP', 'PSW']);
const LINE_HEIGHT_PX = 24;

interface SearchMatch {
  line: number;
  startCol: number;
  endCol: number;
}

function renderWithSearchMarks(
  text: string,
  query: string,
  isActiveLine: boolean
): React.ReactNode {
  if (!query) return text;
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const parts: React.ReactNode[] = [];
  let pos = 0;
  let idx = lowerText.indexOf(lowerQuery, pos);
  let key = 0;

  while (idx !== -1) {
    if (idx > pos) {
      parts.push(<React.Fragment key={key++}>{text.slice(pos, idx)}</React.Fragment>);
    }
    parts.push(
      <mark
        key={key++}
        className="rounded-xs px-0.5 text-inherit"
        style={{
          backgroundColor: isActiveLine ? 'var(--ss-warning)' : 'var(--ss-warning-soft)',
          color: isActiveLine ? '#05080f' : 'inherit',
        }}
      >
        {text.slice(idx, idx + query.length)}
      </mark>
    );
    pos = idx + query.length;
    idx = lowerText.indexOf(lowerQuery, pos);
  }

  if (pos < text.length) {
    parts.push(<React.Fragment key={key++}>{text.slice(pos)}</React.Fragment>);
  }
  return parts.length > 0 ? parts : text;
}

function highlightLine(
  line: string,
  arch: ArchitectureId,
  textQuery: string,
  isActiveMatchLine: boolean
): React.ReactNode {
  const commentIdx = line.indexOf(';');
  const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : '';

  const isOpcode = (up: string) => (arch === '8085' ? up in ISA_TABLE : up in ISA_8086_MAP);
  const isDirective = (up: string) => (arch === '8085' ? DIRECTIVES.has(up) : DIRECTIVES_8086.has(up));
  const isReg = (up: string) => (arch === '8085' ? REG_8085_SET.has(up) : REG_8086_SET.has(up));

  const tokens = codePart.split(/(\s+|,|:|\[|\])/);
  return (
    <>
      {tokens.map((tok, i) => {
        const up = tok.trim().toUpperCase();
        if (!tok.trim()) return <span key={i}>{tok}</span>;
        const content = renderWithSearchMarks(tok, textQuery, isActiveMatchLine);
        if (isOpcode(up)) {
          return (
            <span key={i} className="font-semibold" style={{ color: 'var(--ss-syn-opcode)' }}>
              {content}
            </span>
          );
        }
        if (isDirective(up)) {
          return (
            <span key={i} className="font-semibold" style={{ color: 'var(--ss-syn-directive)' }}>
              {content}
            </span>
          );
        }
        if (isReg(up)) {
          return (
            <span key={i} className="font-medium" style={{ color: 'var(--ss-syn-register)' }}>
              {content}
            </span>
          );
        }
        if (/^(0X[0-9A-F]+|[0-9][0-9A-F]*H|[01]+B|\d+|'.')$/i.test(up)) {
          return (
            <span key={i} style={{ color: 'var(--ss-syn-literal)' }}>
              {content}
            </span>
          );
        }
        if (tokens[i + 1] === ':') {
          return (
            <span key={i} className="font-semibold" style={{ color: 'var(--ss-syn-label)' }}>
              {content}
            </span>
          );
        }
        return (
          <span key={i} style={{ color: 'var(--ss-text-primary)' }}>
            {content}
          </span>
        );
      })}
      {commentPart && (
        <span className="italic" style={{ color: 'var(--ss-syn-comment)' }}>
          {renderWithSearchMarks(commentPart, textQuery, isActiveMatchLine)}
        </span>
      )}
    </>
  );
}

export const CodeEditor: React.FC = () => {
  const {
    architecture,
    sourceCode,
    setSourceCode,
    setSelectedSnippet,
    assembleCode,
    assembly,
    assembly8086,
    cpu,
    cpu8086,
    breakpoints,
    toggleBreakpoint,
    hoveredLine,
    setHoveredLine,
    revision,
  } = useSimulatorStore();

  void revision;
  const is8085 = architecture === '8085';
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isFirstMount = useRef(true);

  const [searchOpen, setSearchOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<'text' | 'line'>('text');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMatchIdx, setActiveMatchIdx] = useState(0);

  const lines = useMemo(() => sourceCode.split('\n'), [sourceCode]);

  // Auto-assemble 250ms after typing or pasting code
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      assembleCode();
    }, 250);
    return () => clearTimeout(timer);
  }, [sourceCode, assembleCode]);

  const activeAsm = is8085 ? assembly : assembly8086;
  const activeDiagnostics = activeAsm?.diagnostics ?? [];
  const activePcLine = is8085
    ? assembly?.addressToRow[cpu.pc]?.lineNumber ?? null
    : assembly8086?.addressToRow[cpu8086.ip]?.lineNumber ?? null;

  const errorByLine = useMemo(() => {
    const map = new Map<number, string>();
    activeDiagnostics.forEach((d) => {
      if (!map.has(d.line)) map.set(d.line, d.message);
    });
    return map;
  }, [activeDiagnostics]);

  const scrollToLine = useCallback(
    (lineNum: number, focusEditor = false) => {
      const clamped = Math.max(1, Math.min(lines.length, lineNum));
      const ta = textareaRef.current;
      if (!ta) return;

      const targetTop = Math.max(0, (clamped - 1) * LINE_HEIGHT_PX - LINE_HEIGHT_PX * 2);
      ta.scrollTop = targetTop;
      if (backdropRef.current) backdropRef.current.scrollTop = targetTop;
      if (gutterRef.current) gutterRef.current.scrollTop = targetTop;

      if (focusEditor) {
        let offset = 0;
        for (let i = 0; i < clamped - 1; i++) {
          offset += lines[i].length + 1;
        }
        ta.focus();
        ta.setSelectionRange(offset, offset + lines[clamped - 1].length);
      }
    },
    [lines]
  );

  const parsedSearch = useMemo(() => {
    const raw = searchQuery.trim();
    if (!raw) return { isLineJump: searchMode === 'line', targetLine: null as number | null, text: '' };
    if (searchMode === 'line' || raw.startsWith(':')) {
      const numStr = raw.startsWith(':') ? raw.slice(1).trim() : raw;
      const num = parseInt(numStr, 10);
      return {
        isLineJump: true,
        targetLine: !Number.isNaN(num) && num >= 1 ? Math.min(lines.length, num) : null,
        text: '',
      };
    }
    return { isLineJump: false, targetLine: null as number | null, text: searchQuery };
  }, [searchQuery, searchMode, lines.length]);

  const matches = useMemo<SearchMatch[]>(() => {
    if (!searchOpen || parsedSearch.isLineJump || !parsedSearch.text) return [];
    const q = parsedSearch.text.toLowerCase();
    const out: SearchMatch[] = [];
    lines.forEach((line, idx) => {
      const lower = line.toLowerCase();
      let pos = 0;
      let hit = lower.indexOf(q, pos);
      while (hit !== -1) {
        out.push({ line: idx + 1, startCol: hit, endCol: hit + q.length });
        pos = hit + Math.max(1, q.length);
        hit = lower.indexOf(q, pos);
      }
    });
    return out;
  }, [searchOpen, parsedSearch, lines]);

  useEffect(() => {
    if (activeMatchIdx >= matches.length) {
      setActiveMatchIdx(0);
    }
  }, [matches.length, activeMatchIdx]);

  useEffect(() => {
    if (!searchOpen) return;
    if (parsedSearch.isLineJump && parsedSearch.targetLine !== null) {
      scrollToLine(parsedSearch.targetLine, false);
    } else if (matches.length > 0) {
      const m = matches[Math.min(activeMatchIdx, matches.length - 1)];
      scrollToLine(m.line, false);
    }
  }, [searchOpen, parsedSearch, matches, activeMatchIdx, scrollToLine]);

  const goToNextMatch = useCallback(() => {
    if (parsedSearch.isLineJump && parsedSearch.targetLine !== null) {
      scrollToLine(parsedSearch.targetLine, true);
      return;
    }
    if (matches.length === 0) return;
    setActiveMatchIdx((prev) => (prev + 1) % matches.length);
  }, [parsedSearch, matches.length, scrollToLine]);

  const goToPrevMatch = useCallback(() => {
    if (matches.length === 0) return;
    setActiveMatchIdx((prev) => (prev - 1 + matches.length) % matches.length);
  }, [matches.length]);

  const openSearch = useCallback((mode: 'text' | 'line') => {
    setSearchMode(mode);
    setSearchOpen(true);
    if (mode === 'text' && textareaRef.current) {
      const ta = textareaRef.current;
      const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd).trim();
      if (sel && !sel.includes('\n')) {
        setSearchQuery(sel);
      }
    }
    window.setTimeout(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    }, 10);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    textareaRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        openSearch('text');
      } else if (mod && e.key.toLowerCase() === 'g') {
        e.preventDefault();
        openSearch('line');
      } else if (e.key === 'Escape' && searchOpen) {
        e.preventDefault();
        closeSearch();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openSearch, closeSearch, searchOpen]);

  const handleScroll = () => {
    if (!textareaRef.current) return;
    const { scrollTop, scrollLeft } = textareaRef.current;
    if (backdropRef.current) {
      backdropRef.current.scrollTop = scrollTop;
      backdropRef.current.scrollLeft = scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = scrollTop;
    }
  };

  const syncSelection = () => {
    const ta = textareaRef.current;
    if (!ta) return;
    const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd).trim();
    setSelectedSnippet(sel);
  };

  const activeMatch = matches.length > 0 ? matches[Math.min(activeMatchIdx, matches.length - 1)] : null;
  const matchedLineSet = useMemo(() => new Set(matches.map((m) => m.line)), [matches]);

  return (
    <div
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden rounded-xl border shadow-inner"
      style={{
        backgroundColor: 'var(--ss-bg-panel)',
        borderColor: 'var(--ss-border-subtle)',
      }}
    >
      {/* Editor Header with Compact Search Bar between Title & Counter */}
      <div
        className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b px-3 py-1.5"
        style={{
          backgroundColor: 'var(--ss-bg-panel-alt)',
          borderColor: 'var(--ss-border-subtle)',
        }}
      >
        <span
          className="shrink-0 text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--ss-text-secondary)' }}
        >
          {architecture} Assembly Editor
        </span>

        {/* Search Input / Trigger */}
        <div className="flex min-w-0 flex-1 items-center justify-center">
          {!searchOpen ? (
            <button
              type="button"
              onClick={() => openSearch('text')}
              className="flex w-full max-w-[260px] items-center justify-between gap-2 rounded-lg border px-2.5 py-1 text-[11px] transition hover:opacity-90"
              style={{
                backgroundColor: 'var(--ss-bg-input)',
                borderColor: 'var(--ss-border-subtle)',
                color: 'var(--ss-text-muted)',
              }}
              title="Search by line (:N), opcode, label, or snippet (Ctrl+F / Ctrl+G)"
            >
              <span className="flex items-center gap-1.5 truncate">
                <Search className="h-3 w-3 shrink-0" style={{ color: 'var(--ss-accent)' }} />
                <span className="truncate">Search line, opcode, label…</span>
              </span>
              <kbd
                className="hidden rounded px-1 py-0.5 text-[9px] sm:inline"
                style={{ backgroundColor: 'var(--ss-bg-elevated)', color: 'var(--ss-text-muted)' }}
              >
                Ctrl+F
              </kbd>
            </button>
          ) : (
            <div
              className="flex w-full max-w-[340px] items-center gap-1 rounded-lg border px-1.5 py-0.5"
              style={{
                backgroundColor: 'var(--ss-bg-input)',
                borderColor: 'var(--ss-accent)',
              }}
            >
              <button
                type="button"
                onClick={() => setSearchMode((m) => (m === 'text' ? 'line' : 'text'))}
                className="shrink-0 rounded px-1 py-0.5 text-[10px] font-semibold transition"
                style={{
                  backgroundColor:
                    searchMode === 'line' ? 'var(--ss-accent-soft)' : 'transparent',
                  color:
                    searchMode === 'line' ? 'var(--ss-accent-text)' : 'var(--ss-text-muted)',
                }}
                title={
                  searchMode === 'line'
                    ? 'Line Jump Mode (click for text search)'
                    : 'Text Search Mode (click for line jump, or type :line)'
                }
              >
                {searchMode === 'line' ? <Hash className="h-3 w-3" /> : <Search className="h-3 w-3" />}
              </button>

              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setActiveMatchIdx(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (e.shiftKey) goToPrevMatch();
                    else goToNextMatch();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    closeSearch();
                  }
                }}
                placeholder={searchMode === 'line' ? 'Line # (1–' + lines.length + ')' : 'Find or :line'}
                className="min-w-0 flex-1 bg-transparent font-mono text-[11px] outline-none"
                style={{ color: 'var(--ss-text-primary)' }}
              />

              <span
                className="shrink-0 font-mono text-[10px]"
                style={{ color: 'var(--ss-text-muted)' }}
              >
                {parsedSearch.isLineJump
                  ? parsedSearch.targetLine
                    ? `L${parsedSearch.targetLine}`
                    : '—'
                  : matches.length > 0
                    ? `${activeMatchIdx + 1}/${matches.length}`
                    : searchQuery
                      ? '0/0'
                      : ''}
              </span>

              {!parsedSearch.isLineJump && (
                <>
                  <button
                    type="button"
                    onClick={goToPrevMatch}
                    disabled={matches.length === 0}
                    className="rounded p-0.5 transition hover:opacity-80 disabled:opacity-30"
                    style={{ color: 'var(--ss-text-secondary)' }}
                    title="Previous match (Shift+Enter)"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={goToNextMatch}
                    disabled={matches.length === 0}
                    className="rounded p-0.5 transition hover:opacity-80 disabled:opacity-30"
                    style={{ color: 'var(--ss-text-secondary)' }}
                    title="Next match (Enter)"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={closeSearch}
                className="rounded p-0.5 transition hover:opacity-80"
                style={{ color: 'var(--ss-text-muted)' }}
                title="Close search (Esc)"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <span className="shrink-0 font-mono text-[11px]" style={{ color: 'var(--ss-text-muted)' }}>
          {lines.length} lines ·{' '}
          {activeAsm?.success ? (
            <span style={{ color: 'var(--ss-success)' }}>{activeAsm.totalBytes} bytes</span>
          ) : (
            <span style={{ color: 'var(--ss-danger)' }}>
              {activeDiagnostics.length} errors
            </span>
          )}
        </span>
      </div>

      {/* Editor Body */}
      <div className="relative flex min-h-0 min-w-0 flex-1 overflow-hidden font-mono text-xs leading-6">
        {/* Scroll-Synced Gutter */}
        <div
          ref={gutterRef}
          className="shrink-0 select-none overflow-hidden border-r py-2 text-right"
          style={{
            backgroundColor: 'var(--ss-bg-panel-alt)',
            borderColor: 'var(--ss-border-subtle)',
          }}
        >
          {lines.map((_, idx) => {
            const lineNum = idx + 1;
            const hasBp = breakpoints.has(lineNum);
            const isActive = activePcLine === lineNum;
            const hasErr = errorByLine.has(lineNum);
            const isSearchLine =
              (parsedSearch.isLineJump && parsedSearch.targetLine === lineNum) ||
              activeMatch?.line === lineNum;
            return (
              <div
                key={lineNum}
                onClick={() => toggleBreakpoint(lineNum)}
                onMouseEnter={() => setHoveredLine(lineNum)}
                onMouseLeave={() => setHoveredLine(null)}
                className="flex h-6 cursor-pointer items-center justify-end gap-1.5 px-2 transition"
                style={{
                  backgroundColor: isActive
                    ? 'var(--ss-accent-soft)'
                    : isSearchLine
                      ? 'var(--ss-warning-soft)'
                      : hoveredLine === lineNum
                        ? 'var(--ss-bg-elevated)'
                        : 'transparent',
                  color: isActive
                    ? 'var(--ss-accent-text)'
                    : isSearchLine
                      ? 'var(--ss-warning)'
                      : hoveredLine === lineNum
                        ? 'var(--ss-text-primary)'
                        : 'var(--ss-text-muted)',
                  fontWeight: isActive || isSearchLine ? 700 : 400,
                }}
                title="Click to toggle breakpoint"
              >
                {hasBp ? (
                  <CircleDot className="h-3 w-3" style={{ color: 'var(--ss-danger)' }} />
                ) : (
                  <span className="inline-block h-3 w-3" />
                )}
                <span
                  className={hasErr ? 'underline' : ''}
                  style={hasErr ? { color: 'var(--ss-danger)' } : undefined}
                >
                  {lineNum}
                </span>
              </div>
            );
          })}
        </div>

        {/* Layered Syntax Backdrop + Transparent Textarea */}
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden">
          <div
            ref={backdropRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre py-2 pl-3 pr-4"
          >
            {lines.map((line, idx) => {
              const lineNum = idx + 1;
              const isActive = activePcLine === lineNum;
              const isHovered = hoveredLine === lineNum;
              const hasErr = errorByLine.has(lineNum);
              const isTargetLine = parsedSearch.isLineJump && parsedSearch.targetLine === lineNum;
              const isActiveMatchLine = activeMatch?.line === lineNum;
              const hasAnyMatch = matchedLineSet.has(lineNum);

              return (
                <div
                  key={lineNum}
                  className={`h-6 min-w-max rounded-sm px-1 ${
                    hasErr ? 'underline decoration-wavy' : ''
                  }`}
                  style={{
                    backgroundColor: hasErr
                      ? 'var(--ss-danger-soft)'
                      : isActive
                        ? 'var(--ss-accent-soft)'
                        : isTargetLine || isActiveMatchLine
                          ? 'var(--ss-warning-soft)'
                          : hasAnyMatch
                            ? 'var(--ss-bg-panel-alt)'
                            : isHovered
                              ? 'var(--ss-bg-panel-alt)'
                              : 'transparent',
                    boxShadow: isActive
                      ? 'inset 0 0 0 1px var(--ss-accent)'
                      : isTargetLine || isActiveMatchLine
                        ? 'inset 0 0 0 1px var(--ss-warning)'
                        : undefined,
                    textDecorationColor: hasErr ? 'var(--ss-danger)' : undefined,
                  }}
                >
                  {highlightLine(
                    line,
                    architecture,
                    searchOpen && !parsedSearch.isLineJump ? parsedSearch.text : '',
                    isActiveMatchLine
                  ) || ' '}
                </div>
              );
            })}
          </div>

          <textarea
            ref={textareaRef}
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            onScroll={handleScroll}
            onSelect={syncSelection}
            onKeyUp={syncSelection}
            onMouseUp={syncSelection}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            className="absolute inset-0 h-full w-full resize-none overflow-auto whitespace-pre bg-transparent py-2 pl-4 pr-4 font-mono text-xs leading-6 text-transparent outline-none"
            style={{ caretColor: 'var(--ss-accent)' }}
          />
        </div>
      </div>

      {/* Inline Diagnostics Footer (Clickable Line Numbers) */}
      {activeDiagnostics.length > 0 && (
        <div
          className="max-h-24 shrink-0 overflow-y-auto border-t px-3 py-1.5"
          style={{
            backgroundColor: 'var(--ss-danger-soft)',
            borderColor: 'var(--ss-danger)',
          }}
        >
          {activeDiagnostics.map((d, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToLine(d.line, true)}
              className="flex w-full items-center gap-1.5 rounded px-1 py-0.5 text-left text-[11px] transition hover:underline"
              style={{ color: 'var(--ss-danger)' }}
              title={`Jump to Line ${d.line}`}
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <span className="font-mono font-semibold">Line {d.line}:</span>
              <span className="truncate">{d.message}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};