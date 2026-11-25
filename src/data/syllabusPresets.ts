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