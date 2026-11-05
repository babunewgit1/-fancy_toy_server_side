import React from "react";
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { continueRender, delayRender, staticFile } from "remotion";

// Fonts are bundled in video/public/fonts so rendering works offline.
const FONTS: [string, string, string][] = [
  ["Poppins", "Poppins-600.woff2", "600"],
  ["Poppins", "Poppins-800.woff2", "800"],
  ["Hind Siliguri", "HindSiliguri-500-bn.woff2", "500"],
  ["Hind Siliguri", "HindSiliguri-700-bn.woff2", "700"],
  ["JetBrains Mono", "JetBrainsMono-700.woff2", "700"],
];
if (typeof document !== "undefined") {
  const handle = delayRender("Loading local fonts");
  Promise.all(
    FONTS.map(([family, file, weight]) => {
      const face = new FontFace(family, `url(${staticFile(`fonts/${file}`)}) format("woff2")`, { weight });
      document.fonts.add(face);
      return face.load();
    })
  )
    .then(() => continueRender(handle))
    .catch((err) => {
      console.error(err);
      continueRender(handle);
    });
}

const poppins = '"Poppins", sans-serif';
const bangla = '"Hind Siliguri", "Poppins", sans-serif';
const mono = '"JetBrains Mono", monospace';

const FPS = 30;
const s = (sec: number) => Math.round(sec * FPS);

// Scene timeline (seconds)
const SCENES = [
  { from: 0, dur: 4.5 }, // Title
  { from: 4.5, dur: 5 }, // Tech stack
  { from: 9.5, dur: 5.5 }, // Request flow
  { from: 15, dur: 8 }, // Endpoints (CRUD)
  { from: 23, dur: 4.5 }, // Search demo
  { from: 27.5, dur: 2.5 }, // Outro
];
export const TOTAL_FRAMES = s(30);

const C = {
  bg1: "#1a1033",
  bg2: "#0b1d3a",
  pink: "#ff5fa2",
  yellow: "#ffd166",
  mint: "#06d6a0",
  blue: "#4cc9f0",
  purple: "#9b5de5",
  text: "#f8f7ff",
  dim: "#b9b4d6",
  card: "rgba(255,255,255,0.07)",
  border: "rgba(255,255,255,0.14)",
};

const METHOD_COLOR: Record<string, string> = {
  GET: C.mint,
  POST: C.yellow,
  PUT: C.blue,
  DELETE: C.pink,
};

/* ---------- shared pieces ---------- */

const useEnter = (delay = 0, damping = 14) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config: { damping } });
};

