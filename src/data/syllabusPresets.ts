import type { ArchitectureId } from '../core/isa/arch8086';

export interface SyllabusPreset {
  id: string;
  arch: ArchitectureId;
  title: string;
  category: string;
  description: string;
  code: string;
}

export const SYLLABUS_PRESETS: SyllabusPreset[] = [
  // ==================== 8085 BEGINNER BASICS ====================
  {
    id: 'basic-mov-8085',
    arch: '8085',
    title: 'Load & Copy Registers (MVI, MOV)',
    category: 'Beginner 01',
    description: 'Loads a number into Register A, copies it to B, and loads C—great first step.',
    code: `; Beginner 01: Load & Copy Registers
        ORG 2000H
        MVI A, 25H      ; Put 25H directly into Accumulator A
        MOV B, A        ; Copy A into Register B (B becomes 25H)
        MVI C, 10H      ; Put 10H directly into Register C
        HLT             ; Stop CPU execution`,
  },
  {
    id: 'basic-add-sub-8085',
    arch: '8085',
    title: 'Simple Add & Subtract (ADD, SUB)',
    category: 'Beginner 02',
    description: 'Adds A + B, then subtracts C from the result.',
    code: `; Beginner 02: Simple 8-Bit Addition & Subtraction
        ORG 2000H
        MVI A, 15H      ; A = 15H (21 in decimal)
        MVI B, 0AH      ; B = 0AH (10 in decimal)
        ADD B           ; A = A + B (1FH / 31)
        MVI C, 05H      ; C = 05H
        SUB C           ; A = A - C (1AH / 26)
        HLT`,
  },
  {
    id: 'basic-flags-8085',
    arch: '8085',
    title: 'Watch Zero & Carry Flags (INR, DCR)',
    category: 'Beginner 03',
    description: 'See the Zero (Z) and Parity (P) flags light up when a register hits 00H.',
    code: `; Beginner 03: Watch PSW Flags Flip Live
        ORG 2000H
        MVI A, 01H      ; Start with A = 01H
        DCR A           ; Decrement A -> 00H (Zero flag Z becomes 1!)
        MVI B, FFH      ; Start with B = FFH (255)
        INR B           ; Increment B -> wraps to 00H (Z=1)
        HLT`,
  },
  {
    id: 'basic-logic-8085',
    arch: '8085',
    title: 'Bitwise AND, OR & Rotate (ANA, RAR)',
    category: 'Beginner 04',
    description: 'Masks lower 4 bits with ANA and shifts bits right through Carry with RAR.',
    code: `; Beginner 04: Bitwise Logic & Rotate
        ORG 2000H
        MVI A, 5AH      ; A = 0101 1010 in binary
        MVI B, 0FH      ; Mask for lower 4 bits
        ANA B           ; A = A AND B -> 0AH (0000 1010)
        RAR             ; Rotate A right through Carry (LSB -> CY)
        HLT`,
  },
  {
    id: 'basic-mem-8085',
    arch: '8085',
    title: 'Save & Read RAM (STA, LDA)',
    category: 'Beginner 05',
    description: 'Saves Accumulator A to RAM address 2050H, clears A, and reads 2050H back.',
    code: `; Beginner 05: Store to RAM & Load Back
        ORG 2000H
        MVI A, 77H      ; Load 77H into A
        STA 2050H       ; Save A into Memory[2050H]
        MVI A, 00H      ; Clear A to 00H
        LDA 2050H       ; Load Memory[2050H] back into A (77H)
        HLT`,
  },
  {
    id: 'basic-stack-8085',
    arch: '8085',
    title: 'Stack Push & Pop (PUSH, POP)',
    category: 'Beginner 06',
    description: 'Saves 16-bit pair BC onto the LIFO stack and restores it.',
    code: `; Beginner 06: Stack Push & Pop (Watch SP change!)
        ORG 2000H
        LXI B, 1234H    ; Load 1234H into BC pair
        PUSH B          ; Push BC onto Stack (SP decreases by 2)
        LXI B, 0000H    ; Clear BC to 0000H
        POP B           ; Restore 1234H from Stack (SP increases by 2)
        HLT`,
  },
  {
    id: 'basic-io-8085',
    arch: '8085',
    title: 'Trainer Kit I/O Switches (IN, OUT)',
    category: 'Beginner 07',
    description: 'Reads Port 00H DIP switches, inverts bits, and lights up Port 00H LEDs.',
    code: `; Beginner 07: Hardware I/O Port Demo
        ORG 2000H
        IN 00H          ; Read binary switches from Port 00H into A
        CMA             ; Complement all bits in A
        OUT 00H         ; Send A to Port 00H output LEDs
        HLT`,
  },

  // ==================== 8085 INTERMEDIATE / SYLLABUS ====================
  {
    id: 'add-8bit',
    arch: '8085',
    title: '8-Bit Addition with Carry',
    category: 'Arithmetic',
    description: 'Adds two 8-bit hex numbers from 2050H & 2051H and stores sum at 2052H, carry at 2053H.',
    code: `; 8-Bit Addition with Carry Storage
        ORG 2000H
        LXI H, 2050H    ; Point HL to first operand
        MOV A, M        ; Load first number into Accumulator
        INX H           ; Point to second operand (2051H)
        ADD M           ; A = A + M
        MVI C, 00H      ; Clear C register for Carry count
        JNC STORE       ; Jump if no carry generated
        INR C           ; Increment C if CY = 1
STORE:  INX H           ; Point to 2052H
        MOV M, A        ; Store 8-bit sum
        INX H           ; Point to 2053H
        MOV M, C        ; Store carry byte
        HLT

        ORG 2050H
        DB 9AH, 85H     ; Sample inputs: 9AH + 85H = 11FH (Sum=1FH, CY=01H)`,
  },
  {
    id: 'fibonacci',
    arch: '8085',
    title: 'Fibonacci Series Generator',
    category: 'Loops & Arrays',
    description: 'Generates the first 8 Fibonacci numbers in memory starting at 2050H.',
    code: `; Generate First 8 Fibonacci Numbers at 2050H
        ORG 2000H
        LXI H, 2050H    ; Destination table base address
        MVI C, 06H      ; Remaining count (8 - 2 initial terms)
        MVI A, 00H      ; First term = 0
        MOV M, A
        INX H
        MVI B, 01H      ; Second term = 1
        MOV M, B
LOOP:   MOV D, B        ; Save current term
        ADD B           ; Next term = prev + curr
        INX H
        MOV M, A        ; Store next term
        MOV B, A        ; Update current term
        MOV A, D        ; Update previous term
        DCR C
        JNZ LOOP
        HLT`,
  },
  {
    id: 'bubble-sort',
    arch: '8085',
    title: 'Bubble Sort (Ascending)',
    category: 'Sorting',
    description: 'Sorts a 5-byte array at 2050H in ascending order.',
    code: `; Bubble Sort 5 Bytes in Ascending Order at 2050H
        ORG 2000H
        MVI B, 04H      ; Outer loop counter (N - 1)
OUTER:  LXI H, 2050H    ; Array base address
        MVI C, 04H      ; Inner comparison counter
INNER:  MOV A, M        ; Load current element
        INX H
        CMP M           ; Compare A with next element
        JC SKIP         ; If A < M, already in order
        MOV D, M        ; Swap M and A
        MOV M, A
        DCX H
        MOV M, D
        INX H
SKIP:   DCR C
        JNZ INNER
        DCR B
        JNZ OUTER
        HLT

        ORG 2050H
        DB 42H, 15H, 89H, 07H, 33H`,
  },
  {
    id: 'bcd-add',
    arch: '8085',
    title: 'BCD Decimal Addition (DAA)',
    category: 'BCD Arithmetic',
    description: 'Adds two packed BCD numbers (48 + 37 = 85) using DAA.',
    code: `; Packed BCD Addition using DAA
        ORG 2000H
        MVI A, 48H      ; BCD 48
        MVI B, 37H      ; BCD 37
        ADD B           ; Binary sum = 7FH
        DAA             ; Decimal Adjust -> 85H (BCD 85)
        STA 2050H       ; Store packed BCD result
        HLT`,
  },

  // ==================== 8086 BEGINNER BASICS ====================
  {
    id: 'basic-mov-8086',
    arch: '8086',
    title: 'Load & Copy 16-Bit Registers (MOV)',
    category: 'Beginner 01',
    description: 'Loads 16-bit values into AX, copies to BX, and sets CX.',
    code: `; Beginner 01 (8086): Load & Copy 16-Bit Registers
        ORG 0100H
        MOV AX, 1234H   ; Load 1234H into 16-bit AX
        MOV BX, AX      ; Copy AX into BX
        MOV CX, 0005H   ; Load 0005H into CX
        HLT`,
  },
  {
    id: 'basic-add-sub-8086',
    arch: '8086',
    title: 'Simple 16-Bit Add & Subtract',
    category: 'Beginner 02',
    description: 'Adds AX + BX and subtracts an immediate 16-bit value.',
    code: `; Beginner 02 (8086): Simple 16-Bit Add & Subtract
        ORG 0100H
        MOV AX, 0050H   ; AX = 0050H
        MOV BX, 0025H   ; BX = 0025H
        ADD AX, BX      ; AX = AX + BX (0075H)
        SUB AX, 0010H   ; AX = AX - 0010H (0065H)
        HLT`,
  },
  {
    id: 'basic-loop-8086',
    arch: '8086',
    title: 'Count Up with CX Loop (INC, LOOP)',
    category: 'Beginner 03',
    description: 'Increments AX 4 times using the built-in CX hardware LOOP instruction.',
    code: `; Beginner 03 (8086): Simple Hardware LOOP Counter
        ORG 0100H
        MOV AX, 0000H   ; Start AX at 0
        MOV CX, 0004H   ; Repeat 4 times
AGAIN:  INC AX          ; AX = AX + 1
        LOOP AGAIN      ; Decrement CX; jump if CX != 0
        HLT`,
  },
  {
    id: 'basic-mem-8086',
    arch: '8086',
    title: 'Save & Read 16-Bit RAM ([1200H])',
    category: 'Beginner 04',
    description: 'Writes AX to memory [1200H], clears AX, and reads it into BX.',
    code: `; Beginner 04 (8086): Read & Write 16-Bit RAM
        ORG 0100H
        MOV AX, 4567H   ; Load 4567H into AX
        MOV [1200H], AX ; Store AX at Memory[1200H]
        MOV AX, 0000H   ; Clear AX
        MOV BX, [1200H] ; Read Memory[1200H] into BX
        HLT`,
  },

  // ==================== 8086 INTERMEDIATE / SYLLABUS ====================
  {
    id: 'block-sum-8086',
    arch: '8086',
    title: '16-Bit Block Sum',
    category: '16-Bit Loops',
    description: 'Sums 5 16-bit words starting at DS:1200H and stores result at DS:1300H.',
    code: `; Intel 8086 16-Bit Block Sum
        ORG 0100H
        MOV AX, 0000H   ; Clear 16-bit accumulator
        MOV CX, 0005H   ; Loop counter = 5 words
        MOV BX, 1200H   ; Base offset in Data Segment
SUM_LP: ADD AX, [BX]    ; Add 16-bit word at DS:[BX]
        INC BX
        INC BX          ; Advance to next 16-bit word
        LOOP SUM_LP     ; Decrement CX and loop if CX != 0
        MOV [1300H], AX ; Store 16-bit sum at 1300H
        HLT

        ORG 1200H
        DW 0010H, 0025H, 0015H, 0030H, 0020H`,
  },
  {
    id: 'mul-16bit-8086',
    arch: '8086',
    title: '16-Bit Multiplication (MUL)',
    category: '16-Bit Arithmetic',
    description: 'Multiplies two 16-bit numbers in AX and BX, storing DX:AX at 1200H.',
    code: `; Intel 8086 16-Bit Unsigned Multiplication
        ORG 0100H
        MOV AX, 1234H   ; Multiplicand
        MOV BX, 0020H   ; Multiplier
        MUL BX          ; DX:AX = AX * BX
        MOV [1200H], AX ; Store low 16 bits
        MOV [1202H], DX ; Store high 16 bits
        HLT`,
  },
  {
    id: 'io-port-8086',
    arch: '8086',
    title: 'I/O Port Switch Mirror',
    category: '16-Bit I/O',
    description: 'Reads Port 00H DIP switches into AL, complements, and writes to Port 00H LEDs.',
    code: `; Intel 8086 I/O Port Demo (Toggle DIP Switches first)
        ORG 0100H
        IN AL, 00H      ; Read DIP switches from Port 00H
        NOT AL          ; Invert bits
        OUT 00H, AL     ; Display on LED array
        HLT`,
  },
];