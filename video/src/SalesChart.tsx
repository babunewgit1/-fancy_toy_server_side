import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

// Fonts are registered in Explainer.tsx (loaded by Root for every composition).
const poppins = '"Poppins", sans-serif';

export type SalesChartProps = {
  title: string;
  values: number[]; // bar heights, any unit — scaled to fit
  growthPercent: number; // number the counter lands on
  tagline: string[]; // lines shown inside the donut
  donut: { value: number; color: string }[];
};

export const salesChartDefaults: SalesChartProps = {
  title: "SALES GROWTH",
  values: [120, 180, 240, 310, 420],
  growthPercent: 250,
  tagline: ["GROW", "WITH", "VIDEO"],
  donut: [
    { value: 30, color: "#ff4f8b" },
    { value: 35, color: "#ffc93c" },
    { value: 35, color: "#3ee0a1" },
  ],
};

const W = 1080;
const H = 1920;
const BASE_Y = 1250; // chart baseline
const CHART_H = 640;
const CHART_X0 = 150;
const CHART_X1 = 930;
const FPS = 30;
const sec = (n: number) => Math.round(n * FPS);

const BG = "#06122b";
const LINE = "#ffe066";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

const lerpColor = (a: string, b: string, t: number) => {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  return `rgb(${pa.map((v, i) => Math.round(v + (pb[i] - v) * t)).join(",")})`;
};