const fadeOutAt = (frame: number, dur: number, len = 10) =>
  interpolate(frame, [dur - len, dur], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const bubbles = Array.from({ length: 14 }, (_, i) => i);
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 20% 20%, ${C.bg1}, ${C.bg2} 70%)`,
        overflow: "hidden",
      }}
    >
      {bubbles.map((i) => {
        const size = 40 + ((i * 37) % 120);
        const x = (i * 241) % 1920;
        const speed = 0.6 + (i % 5) * 0.25;
        const y = 1180 - ((frame * speed + i * 160) % 1400);
        const colors = [C.pink, C.yellow, C.mint, C.blue, C.purple];
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: colors[i % colors.length],
              opacity: 0.08,
              filter: "blur(2px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Caption: React.FC<{ text: string; dur: number }> = ({ text, dur }) => {
  const frame = useCurrentFrame();
  const enter = useEnter(8, 18);
  const opacity = Math.min(enter, fadeOutAt(frame, dur));
  return (
    <div
      style={{
        position: "absolute",
        bottom: 70,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        opacity,
        transform: `translateY(${(1 - enter) * 30}px)`,
      }}
    >
      <div
        style={{
          fontFamily: bangla,
          fontWeight: 700,
          fontSize: 46,
          color: C.text,
          background: "rgba(0,0,0,0.45)",
          border: `1px solid ${C.border}`,
          padding: "16px 40px",
          borderRadius: 20,
          maxWidth: 1600,
          textAlign: "center",
        }}
      >
        {text}
      </div>
    </div>
  );
};

const SceneTitle: React.FC<{ kicker: string; title: string; dur: number }> = ({
  kicker,
  title,
  dur,
}) => {
  const frame = useCurrentFrame();
  const enter = useEnter(0, 16);
  return (
    <div
      style={{
        position: "absolute",
        top: 80,
        left: 0,
        right: 0,
        textAlign: "center",
        opacity: Math.min(enter, fadeOutAt(frame, dur)),
        transform: `translateY(${(1 - enter) * -30}px)`,
      }}
    >
      <div
        style={{
          fontFamily: poppins,
          fontWeight: 600,
          fontSize: 28,
          letterSpacing: 6,
          color: C.yellow,
          textTransform: "uppercase",
        }}
      >
        {kicker}
      </div>
      <div
        style={{
          fontFamily: poppins,
          fontWeight: 800,
          fontSize: 72,
          color: C.text,
          marginTop: 6,
        }}
      >
        {title}
      </div>
    </div>
  );
};

const MethodPill: React.FC<{ method: string; size?: number }> = ({
  method,
  size = 30,
}) => (
  <span
    style={{
      fontFamily: mono,
      fontWeight: 700,
      fontSize: size,
      color: "#10101a",
      background: METHOD_COLOR[method],
      padding: `${size * 0.2}px ${size * 0.5}px`,
      borderRadius: size * 0.35,
      minWidth: size * 4,
      display: "inline-block",
      textAlign: "center",
    }}
  >
    {method}
  </span>
);

/* ---------- scene 1: title ---------- */

const ToyBlock: React.FC<{ color: string; delay: number; x: number; rot: number }> = ({
  color,
  delay,
  x,
  rot,
}) => {
  const frame = useCurrentFrame();
  const drop = useEnter(delay, 10);
  const bob = Math.sin((frame + delay * 3) / 12) * 6;
  return (
    <div
      style={{
        width: 120,
        height: 120,
        borderRadius: 24,
        background: color,
        transform: `translate(${x}px, ${(1 - drop) * -500 + bob}px) rotate(${rot * drop}deg)`,
        boxShadow: `0 20px 40px ${color}55`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 64,
      }}
    />
  );
};

const TitleScene: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const t = useEnter(18, 14);
  const sub = useEnter(30, 18);
  const out = fadeOutAt(frame, dur);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: out }}>
      <div style={{ display: "flex", gap: 30, marginBottom: 50 }}>
        <ToyBlock color={C.pink} delay={0} x={0} rot={-8} />
        <ToyBlock color={C.yellow} delay={5} x={0} rot={6} />
        <ToyBlock color={C.mint} delay={10} x={0} rot={-4} />
        <ToyBlock color={C.blue} delay={15} x={0} rot={10} />
      </div>
      <div
        style={{
          fontFamily: poppins,
          fontWeight: 800,
          fontSize: 130,
          color: C.text,
          transform: `scale(${0.7 + 0.3 * t})`,
          opacity: t,
          lineHeight: 1,
        }}
      >
        Fancy <span style={{ color: C.pink }}>Toy</span> Server
      </div>
      <div
        style={{
          fontFamily: bangla,
          fontWeight: 500,
          fontSize: 50,
          color: C.dim,
          marginTop: 30,
          opacity: sub,
          transform: `translateY(${(1 - sub) * 20}px)`,
        }}
      >
        একটি অনলাইন খেলনার দোকানের ব্যাকএন্ড API
      </div>
    </AbsoluteFill>
  );
};

/* ---------- scene 2: stack ---------- */

const STACK = [
  { name: "Node.js", note: "রানটাইম", color: C.mint },
  { name: "Express", note: "API রাউট", color: C.yellow },
  { name: "MongoDB", note: "ডাটাবেস", color: C.blue },
  { name: "Vercel", note: "ডিপ্লয়", color: C.pink },
];

const StackScene: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ opacity: fadeOutAt(frame, dur) }}>
      <SceneTitle kicker="Tech Stack" title="কী দিয়ে বানানো?" dur={dur} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 50 }}>
        {STACK.map((item, i) => {
          const p = spring({ frame: frame - 10 - i * 8, fps, config: { damping: 12 } });
          return (
            <div
              key={item.name}
              style={{
                width: 330,
                height: 330,
                borderRadius: 36,
                background: C.card,
                border: `2px solid ${item.color}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                transform: `translateY(${(1 - p) * 200}px) scale(${p})`,
                opacity: p,
                boxShadow: `0 0 60px ${item.color}33`,
              }}
            >
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  background: item.color,
                  marginBottom: 30,
                }}
              />
              <div style={{ fontFamily: poppins, fontWeight: 800, fontSize: 52, color: C.text }}>
                {item.name}
              </div>
              <div style={{ fontFamily: bangla, fontWeight: 500, fontSize: 38, color: C.dim, marginTop: 8 }}>
                {item.note}
              </div>
            </div>
          );
        })}
      </AbsoluteFill>
      <Caption text="Express সার্ভার MongoDB-র fancytoy ডাটাবেসের সাথে কানেক্ট করে" dur={dur} />
    </AbsoluteFill>
  );
};

