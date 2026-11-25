import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Eye, Layers, Maximize2, Minimize2, RotateCcw, X } from 'lucide-react';
import { type ArchitectureId } from '../../data/landingData';

interface ChipBlockSpec {
  id: string;
  label: string;
  subLabel: string;
  shortTag: string;
  metric: string;
  description: string;
  color: number;
  hex: string;
  boxPos: [number, number, number];
  boxSize: [number, number, number];
  camPos: [number, number, number];
  camTarget: [number, number, number];
  pill?: boolean;
  verticalText?: boolean;
}

const CHIP_BLOCKS: Record<ArchitectureId, ChipBlockSpec[]> = {
  '8085': [
    {
      id: 'acc',
      label: 'ACCUMULATOR (A)',
      subLabel: '8-BIT PRIMARY',
      shortTag: 'REGISTER A',
      metric: '8-Bit · ALU Input/Output',
      description:
        'Primary 8-bit register feeding the ALU and receiving arithmetic, logic, and I/O (IN/OUT) results.',
      color: 0x22d3ee,
      hex: '#22d3ee',
      boxPos: [-2.05, 0.24, -1.02],
      boxSize: [1.05, 0.28, 0.52],
      camPos: [-3.1, 2.0, 0.9],
      camTarget: [-2.05, 0.35, -1.02],
      pill: true,
    },
    {
      id: 'temp',
      label: 'TEMP REG',
      subLabel: 'ALU OPERAND',
      shortTag: 'INTERNAL LATCH',
      metric: '8-Bit · Hidden Latch',
      description:
        'Holds the second 8-bit operand from memory or registers before feeding it into the 8-Bit ALU.',
      color: 0x38bdf8,
      hex: '#38bdf8',
      boxPos: [-0.95, 0.24, -1.02],
      boxSize: [0.95, 0.28, 0.52],
      camPos: [-1.4, 2.0, 1.0],
      camTarget: [-0.95, 0.35, -1.02],
    },
    {
      id: 'flags',
      label: 'FLAG FLIP-FLOPS',
      subLabel: 'S Z AC P CY',
      shortTag: 'PSW STATUS',
      metric: '5 Hardware Flip-Flops',
      description:
        'Stores Sign, Zero, Auxiliary Carry, Parity, and Carry bits updated by ALU operations and tested by conditional jumps.',
      color: 0xf472b6,
      hex: '#f472b6',
      boxPos: [-2.05, 0.24, -0.34],
      boxSize: [1.05, 0.28, 0.52],
      camPos: [-3.1, 2.0, 1.4],
      camTarget: [-2.05, 0.35, -0.34],
      pill: true,
    },
    {
      id: 'alu',
      label: '8-BIT ALU',
      subLabel: 'ADD / SUB / LOGIC',
      shortTag: 'EXECUTION CORE',
      metric: '8-Bit Arithmetic & Logic',
      description:
        'Executes binary addition, subtraction, AND/OR/XOR, rotate, and DAA decimal adjustment between A and Temp Reg.',
      color: 0x06b6d4,
      hex: '#22d3ee',
      boxPos: [-0.95, 0.24, -0.34],
      boxSize: [0.95, 0.28, 0.52],
      camPos: [-1.3, 2.0, 1.4],
      camTarget: [-0.95, 0.35, -0.34],
      pill: true,
    },
    {
      id: 'ir',
      label: 'INSTRUCTION REG',
      subLabel: 'OPCODE LATCH',
      shortTag: 'FETCH STAGE',
      metric: '8-Bit · OF Cycle',
      description:
        'Latches the fetched 8-bit opcode byte during the Opcode Fetch (OF) machine cycle before decoding.',
      color: 0x818cf8,
      hex: '#818cf8',
      boxPos: [-1.5, 0.24, 0.34],
      boxSize: [1.55, 0.28, 0.5],
      camPos: [-2.1, 2.0, 2.0],
      camTarget: [-1.5, 0.35, 0.34],
    },
    {
      id: 'decoder',
      label: 'INSTR DECODER',
      subLabel: 'TIMING & CONTROL',
      shortTag: 'CONTROL UNIT',
      metric: 'OF / MR / MW · TRAP/RST',
      description:
        'Decodes the opcode in IR and drives T-state timing signals, ALU control, and TRAP / RST 7.5–5.5 interrupts.',
      color: 0xfbbf24,
      hex: '#fbbf24',
      boxPos: [-1.5, 0.24, 1.02],
      boxSize: [1.55, 0.28, 0.52],
      camPos: [-2.1, 2.0, 2.7],
      camTarget: [-1.5, 0.35, 1.02],
      pill: true,
    },
    {
      id: 'bus',
      label: '8-BIT INTERNAL DATA BUS',
      subLabel: 'D7 – D0',
      shortTag: 'CENTRAL SPINE',
      metric: '8-Bit Bidirectional',
      description:
        'Central internal highway linking the Accumulator, ALU, Decoder, Register Array, SP, PC, and I/O Controller.',
      color: 0x64748b,
      hex: '#94a3b8',
      boxPos: [-0.15, 0.24, 0],
      boxSize: [0.34, 0.3, 2.6],
      camPos: [-0.15, 2.7, 2.9],
      camTarget: [-0.15, 0.35, 0],
      verticalText: true,
    },
    {
      id: 'regs',
      label: 'REGISTER ARRAY',
      subLabel: 'B C D E H L',
      shortTag: 'SCRATCHPAD',
      metric: '6×8-Bit · HL (M) Pointer',
      description:
        'Six 8-bit registers usable individually or as 16-bit pairs (BC, DE, HL), with HL acting as the M memory pointer.',
      color: 0x34d399,
      hex: '#34d399',
      boxPos: [0.75, 0.24, -1.02],
      boxSize: [1.15, 0.28, 0.52],
      camPos: [1.1, 2.0, 0.9],
      camTarget: [0.75, 0.35, -1.02],
      pill: true,
    },
    {
      id: 'sp',
      label: 'STACK POINTER',
      subLabel: '16-BIT · FFFFH',
      shortTag: 'LIFO STACK',
      metric: 'PUSH / POP / CALL',
      description:
        '16-bit pointer tracking the top of the downward-growing stack in RAM for subroutines and interrupts.',
      color: 0x10b981,
      hex: '#10b981',
      boxPos: [0.75, 0.24, -0.34],
      boxSize: [1.15, 0.28, 0.52],
      camPos: [1.1, 2.0, 1.4],
      camTarget: [0.75, 0.35, -0.34],
    },
    {
      id: 'pc',
      label: 'PROGRAM COUNTER',
      subLabel: '16-BIT · 2000H',
      shortTag: 'INSTRUCTION PTR',
      metric: 'Auto-Increment · A15–A0',
      description:
        'Holds the 16-bit memory address of the next instruction byte to fetch from system RAM.',
      color: 0x2dd4bf,
      hex: '#2dd4bf',
      boxPos: [0.75, 0.24, 0.34],
      boxSize: [1.15, 0.28, 0.52],
      camPos: [1.1, 2.0, 2.0],
      camTarget: [0.75, 0.35, 0.34],
    },
    {
      id: 'io',
      label: 'I/O PORT CTRL',
      subLabel: 'PORTS 00H–FFH',
      shortTag: 'PERIPHERALS',
      metric: '256 Isolated Ports',
      description:
        'Handles isolated 8-bit IN and OUT transfers to external trainer kit switches and LED indicators.',
      color: 0xfb923c,
      hex: '#fb923c',
      boxPos: [0.75, 0.24, 1.02],
      boxSize: [1.15, 0.28, 0.52],
      camPos: [1.1, 2.0, 2.7],
      camTarget: [0.75, 0.35, 1.02],
    },
    {
      id: 'ram',
      label: '64KB SYSTEM RAM',
      subLabel: '0000H – FFFFH',
      shortTag: 'EXTERNAL MEMORY',
      metric: 'AD7–AD0 & A15–A0',
      description:
        '65,536-byte Little-Endian memory space connected via multiplexed AD7–AD0 data/address lines and A15–A8.',
      color: 0xe05a33,
      hex: '#e05a33',
      boxPos: [2.05, 0.24, 0],
      boxSize: [1.05, 0.32, 1.25],
      camPos: [3.2, 2.1, 1.8],
      camTarget: [2.05, 0.35, 0],
      pill: true,
    },
  ],
  '8086': [
    {
      id: 'seg',
      label: 'SEGMENT REGS',
      subLabel: 'CS DS SS ES',
      shortTag: 'BIU SEGMENTS',
      metric: '4×16-Bit Base Regs',
      description:
        'Isolates Code, Data, Stack, and Extra 64KB segments inside the 1MB physical address space.',
      color: 0x34d399,
      hex: '#34d399',
      boxPos: [-1.7, 0.24, -0.95],
      boxSize: [1.55, 0.28, 0.56],
      camPos: [-2.6, 2.0, 1.0],
      camTarget: [-1.7, 0.35, -0.95],
      pill: true,
    },
    {
      id: 'adder',
      label: '20-BIT ADDER',
      subLabel: 'SEG<<4 + OFFSET',
      shortTag: 'BIU ADDRESSING',
      metric: '1 MB Physical Bus',
      description:
        'Shifts a 16-bit segment register left by 4 bits and adds the 16-bit offset to generate a 20-bit address.',
      color: 0xa855f7,
      hex: '#a855f7',
      boxPos: [-1.7, 0.24, -0.25],
      boxSize: [1.55, 0.28, 0.56],
      camPos: [-2.6, 2.0, 1.5],
      camTarget: [-1.7, 0.35, -0.25],
    },
    {
      id: 'queue',
      label: '6-BYTE QUEUE',
      subLabel: 'PREFETCH FIFO',
      shortTag: 'BIU PIPELINE',
      metric: 'Parallel Fetch/Exec',
      description:
        'Prefetches up to 6 instruction bytes from memory while the Execution Unit runs, creating the first x86 pipeline.',
      color: 0x38bdf8,
      hex: '#38bdf8',
      boxPos: [-1.7, 0.24, 0.45],
      boxSize: [1.55, 0.28, 0.56],
      camPos: [-2.6, 2.0, 2.1],
      camTarget: [-1.7, 0.35, 0.45],
      pill: true,
    },
    {
      id: 'biu_ctrl',
      label: 'BIU BUS CTRL',
      subLabel: 'AD15–AD0 · A19–A16',
      shortTag: 'EXTERNAL BUS',
      metric: '16-Bit Data · 20-Bit Addr',
      description:
        'Drives multiplexed 16-bit data/address pins to fetch instructions and read/write 16-bit words.',
      color: 0xfbbf24,
      hex: '#fbbf24',
      boxPos: [-1.7, 0.24, 1.1],
      boxSize: [1.55, 0.28, 0.48],
      camPos: [-2.6, 2.0, 2.7],
      camTarget: [-1.7, 0.35, 1.1],
    },
    {
      id: 'bus',
      label: '16-BIT INTERNAL DATA BUS',
      subLabel: 'D15 – D0',
      shortTag: 'BIU ↔ EU SPINE',
      metric: '16-Bit Bidirectional',
      description:
        'Connects the Bus Interface Unit (BIU) and Execution Unit (EU) registers, ALU, and 16-bit flags.',
      color: 0x64748b,
      hex: '#94a3b8',
      boxPos: [-0.25, 0.24, 0],
      boxSize: [0.34, 0.3, 2.6],
      camPos: [-0.25, 2.7, 2.9],
      camTarget: [-0.25, 0.35, 0],
      verticalText: true,
    },
    {
      id: 'gpregs',
      label: 'GENERAL REGS',
      subLabel: 'AX BX CX DX',
      shortTag: 'EU 16-BIT REGS',
      metric: '8/16-Bit Split (AL/AH)',
      description:
        'Four 16-bit general registers (AX, BX, CX, DX) also addressable as eight independent 8-bit halves.',
      color: 0x10b981,
      hex: '#10b981',
      boxPos: [0.75, 0.24, -0.95],
      boxSize: [1.2, 0.28, 0.56],
      camPos: [1.1, 2.0, 1.0],
      camTarget: [0.75, 0.35, -0.95],
      pill: true,
    },
    {
      id: 'ptrs',
      label: 'POINTERS & INDEX',
      subLabel: 'SP BP SI DI',
      shortTag: 'EU OFFSETS',
      metric: 'Stack & String Pointers',
      description:
        'Holds 16-bit offset pointers for stack frames (SP, BP) and memory/string indexing (SI, DI).',
      color: 0x2dd4bf,
      hex: '#2dd4bf',
      boxPos: [0.75, 0.24, -0.25],
      boxSize: [1.2, 0.28, 0.56],
      camPos: [1.1, 2.0, 1.5],
      camTarget: [0.75, 0.35, -0.25],
    },
    {
      id: 'eu_alu',
      label: '16-BIT ALU',
      subLabel: 'MUL / DIV / LOGIC',
      shortTag: 'EXECUTION UNIT',
      metric: '29,277 Transistors',
      description:
        'Performs 16-bit arithmetic, signed math, hardware MUL/DIV, shifts, and LOOP operations.',
      color: 0xe05a33,
      hex: '#e05a33',
      boxPos: [0.75, 0.24, 0.45],
      boxSize: [1.2, 0.28, 0.56],
      camPos: [1.1, 2.0, 2.1],
      camTarget: [0.75, 0.35, 0.45],
      pill: true,
    },
    {
      id: 'eu_flags',
      label: 'EU FLAGS & CTRL',
      subLabel: 'O D I T S Z A P C',
      shortTag: '16-BIT STATUS',
      metric: '9 Active Status/Ctrl Bits',
      description:
        'Tracks Overflow, Direction, Interrupt, Trap, Sign, Zero, Aux Carry, Parity, and Carry flags.',
      color: 0xf472b6,
      hex: '#f472b6',
      boxPos: [0.75, 0.24, 1.1],
      boxSize: [1.2, 0.28, 0.48],
      camPos: [1.1, 2.0, 2.7],
      camTarget: [0.75, 0.35, 1.1],
    },
    {
      id: 'ram86',
      label: '1MB SYSTEM RAM',
      subLabel: '00000H – FFFFFH',
      shortTag: '20-BIT MEMORY',
      metric: '1,048,576 Bytes',
      description:
        '1 MB physical memory space accessed via 20-bit addresses and 16-bit Little-Endian word transfers.',
      color: 0x06b6d4,
      hex: '#22d3ee',
      boxPos: [2.08, 0.24, 0],
      boxSize: [1.05, 0.32, 1.3],
      camPos: [3.2, 2.1, 1.8],
      camTarget: [2.08, 0.35, 0],
      pill: true,
    },
  ],
};

