import { env, pipeline, TextStreamer } from '@huggingface/transformers';
import { assemble } from '../core/assembler/assembler';
import { assemble8086, ISA_8086_MAP } from '../core/isa/arch8086';
import { ISA_TABLE } from '../core/isa/opcodes';
import {
  captureLiveStudioContext,
  executeStudioActions,
  type LiveStudioContext,
  type StudioAction,
} from './studioAgentBridge';

export type AssistantConnectionMode = 'offline' | 'online';

export interface AiChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  architecture: '8085' | '8086';
  timestamp: number;
  engineLabel?: string;
  executedActions?: string[];
}

export interface AiAssistantRequest {
  connectionMode: AssistantConnectionMode;
  message: string;
  history: Pick<AiChatMessage, 'role' | 'content'>[];
  includeCode: boolean;
  includeSelection: boolean;
  onToken?: (partialText: string) => void;
}

export interface AiAssistantResponse {
  reply: string;
  engineLabel: string;
  executedActions: string[];
}

export interface LocalLlmStatus {
  state: 'idle' | 'loading' | 'ready' | 'unsupported' | 'error';
  progress: number;
  text: string;
}

interface TextGenPipe {
  (
    messages: { role: string; content: string }[],
    options?: Record<string, unknown>
  ): Promise<Array<{ generated_text: Array<{ role: string; content: string }> | string }>>;
  tokenizer: unknown;
}

interface HfProgressInfo {
  status?: string;
  file?: string;
  progress?: number;
  loaded?: number;
  total?: number;
}

const ONLINE_API_URL = (import.meta.env.VITE_AI_ASSISTANT_URL as string | undefined)?.trim() ?? '';
const WASM_MODEL_ID = 'onnx-community/Qwen2.5-Coder-0.5B-Instruct';

// Fetch from Hugging Face Hub on first load and cache in browser Cache API for offline reuse
env.allowLocalModels = false;

const g = globalThis as unknown as {
  __siliconWasmPipe?: TextGenPipe | null;
  __siliconWasmInitPromise?: Promise<TextGenPipe | null> | null;
};

let currentStatus: LocalLlmStatus = g.__siliconWasmPipe
  ? { state: 'ready', progress: 100, text: 'In-Browser CPU AI Ready (0.5B WASM Offline)' }
  : { state: 'idle', progress: 0, text: 'In-browser CPU AI not started' };

const statusListeners = new Set<(status: LocalLlmStatus) => void>();

function publishStatus(next: LocalLlmStatus): void {
  currentStatus = next;
  statusListeners.forEach((fn) => fn(next));
}

export function getLocalLlmStatus(): LocalLlmStatus {
  return currentStatus;
}

export function subscribeLocalLlmStatus(fn: (status: LocalLlmStatus) => void): () => void {
  statusListeners.add(fn);
  fn(currentStatus);
  return () => {
    statusListeners.delete(fn);
  };
}

export function initInBrowserLlm(forceReload = false): Promise<TextGenPipe | null> {
  if (!forceReload && g.__siliconWasmPipe) {
    publishStatus({
      state: 'ready',
      progress: 100,
      text: 'In-Browser CPU AI Ready (0.5B WASM Offline)',
    });
    return Promise.resolve(g.__siliconWasmPipe);
  }
  if (!forceReload && g.__siliconWasmInitPromise) {
    return g.__siliconWasmInitPromise;
  }

  if (typeof WebAssembly === 'undefined') {
    publishStatus({
      state: 'unsupported',
      progress: 0,
      text: 'WebAssembly unavailable — using Built-in Copilot',
    });
    return Promise.resolve(null);
  }

  g.__siliconWasmPipe = null;
  publishStatus({
    state: 'loading',
    progress: 0,
    text: 'Loading 0.5B CPU/WASM model (no GPU)…',
  });

  const p = (
    pipeline('text-generation', WASM_MODEL_ID, {
      dtype: 'q4',
      device: 'wasm',
      progress_callback: (info: HfProgressInfo) => {
        const rawPct =
          typeof info.progress === 'number'
            ? info.progress
            : info.loaded && info.total
              ? (info.loaded / info.total) * 100
              : 0;
        const pct = Math.min(100, Math.max(0, Math.round(rawPct)));
        const fileName = info.file ? ` (${info.file.split('/').pop()})` : '';
        publishStatus({
          state: 'loading',
          progress: pct,
          text:
            info.status === 'ready'
              ? 'Initializing WASM runtime…'
              : `Downloading offline model${fileName}: ${pct}%`,
        });
      },
    }) as Promise<unknown>
  )
    .then((pipeInstance) => {
      const typedPipe = pipeInstance as TextGenPipe;
      g.__siliconWasmPipe = typedPipe;
      publishStatus({
        state: 'ready',
        progress: 100,
        text: 'In-Browser CPU AI Ready (0.5B WASM Offline)',
      });
      return typedPipe;
    })
    .catch((err) => {
      const msg = err instanceof Error ? err.message : 'Failed to load WASM model';
      publishStatus({ state: 'error', progress: 0, text: msg });
      g.__siliconWasmPipe = null;
      g.__siliconWasmInitPromise = null;
      return null;
    });

  g.__siliconWasmInitPromise = p;
  return p;
}