/* ---------- scene 3: flow ---------- */

const FlowNode: React.FC<{ label: string; sub: string; color: string; delay: number }> = ({
  label,
  sub,
  color,
  delay,
}) => {
  const p = useEnter(delay, 13);
  return (
    <div
      style={{
        width: 380,
        height: 220,
        borderRadius: 30,
        background: "#1a1838",
        border: `3px solid ${color}`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: `scale(${p})`,
        opacity: p,
      }}
    >
      <div style={{ fontFamily: poppins, fontWeight: 800, fontSize: 50, color }}>{label}</div>
      <div style={{ fontFamily: bangla, fontWeight: 500, fontSize: 34, color: C.dim, marginTop: 8 }}>
        {sub}
      </div>
    </div>
  );
};

const FlowScene: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  // Packet travels: client -> server -> db -> server -> client
  const cycle = 70;
  const t = ((frame - 35) % cycle) / cycle;
  const active = frame > 35;
  // positions of node centres (x), row centre y
  const xs = [-560, 0, 560];
  let x = xs[0];
  let color = C.yellow;
  let label = "request";
  if (t < 0.5) {
    const k = Easing.inOut(Easing.cubic)(t / 0.5);
    x = interpolate(k, [0, 1], [xs[0], xs[2]]);
  } else {
    const k = Easing.inOut(Easing.cubic)((t - 0.5) / 0.5);
    x = interpolate(k, [0, 1], [xs[2], xs[0]]);
    color = C.mint;
    label = "JSON";
  }
  const lineP = interpolate(frame, [15, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ opacity: fadeOutAt(frame, dur) }}>
      <SceneTitle kicker="How it works" title="রিকোয়েস্ট কীভাবে চলে?" dur={dur} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            position: "absolute",
            width: 1120 * lineP,
            height: 6,
            borderRadius: 3,
            background: `linear-gradient(90deg, ${C.yellow}, ${C.purple}, ${C.blue})`,
            opacity: 0.6,
          }}
        />
        <div style={{ display: "flex", gap: 190, alignItems: "center" }}>
          <FlowNode label="Client" sub="React ওয়েবসাইট" color={C.yellow} delay={0} />
          <FlowNode label="Express" sub="port 5000" color={C.purple} delay={8} />
          <FlowNode label="MongoDB" sub="fancytoyproduct" color={C.blue} delay={16} />
        </div>
        {active && (
          <div
            style={{
              position: "absolute",
              transform: `translateX(${x}px) translateY(-150px)`,
              fontFamily: mono,
              fontWeight: 700,
              fontSize: 30,
              color: "#10101a",
              background: color,
              padding: "10px 24px",
              borderRadius: 40,
              boxShadow: `0 0 40px ${color}`,
            }}
          >
            {label}
          </div>
        )}
      </AbsoluteFill>
      <Caption text="ক্লায়েন্ট রিকোয়েস্ট পাঠায় → Express ডাটাবেস থেকে ডাটা এনে JSON রেসপন্স দেয়" dur={dur} />
    </AbsoluteFill>
  );
};

/* ---------- scene 4: endpoints ---------- */

const ROUTES: { method: string; path: string; desc: string }[] = [
  { method: "POST", path: "/addtoy", desc: "নতুন খেলনা যোগ" },
  { method: "GET", path: "/kidstoy", desc: "প্রথম ২০টি খেলনা" },
  { method: "GET", path: "/search/:text", desc: "নাম দিয়ে খোঁজা" },
  { method: "GET", path: "/alltoy/:cata", desc: "ক্যাটাগরি অনুযায়ী" },
  { method: "GET", path: "/toy/:id", desc: "একটি খেলনার ডিটেইলস" },
  { method: "GET", path: "/mytoy/:email", desc: "বিক্রেতার খেলনা, দাম অনুযায়ী সর্ট" },
  { method: "PUT", path: "/update/:id", desc: "দাম, পরিমাণ, বিবরণ আপডেট" },
  { method: "DELETE", path: "/delete/:id", desc: "খেলনা মুছে ফেলা" },
];