function createLabelTexture(
  title: string,
  subLabel: string,
  accentHex: string,
  vertical = false
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = vertical ? 256 : 512;
  canvas.height = vertical ? 1024 : 256;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    ctx.fillStyle = '#09101f';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 10;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    ctx.save();
    if (vertical) {
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 46px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, 0, -24);

      ctx.fillStyle = accentHex;
      ctx.font = 'bold 34px monospace';
      ctx.fillText(subLabel, 0, 34);
    } else {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 42px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 26);

      ctx.fillStyle = accentHex;
      ctx.font = 'bold 32px monospace';
      ctx.fillText(subLabel, canvas.width / 2, canvas.height / 2 + 34);
    }
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.anisotropy = 4;
  return tex;
}

const OVERVIEW_CAM: [number, number, number] = [0, 4.9, 5.1];
const OVERVIEW_TARGET: [number, number, number] = [0, 0.25, 0];

interface Chip3DExplorerProps {
  archId: ArchitectureId;
}

export const Chip3DExplorer: React.FC<Chip3DExplorerProps> = ({ archId }) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [selectedId, setSelectedId] = useState<string>('overview');
  const [showCard, setShowCard] = useState<boolean>(true);
  const [exploded, setExploded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const selectedRef = useRef<string>('overview');
  const explodedRef = useRef<boolean>(true);
  const targetCamPosRef = useRef(new THREE.Vector3(...OVERVIEW_CAM));
  const targetLookAtRef = useRef(new THREE.Vector3(...OVERVIEW_TARGET));
  const isFlyingRef = useRef(false);

  const blocks = CHIP_BLOCKS[archId];
  const activeBlock = showCard ? blocks.find((b) => b.id === selectedId) ?? null : null;

  useEffect(() => {
    selectedRef.current = 'overview';
    setSelectedId('overview');
    targetCamPosRef.current.set(...OVERVIEW_CAM);
    targetLookAtRef.current.set(...OVERVIEW_TARGET);
    isFlyingRef.current = true;
  }, [archId]);

  useEffect(() => {
    explodedRef.current = exploded;
  }, [exploded]);

  useEffect(() => {
    if (!isFullscreen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isFullscreen]);

  const focusSection = (sectionId: string) => {
    setSelectedId(sectionId);
    selectedRef.current = sectionId;
    setShowCard(sectionId !== 'overview');
    if (sectionId === 'overview') {
      targetCamPosRef.current.set(...OVERVIEW_CAM);
      targetLookAtRef.current.set(...OVERVIEW_TARGET);
    } else {
      const sec = blocks.find((s) => s.id === sectionId);
      if (sec) {
        targetCamPosRef.current.set(...sec.camPos);
        targetLookAtRef.current.set(...sec.camTarget);
      }
    }
    isFlyingRef.current = true;
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 640;
    const height = container.clientHeight || 460;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x060913);
    scene.fog = new THREE.FogExp2(0x060913, 0.045);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 60);
    camera.position.set(...OVERVIEW_CAM);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'default' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.2;
    controls.maxDistance = 11.5;
    controls.maxPolarAngle = Math.PI / 2 - 0.06;
    controls.target.set(...OVERVIEW_TARGET);

    const stopFly = () => {
      isFlyingRef.current = false;
    };
    controls.addEventListener('start', stopFly);

    scene.add(new THREE.AmbientLight(0xe2e8f0, 0.9));
    const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
    keyLight.position.set(5, 9, 5);
    scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x38bdf8, 2.0, 18);
    rimLight.position.set(-4, 3.5, -3);
    scene.add(rimLight);

    const warmLight = new THREE.PointLight(0xe05a33, 1.5, 18);
    warmLight.position.set(4, 3, 3);
    scene.add(warmLight);

    const grid = new THREE.GridHelper(20, 40, 0x1e3a5f, 0x0f172a);
    grid.position.y = -0.55;
    scene.add(grid);

    const packageGroup = new THREE.Group();
    const dipGeo = new THREE.BoxGeometry(5.6, 0.34, 3.1);
    const dipMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      roughness: 0.45,
      metalness: 0.35,
    });
    packageGroup.add(new THREE.Mesh(dipGeo, dipMat));

    const pinGeo = new THREE.BoxGeometry(0.11, 0.38, 0.16);
    const pinMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      roughness: 0.25,
      metalness: 0.85,
    });
    for (let i = 0; i < 20; i++) {
      const x = -2.45 + i * 0.255;
      const topPin = new THREE.Mesh(pinGeo, pinMat);
      topPin.position.set(x, -0.18, -1.62);
      packageGroup.add(topPin);

      const botPin = new THREE.Mesh(pinGeo, pinMat);
      botPin.position.set(x, -0.18, 1.62);
      packageGroup.add(botPin);
    }
    scene.add(packageGroup);

    const waferGroup = new THREE.Group();
    const waferGeo = new THREE.BoxGeometry(5.35, 0.08, 2.85);
    const waferMat = new THREE.MeshStandardMaterial({
      color: 0x0b1324,
      roughness: 0.25,
      metalness: 0.75,
    });
    waferGroup.add(new THREE.Mesh(waferGeo, waferMat));
    waferGroup.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(waferGeo),
        new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.38 })
      )
    );
    scene.add(waferGroup);

    const blocksGroup = new THREE.Group();
    const blockMeshes: { id: string; mesh: THREE.Mesh; mat: THREE.MeshStandardMaterial }[] = [];

    blocks.forEach((b) => {
      const geo = new THREE.BoxGeometry(...b.boxSize);
      const mat = new THREE.MeshStandardMaterial({
        color: b.color,
        emissive: b.color,
        emissiveIntensity: 0.2,
        roughness: 0.3,
        metalness: 0.35,
        transparent: true,
        opacity: 0.92,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(...b.boxPos);
      mesh.userData = { sectionId: b.id };

      mesh.add(
        new THREE.LineSegments(
          new THREE.EdgesGeometry(geo),
          new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 })
        )
      );

      const labelTex = createLabelTexture(b.label, b.subLabel, b.hex, Boolean(b.verticalText));
      const labelGeo = new THREE.PlaneGeometry(b.boxSize[0] * 0.94, b.boxSize[2] * 0.92);
      const labelMat = new THREE.MeshBasicMaterial({ map: labelTex });
      const labelPlane = new THREE.Mesh(labelGeo, labelMat);
      labelPlane.rotation.x = -Math.PI / 2;
      labelPlane.position.y = b.boxSize[1] / 2 + 0.004;
      mesh.add(labelPlane);

      blocksGroup.add(mesh);
      blockMeshes.push({ id: b.id, mesh, mat });
    });

    const busCurves: THREE.CatmullRomCurve3[] = [
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.5, 0.24, -1.02),
        new THREE.Vector3(-0.15, 0.28, -1.02),
        new THREE.Vector3(0.75, 0.24, -1.02),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.5, 0.24, -0.34),
        new THREE.Vector3(-0.15, 0.28, -0.34),
        new THREE.Vector3(0.75, 0.24, -0.34),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(-1.5, 0.24, 0.34),
        new THREE.Vector3(-0.15, 0.28, 0.34),
        new THREE.Vector3(0.75, 0.24, 0.34),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.75, 0.24, -0.34),
        new THREE.Vector3(1.4, 0.28, -0.2),
        new THREE.Vector3(2.05, 0.24, -0.15),
      ]),
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0.75, 0.24, 0.34),
        new THREE.Vector3(1.4, 0.28, 0.2),
        new THREE.Vector3(2.05, 0.24, 0.15),
      ]),
    ];

    const pulses: { mesh: THREE.Mesh; curve: THREE.CatmullRomCurve3; offset: number }[] = [];
    const pulseGeo = new THREE.SphereGeometry(0.048, 12, 12);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    busCurves.forEach((curve, idx) => {
      const tube = new THREE.Mesh(
        new THREE.TubeGeometry(curve, 20, 0.018, 8, false),
        new THREE.MeshBasicMaterial({
          color: idx >= 3 ? 0xe05a33 : 0x38bdf8,
          transparent: true,
          opacity: 0.65,
        })
      );
      blocksGroup.add(tube);

      const pulse = new THREE.Mesh(pulseGeo, pulseMat);
      blocksGroup.add(pulse);
      pulses.push({ mesh: pulse, curve, offset: idx * 0.2 });
    });

    scene.add(blocksGroup);

    const lidGroup = new THREE.Group();
    const lidGeo = new THREE.BoxGeometry(5.4, 0.06, 2.9);
    const lidMat = new THREE.MeshPhysicalMaterial({
      color: 0x93c5fd,
      transparent: true,
      opacity: 0.1,
      roughness: 0.1,
      metalness: 0.1,
    });
    lidGroup.add(new THREE.Mesh(lidGeo, lidMat));
    lidGroup.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(lidGeo),
        new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.28 })
      )
    );
    scene.add(lidGroup);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const handlePointerDown = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(
        blockMeshes.map((b) => b.mesh),
        false
      );
      if (hits.length > 0) {
        const hitId = hits[0].object.userData?.sectionId as string | undefined;
        if (hitId) focusSection(hitId);
      }
    };
    renderer.domElement.addEventListener('pointerdown', handlePointerDown);

    const ro = new ResizeObserver(() => {
      const w = container.clientWidth || 640;
      const h = container.clientHeight || 460;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    ro.observe(container);

    let rafId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsed = clock.getElapsedTime();

      const targetWaferY = explodedRef.current ? 0.34 : 0.19;
      const targetBlocksY = explodedRef.current ? 0.62 : 0.22;
      const targetLidY = explodedRef.current ? 1.58 : 0.5;

      waferGroup.position.y += (targetWaferY - waferGroup.position.y) * 0.08;
      blocksGroup.position.y += (targetBlocksY - blocksGroup.position.y) * 0.08;
      lidGroup.position.y += (targetLidY - lidGroup.position.y) * 0.08;

      pulses.forEach((p) => {
        const t = (elapsed * 0.45 + p.offset) % 1;
        p.mesh.position.copy(p.curve.getPointAt(t));
      });

      blockMeshes.forEach((b) => {
        const isSel = selectedRef.current === b.id;
        const targetIntensity =
          selectedRef.current === 'overview' ? 0.2 : isSel ? 0.65 : 0.06;
        b.mat.emissiveIntensity += (targetIntensity - b.mat.emissiveIntensity) * 0.1;
        b.mat.opacity +=
          ((selectedRef.current === 'overview' || isSel ? 0.95 : 0.38) - b.mat.opacity) * 0.1;
      });

      if (isFlyingRef.current) {
        camera.position.lerp(targetCamPosRef.current, 0.065);
        controls.target.lerp(targetLookAtRef.current, 0.065);
        if (
          camera.position.distanceTo(targetCamPosRef.current) < 0.03 &&
          controls.target.distanceTo(targetLookAtRef.current) < 0.03
        ) {
          isFlyingRef.current = false;
        }
      }

      controls.update();
      renderer.render(scene, camera);
      rafId = window.requestAnimationFrame(animate);
    };

    rafId = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      controls.removeEventListener('start', stopFly);
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      controls.dispose();
      renderer.dispose();
    };
  }, [archId]);

  const pillBlocks = blocks.filter((b) => b.pill);

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 flex flex-col bg-[#060913] text-white'
          : 'relative overflow-hidden rounded-[26px] border border-white/10 bg-[#060913] text-white shadow-2xl'
      }
    >
      {/* 3D WebGL Viewport */}
      <div
        ref={mountRef}
        className={
          isFullscreen
            ? 'w-full flex-1 cursor-grab active:cursor-grabbing'
            : 'h-[460px] w-full cursor-grab active:cursor-grabbing sm:h-[520px]'
        }
      />

      {/* Top HUD */}
      <div className="pointer-events-none absolute top-4 left-4 right-4 flex flex-wrap items-center justify-between gap-2">
        <div className="pointer-events-auto flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3.5 py-1.5 backdrop-blur-md">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          <span className="font-mono text-[11px] font-bold tracking-wider uppercase">
            Intel {archId} · 3D Microarchitecture Twin
          </span>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setExploded((e) => !e)}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold backdrop-blur-md transition ${
              exploded
                ? 'border-[#38bdf8]/60 bg-[#38bdf8]/20 text-[#bae6fd]'
                : 'border-white/15 bg-black/60 text-white/80 hover:text-white'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>{exploded ? 'Exploded Layers' : 'Assembled Chip'}</span>
          </button>

          <button
            type="button"
            onClick={() => focusSection('overview')}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1.5 text-[11px] font-semibold text-white/85 backdrop-blur-md hover:border-white/40"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Bird&apos;s-Eye</span>
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen((f) => !f)}
            title={isFullscreen ? 'Exit Full Screen (Esc)' : 'Open Full Screen'}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/15 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md hover:bg-white/25"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Exit Full</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Full Screen</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Non-Blocking Docked Detail Card (Bottom-Right, Dismissible) */}
      {activeBlock && (
        <div className="absolute right-4 bottom-16 z-10 w-[min(92vw,320px)] rounded-2xl border border-white/15 bg-black/80 p-3.5 shadow-xl backdrop-blur-xl">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className="font-mono text-[10px] font-bold tracking-widest uppercase"
                style={{ color: activeBlock.hex }}
              >
                {activeBlock.shortTag} · {activeBlock.metric}
              </span>
              <h3 className="mt-0.5 text-sm font-bold text-white">{activeBlock.label}</h3>
            </div>
            <button
              type="button"
              aria-label="Close block info"
              onClick={() => setShowCard(false)}
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/75 hover:bg-white/20 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-white/75">
            {activeBlock.description}
          </p>
        </div>
      )}

      {/* Bottom Section Switcher Bar */}
      <div className="border-t border-white/10 bg-black/85 px-4 py-3 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => focusSection('overview')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                selectedId === 'overview'
                  ? 'bg-white text-[#1d1d1f]'
                  : 'bg-white/10 text-white/75 hover:bg-white/20'
              }`}
            >
              <Eye className="h-3 w-3" />
              <span>Overview</span>
            </button>

            {pillBlocks.map((sec) => {
              const active = selectedId === sec.id;
              return (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => focusSection(sec.id)}
                  className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition"
                  style={{
                    borderColor: active ? sec.hex : 'rgba(255,255,255,0.12)',
                    backgroundColor: active ? `${sec.hex}26` : 'rgba(255,255,255,0.06)',
                    color: active ? '#ffffff' : 'rgba(255,255,255,0.75)',
                  }}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: sec.hex }} />
                  <span>{sec.label}</span>
                </button>
              );
            })}
          </div>

          <span className="hidden text-[11px] text-white/50 md:inline">
            Click any 3D block · Full Screen supported
          </span>
        </div>
      </div>
    </div>
  );
};