export function isOnlineBackendConfigured(): boolean {
  return ONLINE_API_URL.length > 0;
}

function detectDirectStudioActions(message: string): StudioAction[] {
  const q = message.toLowerCase();
  const actions: StudioAction[] = [];

  if (/\b(8086|16[- ]bit)\b/.test(q) && /\b(switch|change|go to|move)\b/.test(q)) {
    actions.push({ type: 'switch_architecture', architecture: '8086' });
  } else if (/\b(8085|8[- ]bit)\b/.test(q) && /\b(switch|change|go to|move)\b/.test(q)) {
    actions.push({ type: 'switch_architecture', architecture: '8085' });
  }

  const stepMatch = q.match(/\bstep(?:\s+forward)?(?:\s+(\d+))?\b/);
  if (q.includes('step back') || q.includes('backward')) {
    actions.push({ type: 'step_backward', count: 1 });
  } else if (stepMatch && !q.includes('step into')) {
    actions.push({ type: 'step_forward', count: stepMatch[1] ? parseInt(stepMatch[1], 10) : 1 });
  }

  if (/\brun\b/.test(q) && !/\bprogram\b/.test(q)) actions.push({ type: 'run' });
  if (/\bpause\b|\bstop\b/.test(q)) actions.push({ type: 'pause' });
  if (/\breset\b/.test(q)) actions.push({ type: 'reset' });
  if (/\bassemble\b|\bcompile\b/.test(q)) actions.push({ type: 'assemble' });

  const bpMatch = q.match(/\bbreakpoint(?:\s+at)?(?:\s+line)?\s+(\d+)\b/);
  if (bpMatch) {
    actions.push({ type: 'toggle_breakpoint', line: parseInt(bpMatch[1], 10) });
  }

  const memJump = q.match(/\b(?:jump|memory|ram|go to)\s+(?:address\s+)?([0-9a-f]{3,4})h?\b/i);
  if (memJump && /\b(memory|ram|addr)\b/.test(q)) {
    actions.push({ type: 'jump_memory', address: parseInt(memJump[1], 16) });
  }

  if (/\b(phosphor|crt)\b/.test(q)) actions.push({ type: 'set_theme', themeId: 'phosphor-crt' });
  else if (/\b(light|cleanroom)\b/.test(q)) actions.push({ type: 'set_theme', themeId: 'cleanroom-light' });
  else if (/\b(gold|wafer)\b/.test(q)) actions.push({ type: 'set_theme', themeId: 'wafer-gold' });
  else if (q.includes('silicon dark') || q.includes('dark theme')) actions.push({ type: 'set_theme', themeId: 'silicon-dark' });

  return actions;
}