/* ---------- background: perspective grid + particles ---------- */

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const vanishX = W / 2;
  const horizon = BASE_Y;
  const scroll = (frame * 1.2) % 60;
  const hLines = Array.from({ length: 14 }, (_, i) => i);
  const vLines = Array.from({ length: 21 }, (_, i) => i - 10);
  const particles = Array.from({ length: 60 }, (_, i) => i);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(ellipse at 50% 45%, #0e2148 0%, ${BG} 70%)` }}>
      <svg width={W} height={H} style={{ position: "absolute" }}>
        {/* faint back grid */}
        {Array.from({ length: 12 }, (_, i) => (
          <line key={`bx${i}`} x1={i * 100} y1={0} x2={i * 100} y2={horizon} stroke="#1b3466" strokeOpacity={0.25} />
        ))}
        {Array.from({ length: 13 }, (_, i) => (
          <line key={`by${i}`} x1={0} y1={i * 100} x2={W} y2={i * 100} stroke="#1b3466" strokeOpacity={0.25} />
        ))}
        {/* floor grid */}
        {vLines.map((i) => (
          <line
            key={`v${i}`}
            x1={vanishX + i * 50}
            y1={horizon}
            x2={vanishX + i * 260}
            y2={H}
            stroke="#2bd4c4"
            strokeOpacity={0.35}
            strokeWidth={2}
          />
        ))}
        {hLines.map((i) => {
          const t = (i * 60 + scroll) / (hLines.length * 60);
          const y = horizon + Math.pow(t, 2) * (H - horizon);
          return (
            <line key={`h${i}`} x1={0} y1={y} x2={W} y2={y} stroke="#2bd4c4" strokeOpacity={0.12 + t * 0.3} strokeWidth={2} />
          );
        })}
        <line x1={CHART_X0 - 40} y1={horizon} x2={CHART_X1 + 40} y2={horizon} stroke="#9fd8ff" strokeOpacity={0.6} strokeWidth={3} />
        {/* particles */}
        {particles.map((i) => {
          const x = (i * 197) % W;
          const speed = 0.4 + (i % 7) * 0.15;
          const y = H - ((frame * speed * 2 + i * 131) % (H + 100));
          const r = 2 + (i % 4) * 2;
          const tw = 0.3 + 0.4 * Math.abs(Math.sin((frame + i * 13) / 20));
          return <circle key={i} cx={x} cy={y} r={r} fill="#8fd3ff" opacity={tw * 0.6} />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------- main ---------- */

export const SalesChart: React.FC<SalesChartProps> = ({ title, values, growthPercent, tagline, donut }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const n = values.length;
  const max = Math.max(...values);
  const slot = (CHART_X1 - CHART_X0) / n;
  const barW = slot * 0.62;
  const bars = values.map((v, i) => {
    const x = CHART_X0 + slot * i + (slot - barW) / 2;
    const h = (v / max) * CHART_H;
    const color = lerpColor("#9b7bff", "#5ef0a4", n === 1 ? 1 : i / (n - 1));
    return { x, h, color };
  });

  /* phase 1 (0–3s): bars rise */
  const barProgress = bars.map((_, i) =>
    spring({ frame: frame - 6 - i * 9, fps, config: { damping: 11, stiffness: 90 } })
  );

  /* phase 2 (3–6s): line draws, counter counts */
  const lineT = interpolate(frame, [sec(3), sec(5.3)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const points = bars.map((b) => ({ x: b.x + barW / 2, y: BASE_Y - b.h - 60 }));
  const segLens = points.slice(1).map((p, i) => Math.hypot(p.x - points[i].x, p.y - points[i].y));
  const totalLen = segLens.reduce((a, b) => a + b, 0);
  const pathD = points.map((p, i) => `${i ? "L" : "M"}${p.x},${p.y}`).join(" ");
  const drawnLen = totalLen * lineT;
  let acc = 0;
  const dotsVisible = points.map((_, i) => {
    if (i === 0) return lineT > 0;
    acc += segLens[i - 1];
    return drawnLen >= acc - 1;
  });
  const counter = Math.round(
    interpolate(frame, [sec(4.3), sec(5.8)], [0, growthPercent], { ...clamp, easing: Easing.out(Easing.cubic) })
  );
  const counterIn = spring({ frame: frame - sec(4.2), fps, config: { damping: 14 } });

  /* phase 3 (6–10s): zoom out, bars → donut */
  const morph = interpolate(frame, [sec(6), sec(6.8)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const zoom = interpolate(frame, [sec(6), sec(6.8)], [1, 0.82], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const chartOpacity = 1 - morph;
  const donutSweep = interpolate(frame, [sec(6.8), sec(8)], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const donutSpin = interpolate(frame, [sec(6.8), sec(8.2)], [-140, 0], { ...clamp, easing: Easing.out(Easing.cubic) });
  const titleIn = spring({ frame, fps, config: { damping: 15 } });

  const cx = W / 2;
  const cy = 980;
  const R = 300;
  const stroke = 120;
  const circ = 2 * Math.PI * R;
  const total = donut.reduce((a, d) => a + d.value, 0);
  const gap = 6;
  let offset = 0;

  return (
    <AbsoluteFill style={{ backgroundColor: BG }}>
      <Background />

      {/* title */}
      <div
        style={{
          position: "absolute",
          top: 230,
          width: W,
          textAlign: "center",
          fontFamily: poppins,
          fontWeight: 800,
          fontSize: 96,
          letterSpacing: 2,
          color: "white",
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * -40}px)`,
          textShadow: "0 0 30px rgba(120,200,255,0.35)",
        }}
      >
        {title}
      </div>

      {/* chart (bars + line + counter) */}
      <AbsoluteFill
        style={{
          opacity: chartOpacity,
          transform: `scale(${zoom})`,
          transformOrigin: `${W / 2}px ${BASE_Y}px`,
        }}
      >
        <svg width={W} height={H}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="8" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="white" stopOpacity="0.35" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </linearGradient>
            <mask id="reflMask">
              <rect x={0} y={BASE_Y} width={W} height={260} fill="url(#fade)" />
            </mask>
          </defs>

          {/* reflections */}
          <g mask="url(#reflMask)">
            {bars.map((b, i) => {
              const h = b.h * barProgress[i] * (1 - morph);
              return <rect key={i} x={b.x} y={BASE_Y + 4} width={barW} height={Math.max(0, h)} rx={barW / 2} fill={b.color} />;
            })}
          </g>

          {/* bars */}
          {bars.map((b, i) => {
            const h = Math.max(0, b.h * barProgress[i]);
            return (
              <rect
                key={i}
                x={b.x}
                y={BASE_Y - h}
                width={barW}
                height={h}
                rx={Math.min(barW / 2, h / 2)}
                fill={b.color}
                opacity={0.92}
              />
            );
          })}

          {/* line */}
          {lineT > 0 && (
            <path
              d={pathD}
              fill="none"
              stroke={LINE}
              strokeWidth={9}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={totalLen}
              strokeDashoffset={totalLen - drawnLen}
              filter="url(#glow)"
            />
          )}
          {points.map((p, i) =>
            dotsVisible[i] ? (
              <circle key={i} cx={p.x} cy={p.y} r={17} fill={LINE} stroke="#fff8d0" strokeWidth={4} filter="url(#glow)" />
            ) : null
          )}
        </svg>

        {/* counter */}
        <div
          style={{
            position: "absolute",
            left: points[n - 1].x - 260,
            top: points[n - 1].y - 150,
            width: 360,
            textAlign: "right",
            fontFamily: poppins,
            fontWeight: 800,
            fontSize: 92,
            color: "white",
            fontVariantNumeric: "tabular-nums",
            opacity: counterIn,
            transform: `scale(${0.6 + 0.4 * counterIn})`,
            transformOrigin: "right bottom",
            textShadow: `0 0 30px ${LINE}88`,
          }}
        >
          +{counter}%
        </div>
      </AbsoluteFill>

      {/* donut */}
      {donutSweep > 0 && (
        <AbsoluteFill>
          <svg width={W} height={H}>
            <defs>
              <filter id="dglow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="14" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <g transform={`rotate(${-90 + donutSpin} ${cx} ${cy})`} filter="url(#dglow)">
              {donut.map((d, i) => {
                const len = (d.value / total) * circ * donutSweep;
                const el = (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={R}
                    fill="none"
                    stroke={d.color}
                    strokeWidth={stroke}
                    strokeDasharray={`${Math.max(0, len - gap)} ${circ}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += len;
                return el;
              })}
            </g>
            {/* orbit ring */}
            <circle
              cx={cx}
              cy={cy}
              r={R + stroke / 2 + 40}
              fill="none"
              stroke="#5ef0a4"
              strokeOpacity={0.5 * donutSweep}
              strokeWidth={4}
              strokeDasharray={`${circ * 0.35} ${circ}`}
              transform={`rotate(${frame * 1.5} ${cx} ${cy})`}
            />
          </svg>
          {/* tagline */}
          <div
            style={{
              position: "absolute",
              left: cx - 220,
              top: cy - 220,
              width: 440,
              height: 440,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {tagline.map((word, i) => {
              const p = spring({ frame: frame - sec(7.8) - i * 5, fps, config: { damping: 13 } });
              return (
                <div
                  key={word + i}
                  style={{
                    fontFamily: poppins,
                    fontWeight: 800,
                    fontSize: 96,
                    lineHeight: 1.05,
                    color: "white",
                    opacity: p,
                    transform: `translateY(${(1 - p) * 40}px) scale(${0.8 + 0.2 * p})`,
                  }}
                >
                  {word}
                </div>
              );
            })}
          </div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
};
