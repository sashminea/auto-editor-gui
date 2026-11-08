import React, { useEffect, useMemo, useRef, useState } from "react";
import { fmtTime, type Analysis, type Wave } from "@/lib/waveform";

const H_DEFAULT = 176; // px
const DB_FLOOR = 60; // the waveform shows -60 dB … 0 dB
const PAD = 8;

interface WaveformProps {
  status: "idle" | "loading" | "ready" | "error";
  wave: Wave | null;
  analysis: Analysis | null;
  error?: string;
  thresholdDb: number;
  thresholdActive: boolean;
  onThreshold: (db: number) => void;
  videoRef: React.RefObject<HTMLVideoElement>;
  fallbackDuration: number;
  height?: number; // px, timeline height
  theme: string; // only here so the canvas repaints when the theme flips
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const frac = (db: number) => clamp((db + DB_FLOOR) / DB_FLOOR, 0.02, 1);

const Waveform: React.FC<WaveformProps> = ({
  status, wave, analysis, error, thresholdDb, thresholdActive, onThreshold, videoRef, fallbackDuration, theme, height = H_DEFAULT,
}) => {
  const H = height;
  const wrap = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const head = useRef<HTMLDivElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const [width, setWidth] = useState(0);
  const seeking = useRef(false);
  const dragging = useRef<1 | -1 | 0>(0);

  const duration = wave?.duration ?? fallbackDuration;
  const bars = width ? Math.max(24, Math.floor(width / 5)) : 0;

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Loudest point inside each bar's slice of the timeline
  const peaks = useMemo(() => {
    if (!wave || !bars) return null;
    const n = wave.levels.length;
    const out = new Float32Array(bars);
    for (let b = 0; b < bars; b++) {
      const lo = Math.floor((b * n) / bars);
      const hi = Math.max(lo + 1, Math.floor(((b + 1) * n) / bars));
      let m = -80;
      for (let i = lo; i < hi && i < n; i++) if (wave.levels[i] > m) m = wave.levels[i];
      out[b] = m;
    }
    return out;
  }, [wave, bars]);

  // Bars: violet = kept, ink = added by the margin, faint = cut (same language as the site)
  useEffect(() => {
    const cv = canvas.current;
    if (!cv || !peaks || !wave) return;
    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(width * dpr);
    cv.height = Math.round(H * dpr);
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, H);
    const css = getComputedStyle(document.documentElement);
    const v = (name: string) => css.getPropertyValue(name).trim();
    const violet = `hsl(${v("--primary")})`;
    const ink = (a: number) => `hsl(${v("--foreground")} / ${a})`;
    const n = wave.levels.length;
    const step = width / bars;
    const bw = Math.max(2, step * 0.64);
    for (let b = 0; b < bars; b++) {
      const lo = Math.floor((b * n) / bars);
      const hi = Math.max(lo + 1, Math.floor(((b + 1) * n) / bars));
      let color = ink(0.42);
      if (analysis && thresholdActive) {
        let anyLoud = false;
        let anyKeep = false;
        for (let i = lo; i < hi && i < n; i++) {
          if (analysis.loud[i]) anyLoud = true;
          if (analysis.keep[i]) anyKeep = true;
        }
        color = anyLoud ? violet : anyKeep ? ink(0.4) : ink(0.14);
      }
      const hh = Math.max(4, frac(peaks[b]) * (H - PAD));
      const x = b * step + (step - bw) / 2;
      const y = (H - hh) / 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      if ((ctx as any).roundRect) (ctx as any).roundRect(x, y, bw, hh, bw / 2);
      else ctx.rect(x, y, bw, hh);
      ctx.fill();
    }
  }, [peaks, analysis, thresholdActive, width, bars, wave, theme, H]);