function buildCompactSystemPrompt(ctx: LiveStudioContext): string {
  const rulesAndExamples =
    ctx.architecture === '8085'
      ? `INTEL 8085 RULES (STRICT):
- Use MVI r, d8 for immediate 8-bit constants (e.g. MVI A, 5AH). NEVER write MOV A, 5AH or LDA 5AH for constants (LDA is 16-bit memory load like LDA 2050H).
- Use LXI H, 2050H for 16-bit pointers; use M to access Memory[HL].
- Always initialize counters/accumulators before loops (MVI B, 00H; MVI C, 08H), use JNC/JC to skip—not exit—inside bit loops, and end with HLT.`
      : `INTEL 8086 RULES (STRICT):
- 16-bit registers: AX, BX, CX, DX, SI, DI, BP, SP. 8-bit halves: AL/AH, BL/BH, CL/CH, DL/DH.
- Use MOV AX, 0000H for immediates, MOV AX, [BX] or [1200H] for memory, LOOP label to decrement CX, and end with HLT.`;

  return `You are Silicon Copilot for ${ctx.architecture} Silicon Studio.
${rulesAndExamples}

Reply concisely in clean markdown. Put assembly code inside \`\`\`asm blocks. Never output JSON.

LIVE STATE:
- Arch: ${ctx.architecture} | Halted: ${ctx.halted} | T-States: ${ctx.timing.dynamicTStates} (${ctx.timing.elapsedMicroseconds}us)
- Registers: ${JSON.stringify(ctx.registers)}
- Flags: ${JSON.stringify(ctx.flags)}
- Last Instruction: ${ctx.microarchitecture.executedInstruction} | Cycles: ${ctx.microarchitecture.machineCycles.join('·') || 'none'}
- Bus: ${ctx.microarchitecture.busSteps.join(' -> ') || 'none'}
- Diagnostics: ${ctx.diagnostics.length ? JSON.stringify(ctx.diagnostics) : 'none'}
- Selection: ${ctx.selectedSnippet || 'none'}
- Code:
${ctx.numberedSource.split('\n').slice(0, 24).join('\n')}`;
}

function validateGeneratedAssembly(code: string, arch: '8085' | '8086'): string[] {
  const errors: string[] = [];
  if (arch === '8085') {
    const res = assemble(code, 0x2000);
    errors.push(...res.diagnostics.map((d) => `Line ${d.line}: ${d.message}`));
    // Catch classic small-LLM 8085 semantic bug: LDA 5AH (reads address 005AH instead of immediate MVI A, 5AH)
    const lines = code.split('\n');
    lines.forEach((line, idx) => {
      const clean = line.split(';')[0].trim();
      if (/^LDA\s+[0-9A-F]{1,2}H?$/i.test(clean)) {
        errors.push(`Line ${idx + 1}: "${clean}" loads from 16-bit memory address, not an 8-bit constant. Use "MVI A, ..." instead.`);
      }
    });
    return errors;
  }
  const res86 = assemble8086(code, 0x0100);
  return res86.diagnostics.map((d) => `Line ${d.line}: ${d.message}`);
}

interface OfflineProgramMatch {
  title: string;
  explanation: string;
  code: string;
}

