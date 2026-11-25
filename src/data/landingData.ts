export type ArchitectureId = '8085' | '8086';

export interface ArchHistoryData {
  id: ArchitectureId;
  name: string;
  tagline: string;
  released: string;
  projectStarted: string;
  architects: string;
  transistors: string;
  processNode: string;
  clockRange: string;
  busAndMemory: string;
  imageUrl: string;
  secondaryImageUrl?: string;
  imageCaption: string;
  wikiUrl: string;
  overview: string;
  breakthroughs: string[];
  timeline: { year: string; event: string }[];
  assemblyHistory: string;
  sampleTitle: string;
  sampleCode: string;
  sampleNotes: string[];
}

export const ARCH_HISTORIES: Record<ArchitectureId, ArchHistoryData> = {
  '8085': {
    id: '8085',
    name: 'Intel 8085',
    tagline: '8-Bit Single-Supply Microprocessor (1976)',
    released: 'March 1976',
    projectStarted: '1975–1976 (Enhancement of Intel 8080)',
    architects: 'Intel Microprocessor Engineering Team (8080-compatible lineage)',
    transistors: '~6,500 transistors (NMOS / HMOS)',
    processNode: '3 µm NMOS / HMOS · 40-pin DIP',
    clockRange: '3 MHz – 6 MHz (8085A / 8085AH-1)',
    busAndMemory: '8-bit Data Bus · 16-bit Address Bus (64 KB)',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/KL_Intel_P8085AH.jpg/250px-KL_Intel_P8085AH.jpg',
    imageCaption: 'Intel P8085AH 40-pin DIP microprocessor package',
    wikiUrl: 'https://en.wikipedia.org/wiki/Intel_8085',
    overview:
      'Introduced by Intel in March 1976, the 8085 ("eighty-eighty-five") was designed as a binary-compatible, lower-cost, easier-to-build successor to the Intel 8080. The "5" in 8085 highlighted its biggest hardware breakthrough: running on a single +5V power supply instead of the three separate voltages (+5V, -5V, +12V) required by the 8080.',
    breakthroughs: [
      'Single +5V power supply and on-chip clock oscillator eliminated multiple external support chips.',
      'Multiplexed lower 8-bit address/data bus (AD0–AD7) freed pins on the 40-pin DIP for hardware interrupts (TRAP, RST 7.5, 6.5, 5.5) and serial I/O (SID/SOD).',
      'Binary-compatible with the 8080 instruction set (74 instructions, 246 opcodes), adding RIM and SIM for interrupt masking and serial lines.',
      'Became the foundational teaching microprocessor in engineering labs worldwide and powered industrial controllers like DECtape II and VT102.',
    ],
    timeline: [
      { year: '1974', event: 'Intel 8080 launches, requiring +5V, -5V, and +12V rails plus external clock/controller ICs.' },
      { year: 'Mar 1976', event: 'Intel introduces the 8085 with single +5V supply, internal clock, and multiplexed AD0–AD7 bus.' },
      { year: 'Late 1970s', event: '8085A and HMOS 8085AH variants scale from 3 MHz up to 5–6 MHz for embedded systems.' },
      { year: '1980s–Present', event: 'Remains the gold-standard architecture for teaching fetch-decode-execute cycles and T-state timing.' },
    ],
    assemblyHistory:
      'In the late 1970s, 8085 programmers often hand-assembled mnemonics into hexadecimal opcodes on paper coding sheets and keyed them byte-by-byte into trainer kits (like the SDK-85) using a hex keypad and 7-segment LEDs. Every instruction was centered around the 8-bit Accumulator (A) and three 8-bit register pairs (BC, DE, HL), where HL acted as the primary 16-bit memory pointer (M).',
    sampleTitle: 'Classic 8085 Hex-Count Loop (RAR Bit Counter)',
    sampleCode: `        ORG 2000H
        MVI A, 5AH      ; Load 8-bit constant 5AH into Accumulator
        MVI B, 00H      ; Clear 1-bit counter B
        MVI C, 08H      ; Inspect all 8 bits
LOOP:   RAR             ; Rotate A right through Carry (LSB -> CY)
        JNC NEXT        ; Skip increment if CY = 0
        INR B           ; Increment count if CY = 1
NEXT:   DCR C           ; Decrement bit counter
        JNZ LOOP        ; Loop until C = 0
        HLT`,
    sampleNotes: [
      'MVI loads an immediate 8-bit byte; LDA loads from a 16-bit memory address.',
      'Each instruction executes in explicit Machine Cycles (OF = 4T, MR = 3T, MW = 3T).',
    ],
  },
  '8086': {
    id: '8086',
    name: 'Intel 8086',
    tagline: '16-Bit Origin of the x86 Architecture (1978)',
    released: 'June 8, 1978',
    projectStarted: 'May 1976 (2-year development)',
    architects: 'Stephen P. Morse (Lead Architect), Bruce Ravenel, Jim McKevitt, John Bayliss',
    transistors: '29,277 transistors (~29,000)',
    processNode: '3 µm / 3.2 µm HMOS · 33 mm² die · 40-pin DIP',
    clockRange: '5 MHz – 10 MHz',
    busAndMemory: '16-bit Data Bus · 20-bit Address Bus (1 MB Segmented)',
    imageUrl:
      'https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a2/Intel_C8086.jpg/250px-Intel_C8086.jpg',
    secondaryImageUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a8/Intel_8086_CPU_Die.JPG',
    imageCaption: 'Intel C8086 ceramic 40-pin DIP & silicon die',
    wikiUrl: 'https://en.wikipedia.org/wiki/Intel_8086',
    overview:
      'Started in May 1976 as a fast-turnaround 16-bit project while Intel developed the ambitious iAPX 432, the Intel 8086 launched on June 8, 1978 and established the x86 instruction set architecture that still powers modern desktops, laptops, and servers today.',
    breakthroughs: [
      'Split CPU into two independent units: the Bus Interface Unit (BIU) with a 6-byte prefetch queue and the Execution Unit (EU), enabling early instruction pipelining.',
      'Expanded addressing from 64 KB to 1 MB using a 20-bit physical address formed from 16-bit Segment × 16 + Offset (CS, DS, SS, ES).',
      'Added hardware/microcode 16-bit multiply/divide, signed arithmetic, string/loop primitives, and high-level language stack support.',
      'Source-level assembly compatibility with 8080/8085 allowed rapid migration of existing software ecosystems.',
    ],
    timeline: [
      { year: 'May 1976', event: 'Stephen P. Morse begins designing the 8086 ISA in just 3 months as Intel’s 16-bit flagship.' },
      { year: 'Jun 8, 1978', event: 'Intel releases the 8086 (29,277 transistors, 5 MHz), launching the x86 family.' },
      { year: '1979', event: 'Intel releases the 8088 (8-bit external bus), chosen by IBM for the original IBM PC.' },
      { year: '1980s–Present', event: '8086 ISA evolves through 286, 386, Pentium, and x86-64—maintaining backward compatibility.' },
    ],
    assemblyHistory:
      'Assembly on the 8086 shifted from single-accumulator coding to general-purpose 16-bit registers (AX, BX, CX, DX) that could also be addressed as 8-bit halves (AL/AH). Programmers used segment:offset pointers ([BX], [SI], [DI]), built-in LOOP counters with CX, and structured procedures with SS:SP stacks.',
    sampleTitle: 'Classic 8086 Array Sum Using CX Loop',
    sampleCode: `        ORG 0100H
        MOV BX, 1200H   ; Base address of word array
        MOV CX, 0004H   ; 4 elements to sum
        MOV AX, 0000H   ; Clear 16-bit accumulator
SUM_LP: ADD AX, [BX]    ; Add 16-bit word at [BX]
        INC BX          ; Advance by 2 bytes (1 word)
        INC BX
        LOOP SUM_LP     ; Decrement CX and loop if CX != 0
        MOV [1300H], AX ; Store final sum
        HLT`,
    sampleNotes: [
      'BIU prefetches upcoming instruction bytes while EU executes current ALU operations.',
      'Physical address = (Segment Register << 4) + Effective Offset.',
    ],
  },
};