const EndpointsScene: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ opacity: fadeOutAt(frame, dur) }}>
      <SceneTitle kicker="8 API Endpoints" title="Create · Read · Update · Delete" dur={dur} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 70 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "22px 40px", width: 1720 }}>
          {ROUTES.map((r, i) => {
            const p = spring({ frame: frame - 12 - i * 9, fps, config: { damping: 15 } });
            return (
              <div
                key={r.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 24,
                  background: C.card,
                  border: `1px solid ${C.border}`,
                  borderLeft: `8px solid ${METHOD_COLOR[r.method]}`,
                  borderRadius: 20,
                  padding: "20px 26px",
                  opacity: p,
                  transform: `translateX(${(1 - p) * (i % 2 === 0 ? -120 : 120)}px)`,
                }}
              >
                <MethodPill method={r.method} size={26} />
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ fontFamily: mono, fontWeight: 700, fontSize: 34, color: C.text }}>{r.path}</div>
                  <div style={{ fontFamily: bangla, fontWeight: 500, fontSize: 28, color: C.dim }}>{r.desc}</div>
                </div>
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

/* ---------- scene 5: search demo ---------- */

const RESPONSE = `[
  { "toy_name": "Racing Car", "price": 25, "sub_cata": "car" },
  { "toy_name": "Police Car",  "price": 18, "sub_cata": "car" }
]`;

const SearchScene: React.FC<{ dur: number }> = ({ dur }) => {
  const frame = useCurrentFrame();
  const urlText = "GET /search/car";
  const typed = Math.floor(interpolate(frame, [10, 40], [0, urlText.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const respChars = Math.floor(interpolate(frame, [55, 105], [0, RESPONSE.length], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  const box = useEnter(0, 16);
  const cursorOn = Math.floor(frame / 8) % 2 === 0;
  return (
    <AbsoluteFill style={{ opacity: fadeOutAt(frame, dur) }}>
      <SceneTitle kicker="Live Example" title="খেলনা খোঁজা" dur={dur} />
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
        <div
          style={{
            width: 1500,
            borderRadius: 26,
            background: "#0d0a1c",
            border: `1px solid ${C.border}`,
            boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
            transform: `scale(${0.9 + 0.1 * box})`,
            opacity: box,
            overflow: "hidden",
          }}
        >
          <div style={{ display: "flex", gap: 12, padding: "18px 24px", background: "rgba(255,255,255,0.05)" }}>
            {[C.pink, C.yellow, C.mint].map((c) => (
              <div key={c} style={{ width: 18, height: 18, borderRadius: "50%", background: c }} />
            ))}
          </div>
          <div style={{ padding: "34px 44px", fontFamily: mono, fontSize: 36, color: C.text, minHeight: 330 }}>
            <div>
              <span style={{ color: C.mint }}>{urlText.slice(0, Math.min(typed, 3))}</span>
              <span>{urlText.slice(3, typed)}</span>
              {typed < urlText.length && cursorOn && <span style={{ color: C.yellow }}>▌</span>}
            </div>
            <pre style={{ fontFamily: mono, fontSize: 32, color: C.yellow, margin: "28px 0 0", whiteSpace: "pre" }}>
              {RESPONSE.slice(0, respChars)}
            </pre>
          </div>
        </div>
      </AbsoluteFill>
      <Caption text="নামের অংশ দিলেই case-insensitive regex দিয়ে মিলে যাওয়া সব খেলনা আসে" dur={dur} />
    </AbsoluteFill>
  );
};

/* ---------- scene 6: outro ---------- */

const OutroScene: React.FC = () => {
  const p = useEnter(0, 12);
  const p2 = useEnter(12, 16);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: poppins, fontWeight: 800, fontSize: 110, color: C.text, transform: `scale(${p})` }}>
        Fancy <span style={{ color: C.pink }}>Toy</span> Server
      </div>
      <div
        style={{
          marginTop: 40,
          fontFamily: mono,
          fontWeight: 700,
          fontSize: 44,
          color: "#10101a",
          background: C.mint,
          padding: "16px 40px",
          borderRadius: 20,
          opacity: p2,
          transform: `translateY(${(1 - p2) * 30}px)`,
        }}
      >
        npm start → localhost:5000
      </div>
    </AbsoluteFill>
  );
};

/* ---------- main ---------- */

export const Explainer: React.FC = () => {
  const comps = [TitleScene, StackScene, FlowScene, EndpointsScene, SearchScene];
  return (
    <AbsoluteFill>
      <Background />
      {SCENES.slice(0, 5).map((sc, i) => {
        const Comp = comps[i];
        return (
          <Sequence key={i} from={s(sc.from)} durationInFrames={s(sc.dur)}>
            <Comp dur={s(sc.dur)} />
          </Sequence>
        );
      })}
      <Sequence from={s(SCENES[5].from)} durationInFrames={s(SCENES[5].dur)}>
        <OutroScene />
      </Sequence>
    </AbsoluteFill>
  );
};