function matchVerifiedOfflineProgram(message: string, arch: '8085' | '8086'): OfflineProgramMatch | null {
  const q = message.toLowerCase();
  const wantsProgram = /\b(write|give|create|generate|code|program|count|find|sort|add|sub|subtract|multiply|divide|fibonacci|factorial|transfer|copy)\b/.test(q);
  if (!wantsProgram) return null;

  // Extract an 8-bit hex value if mentioned (e.g. "5AH", "3CH")
  const hexByteMatch = message.match(/\b([0-9a-f]{2})h\b/i);
  const byteVal = hexByteMatch ? `${hexByteMatch[1].toUpperCase()}H` : '5AH';

  // 1. Count 1-bits / set bits using RAR / RRC
  if (/\b(1[- ]?bits?|set bits?|ones|count bits|rar|rrc)\b/.test(q) && /\b(count|1[- ]?bits?|set bits?|ones)\b/.test(q)) {
    if (arch === '8085') {
      return {
        title: `Count 1-Bits in ${byteVal} Using RAR`,
        explanation: `Loads \`${byteVal}\` into **A** with \`MVI A, ${byteVal}\`, initializes bit-count **B = 00H** and loop counter **C = 08H**, then rotates **A** right through Carry (\`RAR\`) 8 times. Whenever \`CY = 1\`, \`INR B\` increments the count; \`JNC NEXT\` skips the increment without exiting the loop.`,
        code: `; 8085: Count Number of 1-Bits in ${byteVal} Using RAR
        ORG 2000H
        MVI A, ${byteVal}      ; Load 8-bit data into Accumulator A
        MVI B, 00H      ; B = 1-bit counter (starts at 0)
        MVI C, 08H      ; C = 8 bits to inspect
LOOP:   RAR             ; Rotate A right through Carry (LSB -> CY)
        JNC NEXT        ; If CY = 0, skip incrementing B
        INR B           ; If CY = 1, increment 1-bit count
NEXT:   DCR C           ; Decrement bit counter
        JNZ LOOP        ; Repeat for all 8 bits
        MOV A, B        ; Store final 1-bit count in A (and B)
        STA 2050H       ; Save result to memory 2050H
        HLT`,
      };
    }
    return {
      title: `Count 1-Bits in ${byteVal} (8086)`,
      explanation: `Loads \`${byteVal}\` into **AL**, loops 8 times in **CX** using \`RCR AL, 1\`, and increments **BL** whenever Carry is set.`,
      code: `; 8086: Count Number of 1-Bits in ${byteVal}
        ORG 0100H
        MOV AL, ${byteVal}
        MOV BL, 00H
        MOV CX, 0008H
NEXT_B: RCR AL, 01H
        JNC SKIP_I
        INC BL
SKIP_I: LOOP NEXT_B
        MOV [1200H], BL
        HLT`,
    };
  }

  // 2. Addition
  if (/\b(add|addition|sum|plus)\b/.test(q)) {
    return arch === '8085'
      ? {
          title: 'Add Two 8-Bit Numbers with Carry',
          explanation: 'Reads two bytes from `2050H` and `2051H`, adds them in **A**, tracks carry in **C**, and stores `[sum, carry]` at `2052H–2053H`.',
          code: `; 8085: Add Two 8-Bit Numbers with Carry
        ORG 2000H
        LXI H, 2050H
        MOV A, M
        INX H
        ADD M
        MVI C, 00H
        JNC SAVE
        INR C
SAVE:   INX H
        MOV M, A
        INX H
        MOV M, C
        HLT

        ORG 2050H
        DB 35H, 4AH`,
        }
      : {
          title: 'Add Two 16-Bit Numbers (8086)',
          explanation: 'Adds two 16-bit words from `[1200H]` and `[1202H]` and stores the result at `[1204H]`.',
          code: `; 8086: Add Two 16-Bit Numbers
        ORG 0100H
        MOV AX, [1200H]
        ADD AX, [1202H]
        MOV [1204H], AX
        HLT

        ORG 1200H
        DW 1234H, 0567H`,
        };
  }

  // 3. Subtraction
  if (/\b(sub|subtract|subtraction|diff)\b/.test(q)) {
    return arch === '8085'
      ? {
          title: 'Subtract Two 8-Bit Numbers',
          explanation: 'Subtracts the byte at `2051H` from `2050H` and stores the difference at `2052H`.',
          code: `; 8085: Subtract Two 8-Bit Numbers
        ORG 2000H
        LXI H, 2050H
        MOV A, M
        INX H
        SUB M
        INX H
        MOV M, A
        HLT

        ORG 2050H
        DB 85H, 32H`,
        }
      : {
          title: 'Subtract Two 16-Bit Numbers (8086)',
          explanation: 'Subtracts `[1202H]` from `[1200H]` and stores the result at `[1204H]`.',
          code: `; 8086: Subtract Two 16-Bit Numbers
        ORG 0100H
        MOV AX, [1200H]
        SUB AX, [1202H]
        MOV [1204H], AX
        HLT

        ORG 1200H
        DW 0500H, 0125H`,
        };
  }

  // 4. Multiply
  if (/\b(multiply|multiplication|product)\b/.test(q)) {
    return arch === '8085'
      ? {
          title: 'Multiply Two 8-Bit Numbers (Repeated Addition)',
          explanation: 'Multiplies the two bytes at `2050H` and `2051H` using repeated addition with carry into **B**, storing the 16-bit product at `2052H–2053H`.',
          code: `; 8085: Multiply Two 8-Bit Numbers
        ORG 2000H
        LXI H, 2050H
        MOV C, M        ; Multiplier
        INX H
        MOV D, M        ; Multiplicand
        MVI A, 00H      ; Low byte of product
        MVI B, 00H      ; High byte of product
LOOP:   ADD D
        JNC NOCARRY
        INR B
NOCARRY: DCR C
        JNZ LOOP
        STA 2052H
        MOV A, B
        STA 2053H
        HLT

        ORG 2050H
        DB 0CH, 0AH`,
        }
      : {
          title: 'Multiply Two 16-Bit Numbers (8086)',
          explanation: 'Uses `MUL` to multiply `AX` by `BX` and stores the 32-bit result at `[1204H]` and `[1206H]`.',
          code: `; 8086: Multiply Two 16-Bit Numbers
        ORG 0100H
        MOV AX, [1200H]
        MOV BX, [1202H]
        MUL BX
        MOV [1204H], AX
        MOV [1206H], DX
        HLT

        ORG 1200H
        DW 0019H, 000CH`,
        };
  }

  // 5. Largest / Maximum
  if (/\b(largest|max|maximum|biggest)\b/.test(q)) {
    return arch === '8085'
      ? {
          title: 'Find Largest Number in Array',
          explanation: 'Scans 5 bytes starting at `2050H` using `CMP M` and stores the maximum at `2060H`.',
          code: `; 8085: Find Largest Byte in 5-Element Array
        ORG 2000H
        LXI H, 2050H
        MVI C, 04H
        MOV A, M
LOOP:   INX H
        CMP M
        JNC SKIP
        MOV A, M
SKIP:   DCR C
        JNZ LOOP
        STA 2060H
        HLT

        ORG 2050H
        DB 14H, 8AH, 32H, 9FH, 21H`,
        }
      : {
          title: 'Find Largest Word in Array (8086)',
          explanation: 'Scans 5 words from `[1200H]` and stores the largest at `[1300H]`.',
          code: `; 8086: Find Largest Word in 5-Element Array
        ORG 0100H
        MOV BX, 1200H
        MOV CX, 0004H
        MOV AX, [BX]
NEXT:   INC BX
        INC BX
        CMP AX, [BX]
        JNC KEEP
        MOV AX, [BX]
KEEP:   LOOP NEXT
        MOV [1300H], AX
        HLT

        ORG 1200H
        DW 0014H, 008AH, 0032H, 009FH, 0021H`,
        };
  }

  // 6. Fibonacci
  if (/\b(fibonacci|fib)\b/.test(q)) {
    return arch === '8085'
      ? {
          title: 'Fibonacci Series',
          explanation: 'Generates the first 8 Fibonacci bytes starting at `2050H`.',
          code: `; 8085: First 8 Fibonacci Numbers
        ORG 2000H
        LXI H, 2050H
        MVI C, 06H
        MVI A, 00H
        MOV M, A
        INX H
        MVI B, 01H
        MOV M, B
LOOP:   MOV D, B
        ADD B
        INX H
        MOV M, A
        MOV B, A
        MOV A, D
        DCR C
        JNZ LOOP
        HLT`,
        }
      : {
          title: 'Fibonacci Series (8086)',
          explanation: 'Generates the first 8 Fibonacci words starting at `[1200H]`.',
          code: `; 8086: First 8 Fibonacci Words
        ORG 0100H
        MOV BX, 1200H
        MOV AX, 0000H
        MOV DX, 0001H
        MOV CX, 0008H
FIB_LP: MOV [BX], AX
        INC BX
        INC BX
        ADD AX, DX
        XCHG AX, DX
        LOOP FIB_LP
        HLT`,
        };
  }

  // 7. Block Memory Transfer
  if (/\b(block|transfer|copy)\b/.test(q)) {
    return arch === '8085'
      ? {
          title: 'Block Memory Transfer',
          explanation: 'Copies 5 bytes from `2050H–2054H` to `2060H–2064H`.',
          code: `; 8085: Block Memory Transfer (5 Bytes)
        ORG 2000H
        LXI H, 2050H
        LXI D, 2060H
        MVI C, 05H
COPY:   MOV A, M
        STAX D
        INX H
        INX D
        DCR C
        JNZ COPY
        HLT

        ORG 2050H
        DB 11H, 22H, 33H, 44H, 55H`,
        }
      : {
          title: 'Block Memory Transfer (8086)',
          explanation: 'Copies 5 words from `[1200H]` to `[1300H]`.',
          code: `; 8086: Block Memory Transfer (5 Words)
        ORG 0100H
        MOV SI, 1200H
        MOV DI, 1300H
        MOV CX, 0005H
COPY:   MOV AX, [SI]
        MOV [DI], AX
        INC SI
        INC SI
        INC DI
        INC DI
        LOOP COPY
        HLT

        ORG 1200H
        DW 1111H, 2222H, 3333H, 4444H, 5555H`,
        };
  }

  return null;
}

