import React, { useRef } from "react";
import { UploadIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";

// Deterministic bars so the demo strip looks the same every launch
const BARS = Array.from({ length: 56 }, (_, i) => {
  const speech = Math.sin(i / 5) + Math.sin(i / 2.3) * 0.5 > -0.2;
  const r = Math.abs(Math.sin(i * 12.9898) * 43758.5453) % 1;
  return { h: speech ? 22 + r * 62 : 4 + r * 8, cut: !speech };
});

const Hero: React.FC<{ onPick: () => void }> = ({ onPick }) => {
  const frame = useRef<HTMLDivElement>(null);

  // Soft light that follows the cursor, like the site's hero
  const glow = (e: React.PointerEvent) => {
    const el = frame.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <div className="flex h-full min-h-[460px] p-2">
      <div
        ref={frame}
        onPointerMove={glow}
        className="hero-gradient relative flex flex-1 flex-col items-center justify-center gap-5 overflow-hidden rounded-[28px] p-6 text-center text-white animate-in fade-in duration-500"
      >
        <i
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: "radial-gradient(420px circle at var(--mx,50%) var(--my,35%), #ffffff22, transparent 65%)" }}
        />
        <h1 className="relative text-[clamp(34px,6.4vw,72px)] font-medium leading-[0.98] tracking-[-0.05em] text-white">
          Cut the silence.
          <br />
          Keep the story.
        </h1>
        <p className="relative max-w-md text-base text-white/85">Drop in a video. See what gets cut. Export a clean file or a timeline.</p>
        <Button variant="white" size="lg" onClick={onPick} className="relative">
          <UploadIcon /> Select video file
        </Button>
        <p className="mono-label relative text-white/60">or drop a file anywhere · Ctrl+O</p>

        <div
          aria-hidden
          className="relative mt-4 hidden w-[min(680px,92%)] rounded-2xl border border-white/30 bg-white/10 p-4 backdrop-blur-xl sm:block"
        >
          <div className="flex h-[88px] items-center gap-[3px]">
            {BARS.map((b, i) => (
              <i
                key={i}
                className="bar-wave flex-1 rounded-full"
                style={{
                  height: b.cut ? 4 : b.h,
                  background: b.cut ? "rgba(255,255,255,.25)" : "rgba(255,255,255,.9)",
                  animationDelay: `${(i % 14) * -0.18}s`,
                  animationPlayState: b.cut ? "paused" : "running",
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