export interface TeamMemberProfile {
  id: string;
  name: string;
  initials: string;
  role: string;
  summary: string;
  modules: string[];
  contributions: string[];
  techFocus: string[];
}

export const TEAM_MEMBERS: TeamMemberProfile[] = [
  {
    id: 'manikant-giri',
    name: 'Manikant Giri',
    initials: 'MG',
    role: 'Lead Architect (Member 4) · CPU Control Unit, Timing, Interrupts & Full System Architecture',
    summary:
      'Architected and built the complete simulator end-to-end—authoring the CPU control unit, cycle-accurate timing engine, interrupt controller, project directory structure, TypeScript/Tailwind/Vite configuration, UI/UX microarchitecture visualizer, state store, and automated test suite.',
    modules: [
      'src/core/emulator/cpu.ts',
      'src/core/emulator/history.ts',
      'src/core/isa/busPaths.ts',
      'src/store/useSimulatorStore.ts',
      'src/tests/cpu.test.ts',
      'vite.config.ts',
    ],
    contributions: [
      'Instruction Fetch–Decode–Execute & Branching Control: Built the central Cpu8085.step() execution engine in cpu.ts managing PC sequencing, JMP/JNC/JZ branching, subroutine calls, and HLT states.',
      'Machine Cycles & T-State Timing Engine: Modeled exact 8085 machine cycles—Opcode Fetch (OF, 4T/6T), Memory Read (MR, 3T), Memory Write (MW, 3T), IOR/IOW (3T)—and cumulative microseconds at 3.072 MHz.',
      'Hardware Interrupt Controller & SIM/RIM Masking: Engineered priority-ranked TRAP (0024H), RST 7.5 (003CH), RST 6.5 (0034H), and RST 5.5 (002CH) interrupts, EI/DI flip-flops, and stack PC pushing.',
      'Reversible Execution History: Designed ExecutionHistory (history.ts) to record register, flag, stack, and memory delta snapshots for time-travel debugging.',
      'Full Project Architecture & UI/UX Visualizer: Structured src/core, src/store, src/features, src/data, and src/tests; configured Vite/TypeScript/Tailwind; and integrated Zustand, Vitest, and .LST/.HEX exports.',
    ],
    techFocus: ['CPU Control Unit', 'T-State Timing', 'Interrupts', 'Zustand & Vitest'],
  },
  {
    id: 'abshik',
    name: 'Abshik',
    initials: 'AB',
    role: 'Member 1 · Assembly Language & Instruction Encoding',
    summary:
      'Defined the instruction lookup specifications, operand validation rules, and two-pass assembly translation pipeline that converts human-readable assembly into hexadecimal machine bytes starting at 2000H.',
    modules: [
      'src/core/isa/opcodes.ts',
      'src/core/assembler/assembler.ts',
      'src/core/assembler/lexer.ts',
      'src/core/assembler/parser.ts',
    ],
    contributions: [
      'Two-Pass Assembly & Symbol Table: Pass 1 scans source lines and sums byte sizes to compute exact addresses for every label (LOOP:, STORE:); Pass 2 resolves forward and backward branch targets.',
      '1-Byte, 2-Byte & 3-Byte Opcode Encoding: Classified every instruction by byte width—1-byte register ops (MOV B, A = 47H), 2-byte immediate (MVI A, 25H = 3E 25), and 3-byte direct (STA 2050H = 32 50 20).',
      'Addressing Modes & Directives: Implemented Immediate, Register, Direct, Register Indirect (M), and Implied addressing modes alongside ORG and semicolon comment stripping.',
      'Build & Verification: Structured opcodes.ts and assembler.ts with source-line-to-address mapping (addressToRow), verified via npx vitest run.',
    ],
    techFocus: ['Two-Pass Assembler', 'Opcode Encoding', 'Addressing Modes'],
  },
  {
    id: 'nitin',
    name: 'Nitin',
    initials: 'NI',
    role: 'Member 2 · 8-Bit ALU, Register Array & PSW Flag Logic',
    summary:
      'Engineered the internal arithmetic and logic processing unit, register pair coupling, BCD decimal correction, and hardware-accurate PSW flag flip-flop behavior.',
    modules: ['src/core/emulator/alu.ts', 'src/tests/cpu.test.ts'],
    contributions: [
      'Register Array & Pair Coupling: Modeled the 8-bit Accumulator (A), general-purpose registers (B, C, D, E, H, L), and 16-bit pairs (BC, DE, HL), enforcing HL as the implicit memory pointer (M).',
      'Program Status Word (PSW) Flip-Flops: Implemented all 5 status flags inside the 8-bit flag byte (S | Z | 0 | AC | 0 | P | 1 | CY): Sign, Zero, Auxiliary Carry, Even Parity, and Carry.',
      'BCD Adjustment (DAA) & Flag Exceptions: Implemented DAA using AC and CY to add 06H/60H so packed BCD sums stay valid (00–99), and enforced that 16-bit INX/DCX leave flags unchanged.',
      'Build & Verification: Built deterministic ALU helpers in alu.ts (aluAdd, aluSub, aluDaa, evaluateFlags) using 8-bit masking (& 0xff) and verified flag transitions in cpu.test.ts.',
    ],
    techFocus: ['8-Bit ALU', 'PSW Flags', 'BCD DAA Logic'],
  },
  {
    id: 'ayus',
    name: 'Ayus',
    initials: 'AY',
    role: 'Member 3 · Memory Organization, Stack & I/O Interfacing',
    summary:
      'Structured the external 64KB memory map, Little-Endian multi-byte storage rules, downward-growing LIFO stack mechanics, and isolated 8-bit peripheral I/O port interface.',
    modules: [
      'src/core/emulator/cpu.ts',
      'src/features/telemetry/MemoryHexGrid.tsx',
      'src/features/peripherals/TrainerKitPanel.tsx',
    ],
    contributions: [
      '64KB RAM & Little-Endian Ordering: Modeled the 16-bit address space (0000H–FFFFH) and enforced Intel Little-Endian storage (low-order byte at N, high-order byte at N + 1).',
      'Stack Pointer (SP) LIFO Growth: Initialized SP at FFFFH and implemented downward stack growth for PUSH, POP, CALL, RET, and interrupt vectoring.',
      'Isolated 8-Bit I/O Ports (IN / OUT): Built 256 dedicated I/O ports (00H–FFH) separate from memory space so IN reads binary switch inputs into A and OUT latches Accumulator bits to indicators.',
      'Build & Verification: Implemented Uint8Array(65536) memory and Uint8Array(256) I/O buffers in cpu.ts with mutation logging for time-travel debugging, tested via npx vitest run.',
    ],
    techFocus: ['64KB RAM & Little-Endian', 'LIFO Stack (SP)', 'Isolated I/O Ports'],
  },
];

export const TESTIMONIALS = [
  {
    quote:
      'Seeing the address/data bus transfers and T-states animate alongside the hex memory matrix makes 8085 and 8086 execution immediately intuitive for students.',
    role: 'Faculty Mentor',
    dept: 'Computer Architecture & Microprocessors',
  },
  {
    quote:
      'The step-backward timeline and clickable assembler diagnostics cut lab debugging time in half compared to traditional static simulators.',
    role: 'Microprocessor Lab TA',
    dept: 'Hardware & Embedded Systems Lab',
  },
  {
    quote:
      'Having both 8-bit 8085 and 16-bit 8086 modes plus an offline assembler-verified AI copilot in a single zero-install web app puts this far ahead of typical student tools.',
    role: 'Senior Peer Reviewer',
    dept: 'Department Project Showcase',
  },
];