function describeLine(lineText: string, arch: '8085' | '8086'): string {
  const clean = lineText.trim();
  if (!clean || clean.startsWith(';')) return `\`${clean || '(blank)'}\` — Comment or blank line`;
  const noComment = clean.split(';')[0].replace(/^[A-Za-z_][A-Za-z0-9_]*:\s*/, '').trim();
  if (!noComment) return `\`${clean}\` — Label definition`;
  const mnemonic = noComment.split(/\s+/)[0].toUpperCase();
  const rest = noComment.slice(mnemonic.length).trim();
  const ops = rest ? rest.split(',').map((o) => o.trim().toUpperCase()) : [];

  if (arch === '8085' && mnemonic in ISA_TABLE) {
    const d = ISA_TABLE[mnemonic];
    const usesM = ops.includes('M');
    let tStr = Array.isArray(d.tStates) ? `${d.tStates[0]}/${d.tStates[1]}T` : `${d.tStates}T`;
    let cycles = [...d.machineCycles];
    if (usesM && !Array.isArray(d.tStates)) {
      tStr = `${d.tStates + 3}T`;
      const isWrite = (mnemonic === 'MOV' && ops[0] === 'M') || mnemonic === 'MVI';
      cycles = [...cycles, isWrite ? 'MW' : 'MR'];
    }
    return `\`${noComment}\` — ${d.description} (${d.bytes}B, ${tStr}, [${cycles.join('·')}])`;
  }
  if (arch === '8086' && mnemonic in ISA_8086_MAP) {
    const d = ISA_8086_MAP[mnemonic];
    return `\`${noComment}\` — ${d.description} (${d.category})`;
  }
  return `\`${noComment}\` — Assembler directive or symbol`;
}

