import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  Globe,
  HardDrive,
  Maximize2,
  Minimize2,
  Send,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import {
  type AiChatMessage,
  askStudioCopilot,
  type AssistantConnectionMode,
  getLocalLlmStatus,
  initInBrowserLlm,
  type LocalLlmStatus,
  subscribeLocalLlmStatus,
} from '../../services/aiAssistantService';
import { useSimulatorStore } from '../../store/useSimulatorStore';

function formatInlineMarkdown(text: string): React.ReactNode {
  const tokens = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g);
  return tokens.map((tok, i) => {
    if (tok.startsWith('**') && tok.endsWith('**') && tok.length > 4) {
      return (
        <strong key={i} className="font-semibold" style={{ color: 'var(--ss-text-primary)' }}>
          {tok.slice(2, -2)}
        </strong>
      );
    }
    if (tok.startsWith('`') && tok.endsWith('`') && tok.length > 2) {
      return (
        <code
          key={i}
          className="rounded px-1 py-0.5 font-mono text-[11px]"
          style={{
            backgroundColor: 'var(--ss-bg-elevated)',
            color: 'var(--ss-accent-text)',
          }}
        >
          {tok.slice(1, -1)}
        </code>
      );
    }
    if (tok.startsWith('*') && tok.endsWith('*') && tok.length > 2) {
      return (
        <em key={i} className="italic">
          {tok.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={i}>{tok}</React.Fragment>;
  });
}

const CodeBlockWithActions: React.FC<{
  code: string;
  onInsert: (code: string) => void;
}> = ({ code, onInsert }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard?.writeText(code);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      className="my-2 overflow-hidden rounded-lg border"
      style={{
        backgroundColor: 'var(--ss-bg-svg)',
        borderColor: 'var(--ss-border-strong)',
      }}
    >
      <div
        className="flex items-center justify-between border-b px-2.5 py-1 text-[10px]"
        style={{
          backgroundColor: 'var(--ss-bg-panel-alt)',
          borderColor: 'var(--ss-border-subtle)',
        }}
      >
        <span className="font-mono font-semibold" style={{ color: 'var(--ss-text-muted)' }}>
          ASSEMBLY
        </span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 rounded px-1.5 py-0.5 transition hover:opacity-80"
            style={{ color: 'var(--ss-text-secondary)' }}
          >
            {copied ? <Check className="h-3 w-3" style={{ color: 'var(--ss-success)' }} /> : <Copy className="h-3 w-3" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={() => onInsert(code)}
            className="rounded border px-1.5 py-0.5 font-semibold transition hover:opacity-90"
            style={{
              backgroundColor: 'var(--ss-accent-soft)',
              borderColor: 'var(--ss-accent)',
              color: 'var(--ss-accent-text)',
            }}
            title="Load this code into the editor"
          >
            Load in Editor
          </button>
        </div>
      </div>
      <pre className="overflow-x-auto p-2.5 font-mono text-[11px] leading-5" style={{ color: 'var(--ss-text-primary)' }}>
        {code}
      </pre>
    </div>
  );
};

function renderMessageBody(
  content: string,
  onInsertCode: (code: string) => void
): React.ReactNode {
  const blocks = content.split(/```(?:asm|8085|8086)?\n([\s\S]*?)```/g);
  return blocks.map((part, idx) => {
    if (idx % 2 === 1) {
      return <CodeBlockWithActions key={idx} code={part.trim()} onInsert={onInsertCode} />;
    }
    return (
      <span key={idx} className="whitespace-pre-wrap">
        {formatInlineMarkdown(part)}
      </span>
    );
  });
}

export const FloatingAiAssistant: React.FC = () => {
  const {
    architecture,
    setSourceCode,
    assembleCode,
    selectedSnippet,
  } = useSimulatorStore();

  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [connectionMode, setConnectionMode] = useState<AssistantConnectionMode>('offline');
  const [llmStatus, setLlmStatus] = useState<LocalLlmStatus>(getLocalLlmStatus());
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [includeCode, setIncludeCode] = useState(true);
  const [includeSelection, setIncludeSelection] = useState(true);
  const [messages, setMessages] = useState<AiChatMessage[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeLocalLlmStatus(setLlmStatus);
    void initInBrowserLlm();
    return unsub;
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streamingText, isLoading, isOpen]);

  const handleLoadInEditor = (code: string) => {
    setSourceCode(code);
    window.setTimeout(() => assembleCode(), 20);
  };

  const sendMessage = async (textOverride?: string) => {
    const prompt = (textOverride ?? input).trim();
    if (!prompt || isLoading) return;

    const userMsg: AiChatMessage = {
      id: `${Date.now()}-u`,
      role: 'user',
      content: prompt,
      architecture,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textOverride) setInput('');
    setIsLoading(true);
    setStreamingText('');

    const response = await askStudioCopilot({
      connectionMode,
      message: prompt,
      history: messages.slice(-8).map((m) => ({ role: m.role, content: m.content })),
      includeCode,
      includeSelection,
      onToken: (partial) => setStreamingText(partial),
    });

    const latestArch = useSimulatorStore.getState().architecture;
    const assistantMsg: AiChatMessage = {
      id: `${Date.now()}-a`,
      role: 'assistant',
      content: response.reply,
      architecture: latestArch,
      timestamp: Date.now(),
      engineLabel: response.engineLabel,
      executedActions: response.executedActions,
    };

    setMessages((prev) => [...prev, assistantMsg]);
    setStreamingText('');
    setIsLoading(false);
  };

  const quickPrompts = [
    'Switch to 8086 and step 2',
    'Show live registers and flags',
    'Explain microarchitecture & cycles',
    'Write a program to add two numbers',
  ];

  return (
    <div className="fixed right-4 bottom-4 z-40 flex flex-col items-end gap-2">
      {isOpen && (
        <div
          className={`flex flex-col overflow-hidden rounded-2xl border shadow-2xl transition-all duration-200 ${
            isExpanded
              ? 'h-[80vh] w-[calc(100vw-2rem)] sm:w-[560px]'
              : 'h-[520px] max-h-[78vh] w-[calc(100vw-2rem)] sm:w-[415px]'
          }`}
          style={{
            backgroundColor: 'var(--ss-bg-elevated)',
            borderColor: 'var(--ss-border-strong)',
            color: 'var(--ss-text-primary)',
          }}
        >
          {/* Panel Header */}
          <div
            className="flex shrink-0 items-center justify-between gap-2 border-b px-3.5 py-2.5"
            style={{
              backgroundColor: 'var(--ss-bg-panel)',
              borderColor: 'var(--ss-border-subtle)',
            }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border"
                style={{
                  backgroundColor: 'var(--ss-accent-soft)',
                  borderColor: 'var(--ss-accent)',
                  color: 'var(--ss-accent)',
                }}
              >
                <Bot className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-xs font-bold">Silicon Copilot</span>
                  <span
                    className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold"
                    style={{
                      backgroundColor: 'var(--ss-accent-soft)',
                      color: 'var(--ss-accent-text)',
                    }}
                  >
                    {architecture}
                  </span>
                </div>
              </div>
            </div>

            {/* Offline / Online Mode Switch */}
            <div
              className="flex shrink-0 items-center rounded-lg border p-0.5 text-[10px] font-semibold"
              style={{
                backgroundColor: 'var(--ss-bg-input)',
                borderColor: 'var(--ss-border-strong)',
              }}
            >
              <button
                type="button"
                onClick={() => setConnectionMode('offline')}
                className="flex items-center gap-1 rounded-md px-2 py-0.5 transition"
                style={{
                  backgroundColor: connectionMode === 'offline' ? 'var(--ss-accent-soft)' : 'transparent',
                  color: connectionMode === 'offline' ? 'var(--ss-accent-text)' : 'var(--ss-text-muted)',
                }}
                title="Use In-Browser WebGPU LLM"
              >
                <HardDrive className="h-3 w-3" />
                Offline
              </button>
              <button
                type="button"
                onClick={() => setConnectionMode('online')}
                className="flex items-center gap-1 rounded-md px-2 py-0.5 transition"
                style={{
                  backgroundColor: connectionMode === 'online' ? 'var(--ss-success-soft)' : 'transparent',
                  color: connectionMode === 'online' ? 'var(--ss-success)' : 'var(--ss-text-muted)',
                }}
                title="Use live Gemini + Web Search backend"
              >
                <Globe className="h-3 w-3" />
                Online
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setMessages([])}
                disabled={messages.length === 0}
                className="rounded-md p-1 transition hover:opacity-80 disabled:opacity-30"
                style={{ color: 'var(--ss-text-muted)' }}
                title="Clear chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded((v) => !v)}
                className="hidden rounded-md p-1 transition hover:opacity-80 sm:block"
                style={{ color: 'var(--ss-text-muted)' }}
                title={isExpanded ? 'Collapse panel' : 'Expand panel'}
              >
                {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-md p-1 transition hover:opacity-80"
                style={{ color: 'var(--ss-text-muted)' }}
                title="Minimize assistant"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* In-Browser Model Loading / Ready Strip */}
          {connectionMode === 'offline' && (
            <div
              className="shrink-0 border-b px-3 py-1.5"
              style={{
                backgroundColor: 'var(--ss-bg-svg)',
                borderColor: 'var(--ss-border-subtle)',
              }}
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="truncate font-medium" style={{ color: 'var(--ss-text-secondary)' }}>
                  {llmStatus.state === 'ready'
                    ? 'In-Browser AI Ready (100% Offline)'
                    : llmStatus.state === 'loading'
                      ? `Loading In-Browser AI (${llmStatus.progress}%)`
                      : llmStatus.text}
                </span>
                {llmStatus.state === 'ready' && (
                  <span className="font-mono text-[9px]" style={{ color: 'var(--ss-success)' }}>
                    WebGPU
                  </span>
                )}
              </div>
              {llmStatus.state === 'loading' && (
                <div
                  className="mt-1 h-1 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: 'var(--ss-bg-elevated)' }}
                >
                  <div
                    className="h-full transition-all duration-200"
                    style={{
                      width: `${llmStatus.progress}%`,
                      backgroundColor: 'var(--ss-accent)',
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Context Attachment Bar */}
          <div
            className="flex shrink-0 flex-wrap items-center justify-between gap-1.5 border-b px-3 py-1.5 text-[10px]"
            style={{
              backgroundColor: 'var(--ss-bg-panel-alt)',
              borderColor: 'var(--ss-border-subtle)',
            }}
          >
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIncludeCode((v) => !v)}
                className="flex items-center gap-1 rounded border px-2 py-0.5 font-medium transition"
                style={{
                  backgroundColor: includeCode ? 'var(--ss-accent-soft)' : 'var(--ss-bg-input)',
                  borderColor: includeCode ? 'var(--ss-accent)' : 'var(--ss-border-subtle)',
                  color: includeCode ? 'var(--ss-accent-text)' : 'var(--ss-text-muted)',
                }}
              >
                <Code2 className="h-3 w-3" />
                Editor + Live Telemetry
              </button>

              <button
                type="button"
                onClick={() => setIncludeSelection((v) => !v)}
                disabled={!selectedSnippet}
                className="flex items-center gap-1 rounded border px-2 py-0.5 font-medium transition disabled:opacity-40"
                style={{
                  backgroundColor:
                    includeSelection && selectedSnippet ? 'var(--ss-warning-soft)' : 'var(--ss-bg-input)',
                  borderColor:
                    includeSelection && selectedSnippet ? 'var(--ss-warning)' : 'var(--ss-border-subtle)',
                  color:
                    includeSelection && selectedSnippet ? 'var(--ss-warning)' : 'var(--ss-text-muted)',
                }}
                title={selectedSnippet ? 'Attach highlighted editor snippet' : 'Highlight code in editor to attach'}
              >
                <Sparkles className="h-3 w-3" />
                Selection {selectedSnippet ? `(${selectedSnippet.length}c)` : ''}
              </button>
            </div>

            <span className="font-mono text-[9px]" style={{ color: 'var(--ss-text-muted)' }}>
              {connectionMode === 'offline' ? 'In-Browser AI' : 'Cloud API'}
            </span>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="min-h-0 flex-1 space-y-2.5 overflow-y-auto p-3">
            {messages.length === 0 ? (
              <div className="space-y-3 py-2">
                <p className="text-xs leading-relaxed" style={{ color: 'var(--ss-text-secondary)' }}>
                  I can inspect live <strong>{architecture}</strong> registers, PSW/flags, bus cycles, memory, and control the studio hands-free (switch 8085 ↔ 8086, step, run, reset, edit code, or switch themes).
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {quickPrompts.map((qp) => (
                    <button
                      key={qp}
                      type="button"
                      onClick={() => void sendMessage(qp)}
                      className="rounded-lg border px-2.5 py-1 text-left text-[11px] font-medium transition hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--ss-bg-panel-alt)',
                        borderColor: 'var(--ss-border-strong)',
                        color: 'var(--ss-accent-text)',
                      }}
                    >
                      {qp}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className="max-w-[90%] rounded-xl border px-3 py-2 text-xs leading-relaxed"
                      style={{
                        backgroundColor: isUser ? 'var(--ss-accent-soft)' : 'var(--ss-bg-panel)',
                        borderColor: isUser ? 'var(--ss-accent)' : 'var(--ss-border-subtle)',
                        color: isUser ? 'var(--ss-accent-text)' : 'var(--ss-text-secondary)',
                      }}
                    >
                      {renderMessageBody(msg.content, handleLoadInEditor)}

                      {msg.executedActions && msg.executedActions.length > 0 && (
                        <div
                          className="mt-2 flex flex-wrap gap-1 border-t pt-1.5"
                          style={{ borderColor: 'var(--ss-border-subtle)' }}
                        >
                          {msg.executedActions.map((act, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
                              style={{
                                backgroundColor: 'var(--ss-success-soft)',
                                color: 'var(--ss-success)',
                              }}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {act}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.engineLabel && (
                      <span className="mt-0.5 px-1 font-mono text-[9px]" style={{ color: 'var(--ss-text-muted)' }}>
                        {msg.engineLabel}
                      </span>
                    )}
                  </div>
                );
              })
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div
                  className="max-w-[90%] rounded-xl border px-3 py-2 text-xs leading-relaxed"
                  style={{
                    backgroundColor: 'var(--ss-bg-panel)',
                    borderColor: 'var(--ss-border-subtle)',
                    color: streamingText ? 'var(--ss-text-secondary)' : 'var(--ss-text-muted)',
                  }}
                >
                  {streamingText
                    ? renderMessageBody(streamingText, handleLoadInEditor)
                    : `Analyzing ${architecture} studio state…`}
                </div>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void sendMessage();
            }}
            className="flex shrink-0 items-center gap-2 border-t p-2.5"
            style={{
              backgroundColor: 'var(--ss-bg-panel)',
              borderColor: 'var(--ss-border-subtle)',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Command or ask Copilot (${connectionMode})...`}
              className="min-w-0 flex-1 rounded-lg border px-2.5 py-1.5 text-xs outline-none"
              style={{
                backgroundColor: 'var(--ss-bg-input)',
                borderColor: 'var(--ss-border-strong)',
                color: 'var(--ss-text-primary)',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition hover:opacity-90 disabled:opacity-40"
              style={{
                backgroundColor: 'var(--ss-accent-soft)',
                borderColor: 'var(--ss-accent)',
                color: 'var(--ss-accent-text)',
              }}
              aria-label="Send message"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border px-3.5 py-2.5 text-xs font-bold shadow-lg transition-transform hover:scale-105"
        style={{
          backgroundColor: 'var(--ss-bg-elevated)',
          borderColor: 'var(--ss-accent)',
          color: 'var(--ss-accent-text)',
          boxShadow: '0 0 20px var(--ss-accent-glow)',
        }}
        title="Open Silicon Copilot"
      >
        <Bot className="h-4 w-4" style={{ color: 'var(--ss-accent)' }} />
        <span>
          {llmStatus.state === 'loading' ? `AI (${llmStatus.progress}%)` : 'AI Copilot'}
        </span>
        <span
          className="rounded-full px-1.5 py-0.5 font-mono text-[9px]"
          style={{ backgroundColor: 'var(--ss-accent-soft)', color: 'var(--ss-accent)' }}
        >
          {architecture}
        </span>
      </button>
    </div>
  );
};