  // Playhead + clock follow the video without re-rendering React
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      const d = duration || v?.duration || 0;
      if (v && d && head.current) {
        head.current.style.left = `${clamp(v.currentTime / d, 0, 1) * 100}%`;
        if (clock.current) clock.current.textContent = `${fmtTime(v.currentTime)} / ${fmtTime(d)}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [videoRef, duration]);

  const seekTo = (clientX: number) => {
    const el = wrap.current;
    const v = videoRef.current;
    const d = duration || v?.duration || 0;
    if (!el || !v || !d) return;
    const r = el.getBoundingClientRect();
    v.currentTime = clamp((clientX - r.left) / r.width, 0, 1) * d;
  };

  const dbFromY = (clientY: number, side: 1 | -1) => {
    const r = wrap.current!.getBoundingClientRect();
    const y = clientY - r.top;
    const f = side === 1 ? (H / 2 - y) / ((H - PAD) / 2) : (y - H / 2) / ((H - PAD) / 2);
    return Math.round(clamp(f * DB_FLOOR - DB_FLOOR, -50, -5));
  };

  const grip = (side: 1 | -1) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.stopPropagation();
      e.currentTarget.setPointerCapture(e.pointerId);
      dragging.current = side;
    },
    onPointerMove: (e: React.PointerEvent) => {
      if (dragging.current === side) onThreshold(dbFromY(e.clientY, side));
    },
    onPointerUp: () => {
      dragging.current = 0;
    },
  });

  const lineY = H / 2 - (frac(thresholdDb) * (H - PAD)) / 2;
  const showLines = status === "ready" && thresholdActive;

  return (
    <div className="grid gap-2">
      <div
        ref={wrap}
        className="relative touch-none select-none overflow-hidden rounded-xl bg-secondary/70"
        style={{ height: H }}
        onPointerDown={(e) => {
          if (status !== "ready") return;
          seeking.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          seekTo(e.clientX);
        }}
        onPointerMove={(e) => seeking.current && seekTo(e.clientX)}
        onPointerUp={() => (seeking.current = false)}
      >
        {status === "ready" && <canvas ref={canvas} className="absolute inset-0 h-full w-full" />}

        {status === "loading" && (
          <>
            <div className="absolute inset-0 flex items-center gap-[3px] px-3" aria-hidden>
              {Array.from({ length: 96 }, (_, i) => (
                <i
                  key={i}
                  className="bar-wave flex-1 rounded-full bg-foreground/15"
                  style={{ height: 14 + ((Math.abs(Math.sin(i * 7.7)) * 70) | 0), animationDelay: `${(i % 16) * -0.12}s` }}
                />
              ))}
            </div>
            <p className="mono-label absolute inset-0 grid place-items-center text-muted-foreground">Listening to your audio…</p>
          </>
        )}

        {status === "error" && (
          <div className="absolute inset-0 grid place-items-center p-6 text-center">
            <div className="grid gap-1">
              <p className="text-sm font-medium">No waveform for this file</p>
              <p className="text-xs text-muted-foreground">{error || "You can still export it."}</p>
            </div>
          </div>
        )}

        {showLines && (
          <>
            {([1, -1] as const).map((side) => {
              const y = side === 1 ? lineY : H - lineY;
              return (
                <div key={side} className="absolute inset-x-0" style={{ top: y }}>
                  <div className="absolute inset-x-0 border-t border-dashed border-foreground/45" />
                  <div
                    {...grip(side)}
                    className="absolute inset-x-0 flex h-6 -translate-y-1/2 cursor-ns-resize items-center justify-end pr-2"
                    title="Drag to set the loudness"
                  >
                    {side === 1 && (
                      <span className="mono-label rounded-full bg-foreground px-2 py-1 text-background">{thresholdDb} dB</span>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        )}

        <div ref={head} className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-foreground" style={{ left: 0 }}>
          <span className="absolute -top-0.5 left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-foreground" />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-muted-foreground">
        <span ref={clock} className="mono-label tabular-nums">0:00 / {fmtTime(duration)}</span>
        {thresholdActive && (
          <span className="mono-label flex items-center gap-3">
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-primary" />Kept</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-foreground/40" />Margin</span>
            <span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-foreground/15" />Cut</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default Waveform;