function runBuiltInSmartFallback(message: string, ctx: LiveStudioContext): { reply: string; actions: StudioAction[] } {
  const q = message.toLowerCase();
  const actions: StudioAction[] = [];
  const notes: string[] = [];

  if (/\b(register|registers|reg|pc|ip|sp)\b/.test(q)) {
    const regSummary = Object.entries(ctx.registers)
      .map(([k, v]) => `**${k}**: \`${v}\``)
      .join(' · ');
    notes.push(`**Live ${ctx.architecture} Registers:**\n${regSummary}`);
  }

  if (/\b(flag|flags|psw)\b/.test(q)) {
    const flagSummary = Object.entries(ctx.flags)
      .map(([k, v]) => `**${k}**=\`${v}\``)
      .join(' · ');
    notes.push(`**Live ${ctx.architecture} Flags:**\n${flagSummary}`);
  }

  if (/\b(carry|cy)\b/.test(q) && /\b(explain|what|analogy|beginner|mean|does)\b/.test(q)) {
    notes.push(
      `**Carry Flag (CY) — Simple Analogy:**\nThink of **CY** as a 1-bit "overflow pocket" next to the Accumulator (**A**). When \`RAR\` shifts all 8 bits of **A** right by one spot, the rightmost bit (Bit 0) falls out into the **CY** pocket, and the old **CY** bit enters Bit 7. That lets \`JNC\` / \`JC\` inspect each bit one by one!`
    );
  }

  if (/\b(microarch|microarchitecture|bus|cycle|cycles|t-state|t1|timing)\b/.test(q)) {
    notes.push(
      `**Microarchitecture & Cycle Telemetry (${ctx.architecture}):**\n• Last Executed: \`${ctx.microarchitecture.executedInstruction}\`\n• Bus Steps: ${ctx.microarchitecture.busSteps.join(' → ') || 'None yet (step an instruction)'}\n• Cycles: \`${ctx.microarchitecture.machineCycles.join('·') || '—'}\` (+${ctx.microarchitecture.tStatesDelta}T, Total: ${ctx.timing.dynamicTStates}T / ${ctx.timing.elapsedMicroseconds}µs)`
    );
  }

  if (/\b(memory|ram|hex)\b/.test(q)) {
    const nonZero = ctx.memoryWindow.nonZeroBytes
      .slice(0, 16)
      .map((b) => `\`${b.addr}:${b.hex}\``)
      .join(' ');
    notes.push(
      `**Memory Window (${ctx.memoryWindow.baseAddress}):**\n${nonZero || 'All bytes in this 256B page are 00H.'}`
    );
  }

  const lineAsk = q.match(/\bline\s+(\d+)\b/);
  if (lineAsk && !/\bbreakpoint\b/.test(q)) {
    const lineNo = parseInt(lineAsk[1], 10);
    const lines = ctx.numberedSource.split('\n');
    const target = lines[lineNo - 1]?.replace(/^\s*\d+:\s*/, '') ?? '';
    notes.push(`**Line ${lineNo}:**\n• ${describeLine(target, ctx.architecture)}`);
  }

  const verifiedMatch = matchVerifiedOfflineProgram(message, ctx.architecture);
  if (verifiedMatch) {
    notes.push(`**${verifiedMatch.title}:**\n${verifiedMatch.explanation}\n\n\`\`\`asm\n${verifiedMatch.code}\n\`\`\``);
    if (/\b(load|paste|put|replace|insert|edit)\b/.test(q)) {
      actions.push({ type: 'replace_code', code: verifiedMatch.code });
    }
  }

  if (notes.length === 0) {
    notes.push(
      `**Built-in Copilot (${ctx.architecture})** — CPU/WASM model is currently \`${currentStatus.state}\` (${currentStatus.progress}%). Ask about registers, flags, memory, bus cycles, or any standard 8085/8086 program while it finishes loading.`
    );
  }

  return { reply: notes.join('\n\n'), actions };
}

