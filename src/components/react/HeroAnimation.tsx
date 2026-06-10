import { useEffect, useRef } from 'react';

interface Point {
  x: number;
  y: number;
}

interface Node {
  x: number;
  y: number;
  phase: number;
  connections: number[];
}

const COLORS = {
  bg: '#0A0A0F',
  cyan: '#00D4FF',
  violet: '#7B61FF',
  green: '#00FF88',
  grid: '#1A1A2E',
};

export default function HeroAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check for reduced motion
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) {
      // Show static SVG fallback by hiding canvas and showing the SVG
      canvas.style.display = 'none';
      const svg = container.querySelector('.hero-fallback-svg');
      if (svg) {
        (svg as HTMLElement).style.display = 'block';
      }
      return;
    }

    const isMobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const loopDuration = isMobile ? 3 : 8;

    // ─── Canvas sizing ────────────────────────────────────────────
    function resize() {
      const rect = container!.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    const W = () => container.getBoundingClientRect().width;
    const H = () => container.getBoundingClientRect().height;

    // ─── Circuit grid generation ────────────────────────────────
    function generateGrid(): Point[] {
      const cols = isMobile ? 6 : 12;
      const rows = isMobile ? 4 : 8;
      const points: Point[] = [];
      const spacingX = W() / (cols + 1);
      const spacingY = H() / (rows + 1);

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const jitter = isMobile ? 8 : 15;
          points.push({
            x: spacingX * (c + 1) + (Math.random() - 0.5) * jitter,
            y: spacingY * (r + 1) + (Math.random() - 0.5) * jitter,
          });
        }
      }
      return points;
    }

    // ─── Neural node generation ─────────────────────────────────
    function generateNodes(): Node[] {
      const count = isMobile ? 15 : 40;
      const nodes: Node[] = [];
      for (let i = 0; i < count; i++) {
        nodes.push({
          x: Math.random() * W(),
          y: Math.random() * H(),
          phase: Math.random() * Math.PI * 2,
          connections: [],
        });
      }

      // Connect nearby nodes
      for (let i = 0; i < count; i++) {
        const distances: { idx: number; d: number }[] = [];
        for (let j = 0; j < count; j++) {
          if (i === j) continue;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          distances.push({ idx: j, d: Math.sqrt(dx * dx + dy * dy) });
        }
        distances.sort((a, b) => a.d - b.d);
        nodes[i].connections = distances
          .slice(0, isMobile ? 2 : 3)
          .map((d) => d.idx);
      }

      return nodes;
    }

    // ─── Draw functions ──────────────────────────────────────────

    function drawGrid(points: Point[], progress: number) {
      const spacingX = W() / (12 + 1);
      const spacingY = H() / (8 + 1);

      // Grid lines
      ctx!.strokeStyle = COLORS.grid;
      ctx!.lineWidth = 0.5;
      ctx!.globalAlpha = 0.3 * progress;

      // Vertical lines
      for (let c = 0; c < (isMobile ? 6 : 12); c++) {
        const x = spacingX * (c + 1);
        ctx!.beginPath();
        ctx!.moveTo(x, 0);
        ctx!.lineTo(x, H());
        ctx!.stroke();
      }

      // Horizontal lines
      for (let r = 0; r < (isMobile ? 4 : 8); r++) {
        const y = spacingY * (r + 1);
        ctx!.beginPath();
        ctx!.moveTo(0, y);
        ctx!.lineTo(W(), y);
        ctx!.stroke();
      }

      // Circuit traces (cyan lines along grid)
      ctx!.strokeStyle = COLORS.cyan;
      ctx!.lineWidth = 1.5;
      ctx!.globalAlpha = 0.6 * progress;

      const tracesToDraw = isMobile ? 4 : 10;
      for (let t = 0; t < tracesToDraw; t++) {
        const startIdx = Math.floor(Math.random() * points.length);
        const endIdx = Math.floor(Math.random() * points.length);
        const p1 = points[startIdx];
        const p2 = points[endIdx];

        // Only draw if close enough
        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        if (Math.sqrt(dx * dx + dy * dy) > Math.min(W(), H()) * 0.4) continue;

        ctx!.beginPath();
        ctx!.moveTo(p1.x, p1.y);
        // Right-angle path (circuit-style)
        const midX = p2.x;
        ctx!.lineTo(midX, p1.y);
        ctx!.lineTo(p2.x, p2.y);
        ctx!.stroke();
      }

      // Green nodes at intersections
      ctx!.fillStyle = COLORS.green;
      ctx!.globalAlpha = 0.8 * progress;
      const nodeCount = isMobile ? 8 : 20;
      for (let i = 0; i < nodeCount && i < points.length; i++) {
        const p = points[i];
        const pulse = 0.5 + 0.5 * Math.sin(Date.now() * 0.003 + i);
        const radius = (1.5 + pulse * 1.5) * (isMobile ? 0.8 : 1);
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
    }

    function drawNeuralNetwork(nodes: Node[], progress: number, time: number) {
      // Connection lines with gradient
      const lineAlpha = 0.3 + 0.4 * progress;
      ctx!.lineWidth = 1.2;

      for (const node of nodes) {
        for (const connIdx of node.connections) {
          const target = nodes[connIdx];
          if (!target) continue;

          const wave =
            0.3 + 0.7 * Math.abs(Math.sin(time * 0.001 + node.phase));
          const alpha = lineAlpha * wave * progress;

          // Gradient from violet to cyan
          const grad = ctx!.createLinearGradient(
            node.x,
            node.y,
            target.x,
            target.y,
          );
          grad.addColorStop(0, COLORS.violet);
          grad.addColorStop(0.5, COLORS.cyan);
          grad.addColorStop(1, COLORS.violet);

          ctx!.strokeStyle = grad;
          ctx!.globalAlpha = alpha;
          ctx!.beginPath();
          ctx!.moveTo(node.x, node.y);

          // Curved connection
          const cp1x = node.x + (target.x - node.x) * 0.3;
          const cp1y = node.y - 20 * Math.sin(time * 0.002 + node.phase);
          const cp2x = node.x + (target.x - node.x) * 0.7;
          const cp2y = target.y + 20 * Math.sin(time * 0.002 + target.phase);

          ctx!.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, target.x, target.y);
          ctx!.stroke();
        }
      }

      // Violet nodes with pulse
      ctx!.globalAlpha = 0.7 + 0.3 * progress;
      for (const node of nodes) {
        const pulse = 0.5 + 0.5 * Math.sin(time * 0.002 + node.phase);
        const radius = (2 + pulse * 3) * (isMobile ? 0.8 : 1);

        // Glow
        const glow = ctx!.createRadialGradient(
          node.x,
          node.y,
          0,
          node.x,
          node.y,
          radius * 3,
        );
        glow.addColorStop(0, COLORS.violet);
        glow.addColorStop(1, 'transparent');
        ctx!.fillStyle = glow;
        ctx!.globalAlpha = 0.15 * progress;
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, radius * 3, 0, Math.PI * 2);
        ctx!.fill();

        // Core
        ctx!.fillStyle = COLORS.violet;
        ctx!.globalAlpha = (0.6 + pulse * 0.4) * progress;
        ctx!.beginPath();
        ctx!.arc(node.x, node.y, radius, 0, Math.PI * 2);
        ctx!.fill();
      }

      ctx!.globalAlpha = 1;
    }

    // ─── Animation loop ─────────────────────────────────────────
    let gridPoints = generateGrid();
    let nodes = generateNodes();
    const animationPhase = 0; // 0-3
    const phaseProgress = 0;
    const startTime = performance.now();

    // Re-generate on resize
    const debounceResize = () => {
      gridPoints = generateGrid();
      nodes = generateNodes();
    };
    window.addEventListener('resize', debounceResize);

    function loop(timestamp: number) {
      const elapsed = (timestamp - startTime) / 1000;
      const loopProgress = (elapsed % loopDuration) / loopDuration;

      // Phase mapping
      // 0-37.5%: Circuit (phase 0)
      // 37.5-62.5%: Transition (phase 1)
      // 62.5-100%: Neural (phase 2)
      let phase: number;
      let mix: number;

      if (loopProgress < 0.375) {
        phase = 0; // Circuit
        mix = loopProgress / 0.375;
      } else if (loopProgress < 0.625) {
        phase = 1; // Transition
        mix = (loopProgress - 0.375) / 0.25;
      } else {
        phase = 2; // Neural
        mix = (loopProgress - 0.625) / 0.375;
      }

      // Clear
      ctx!.fillStyle = COLORS.bg;
      ctx!.fillRect(0, 0, W(), H());

      // Draw based on phase
      if (phase === 0) {
        // Circuit phase — full circuit, no neural
        drawGrid(gridPoints, 1);
        ctx!.globalAlpha = 1;
      } else if (phase === 1) {
        // Transition — circuit fades out, neural fades in
        const circuitAlpha = 1 - mix;
        const neuralAlpha = mix;

        if (circuitAlpha > 0) {
          drawGrid(gridPoints, circuitAlpha);
        }
        if (neuralAlpha > 0) {
          drawNeuralNetwork(nodes, neuralAlpha, timestamp);
        }
        ctx!.globalAlpha = 1;
      } else {
        // Neural phase — full neural network
        drawNeuralNetwork(nodes, 1, timestamp);
        ctx!.globalAlpha = 1;
      }

      requestAnimationFrame(loop);
    }

    const rafId = requestAnimationFrame(loop);

    // ─── Cleanup ────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener('resize', debounceResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full overflow-hidden"
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* Static SVG fallback for prefers-reduced-motion */}
      <svg
        className="hero-fallback-svg absolute inset-0 w-full h-full"
        style={{ display: 'none' }}
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Background gradient */}
        <rect width="800" height="600" fill="#0A0A0F" />

        {/* Grid pattern */}
        <g opacity="0.15">
          {Array.from({ length: 13 }).map((_, i) => (
            <line
              key={`v${i}`}
              x1={i * 66.7}
              y1={0}
              x2={i * 66.7}
              y2={600}
              stroke="#00D4FF"
              strokeWidth="0.5"
            />
          ))}
          {Array.from({ length: 9 }).map((_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={i * 75}
              x2={800}
              y2={i * 75}
              stroke="#00D4FF"
              strokeWidth="0.5"
            />
          ))}
        </g>

        {/* Circuit traces */}
        <g opacity="0.3">
          <path
            d="M200 150 L400 150 L400 300"
            stroke="#00D4FF"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M500 100 L500 250 L300 250"
            stroke="#00D4FF"
            strokeWidth="2"
            fill="none"
          />
          <path
            d="M600 400 L350 400 L350 200"
            stroke="#00D4FF"
            strokeWidth="2"
            fill="none"
          />
        </g>

        {/* Intersection nodes */}
        <g opacity="0.5">
          <circle cx="400" cy="150" r="3" fill="#00FF88" />
          <circle cx="500" cy="250" r="3" fill="#00FF88" />
          <circle cx="350" cy="400" r="3" fill="#00FF88" />
          <circle cx="200" cy="150" r="2" fill="#00FF88" />
        </g>

        {/* Neural overlay */}
        <g opacity="0.2">
          <path
            d="M120 200 Q250 150 380 220 Q500 280 620 200"
            stroke="#7B61FF"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M180 350 Q320 280 450 350 Q580 400 700 320"
            stroke="#7B61FF"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="380" cy="220" r="4" fill="#7B61FF" />
          <circle cx="620" cy="200" r="4" fill="#7B61FF" />
          <circle cx="450" cy="350" r="4" fill="#7B61FF" />
          <circle cx="180" cy="350" r="3" fill="#7B61FF" />
        </g>

        {/* Center glow */}
        <circle
          cx="400"
          cy="300"
          r="150"
          fill="url(#centerGlow)"
          opacity="0.3"
        />

        <defs>
          <radialGradient id="centerGlow">
            <stop offset="0%" stopColor="#00D4FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#00D4FF" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}