async function streamWasmCompletion(
  pipeInstance: TextGenPipe,
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  onToken?: (partialText: string) => void
): Promise<string> {
  let streamed = '';
  const streamer = new TextStreamer(pipeInstance.tokenizer as never, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function: (chunkText: string) => {
      streamed += chunkText;
      onToken?.(streamed);
    },
  });

  const outputs = await pipeInstance(messages, {
    max_new_tokens: 384,
    do_sample: false,
    repetition_penalty: 1.15,
    streamer,
  });

  if (streamed.trim()) return streamed.trim();
  const gen = outputs?.[0]?.generated_text;
  if (Array.isArray(gen) && gen.length > 0) {
    return String(gen[gen.length - 1]?.content ?? '').trim();
  }
  return typeof gen === 'string' ? gen.trim() : '';
}

export async function askStudioCopilot(req: AiAssistantRequest): Promise<AiAssistantResponse> {
  const preActions = detectDirectStudioActions(req.message);
  const preExecuted = executeStudioActions(preActions);

  const ctx = captureLiveStudioContext();
  if (!req.includeCode) ctx.numberedSource = '(Hidden by user)';
  if (!req.includeSelection) ctx.selectedSnippet = '';

  const systemPrompt = buildCompactSystemPrompt(ctx);

  if (req.connectionMode === 'offline') {
    // 1. Fast-path: 100% logic- & assembler-verified classic 8085/8086 programs
    const verifiedMatch = matchVerifiedOfflineProgram(req.message, ctx.architecture);
    if (verifiedMatch) {
      const errs = validateGeneratedAssembly(verifiedMatch.code, ctx.architecture);
      if (errs.length === 0) {
        const executed = [...preExecuted, 'Assembler Verified (0 errors)'];
        if (/\b(load|paste|put|replace|insert|edit)\b/i.test(req.message)) {
          executed.push(...executeStudioActions([{ type: 'replace_code', code: verifiedMatch.code }]));
        }
        const reply = `**${verifiedMatch.title}**\n\n${verifiedMatch.explanation}\n\n\`\`\`asm\n${verifiedMatch.code}\n\`\`\``;
        req.onToken?.(reply);
        return {
          reply,
          engineLabel: 'Offline Verified Solver (0 Errors)',
          executedActions: executed,
        };
      }
    }

    // 2. General / custom queries via CPU/WASM 0.5B LLM (no WebGPU / no D3D12)
    let wasmError = '';
    const pipeInstance = g.__siliconWasmPipe ?? null;

    if (pipeInstance) {
      try {
        const baseMsgs: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
          { role: 'system', content: systemPrompt },
          ...req.history.slice(-4).map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user', content: req.message },
        ];

        let reply = await streamWasmCompletion(pipeInstance, baseMsgs, req.onToken);
        const executed = [...preExecuted];

        const codeMatch = reply.match(/```(?:asm|8085|8086)?\n([\s\S]*?)```/i);
        if (codeMatch?.[1]?.trim()) {
          let generatedCode = codeMatch[1].trim();
          let errors = validateGeneratedAssembly(generatedCode, ctx.architecture);

          if (errors.length > 0) {
            const fixPrompt = `Your ${ctx.architecture} assembly code has errors:\n${errors.join('\n')}\nFix the code and reply with the corrected \`\`\`asm block only.`;
            const repaired = await streamWasmCompletion(
              pipeInstance,
              [...baseMsgs, { role: 'assistant', content: reply }, { role: 'user', content: fixPrompt }],
              req.onToken
            );
            const repairedMatch = repaired.match(/```(?:asm|8085|8086)?\n([\s\S]*?)```/i);
            if (repairedMatch?.[1]?.trim()) {
              generatedCode = repairedMatch[1].trim();
              errors = validateGeneratedAssembly(generatedCode, ctx.architecture);
              reply = repaired;
            }
          }

          if (errors.length === 0) {
            executed.push('Assembler Verified (0 errors)');
            if (/\b(load|paste|put|replace|insert)\b/i.test(req.message)) {
              executed.push(...executeStudioActions([{ type: 'replace_code', code: generatedCode }]));
            }
          } else {
            reply += `\n\n**Assembler Check:** ${errors.join('; ')}`;
          }
        }

        return {
          reply: reply || 'Done.',
          engineLabel: 'In-Browser CPU AI (0.5B WASM Offline)',
          executedActions: executed,
        };
      } catch (err) {
        wasmError = err instanceof Error ? err.message : String(err);
        console.error('[WASM LLM inference error]', err);
      }
    }

    // 3. Instant fallback while WASM model downloads or if unavailable
    const fb = runBuiltInSmartFallback(req.message, ctx);
    const executed = [...preExecuted, ...executeStudioActions(fb.actions)];
    return {
      reply: fb.reply,
      engineLabel: wasmError
        ? `Built-in Copilot (WASM err: ${wasmError})`
        : currentStatus.state === 'loading'
          ? `Built-in Copilot (WASM ${currentStatus.progress}%)`
          : 'Offline Built-in Copilot',
      executedActions: executed,
    };
  }

  // Online Mode
  if (!isOnlineBackendConfigured()) {
    const fb = runBuiltInSmartFallback(req.message, ctx);
    const executed = [...preExecuted, ...executeStudioActions(fb.actions)];
    return {
      reply: `**Online Backend Not Configured** — Set \`VITE_AI_ASSISTANT_URL\` in \`.env\` to connect Gemini + Web Search.\n\n${fb.reply}`,
      engineLabel: 'Online (Unconfigured → Local)',
      executedActions: executed,
    };
  }

  try {
    const res = await fetch(ONLINE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: req.message,
        history: req.history,
        studioContext: ctx,
        systemPrompt,
      }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as { reply?: string; actions?: StudioAction[] };
    const executed = [...preExecuted, ...(data.actions ? executeStudioActions(data.actions) : [])];
    return {
      reply: data.reply || 'Done.',
      engineLabel: 'Online Gemini + Search',
      executedActions: executed,
    };
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'Network error';
    const fb = runBuiltInSmartFallback(req.message, ctx);
    const executed = [...preExecuted, ...executeStudioActions(fb.actions)];
    return {
      reply: `Online backend unreachable (${reason}).\n\n${fb.reply}`,
      engineLabel: 'Online Fallback',
      executedActions: executed,
    };
  }
}