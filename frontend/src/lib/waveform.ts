import { useEffect, useState } from "react";

export interface Wave {
  fps: number; // loudness values per second
  duration: number; // seconds
  levels: Float32Array; // dB per frame (-80 … 0)
}
export interface WaveState {
  status: "idle" | "loading" | "ready" | "error";
  data: Wave | null;
  error?: string;
}

// What the cut would look like for a given loudness + margin (an estimate of auto-editor's result)
export interface Analysis {
  n: number;
  fps: number;
  loud: Uint8Array; // 1 = loud enough
  keep: Uint8Array; // 1 = kept (loud, or inside the margin)
  keptSec: number;
  totalSec: number;
}

export const fmtTime = (s: number): string => {
  if (!isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const pad = (x: number) => String(x).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
};

export function useWaveform(path: string | undefined): WaveState {
  const [state, setState] = useState<WaveState>({ status: "idle", data: null });

  useEffect(() => {
    if (!path) {
      setState({ status: "idle", data: null });
      return;
    }
    const api = (window as any).electron;
    if (!api?.getWaveform) {
      setState({ status: "error", data: null, error: "Waveform preview isn't connected yet." });
      return;
    }
    let live = true;
    setState({ status: "loading", data: null });
    api
      .getWaveform(path)
      .then((r: any) => {
        if (!live) return;
        if (r?.ok && Array.isArray(r.levels) && r.levels.length) {
          setState({ status: "ready", data: { fps: r.fps, duration: r.duration, levels: Float32Array.from(r.levels) } });
        } else {
          const msg = r?.error === "no-audio" ? "This file has no audio track." : r?.error === "superseded" ? "" : r?.error || "Couldn't read the audio.";
          setState({ status: "error", data: null, error: msg });
        }
      })
      .catch((e: unknown) => live && setState({ status: "error", data: null, error: e instanceof Error ? e.message : String(e) }));
    return () => {
      live = false;
    };
  }, [path]);

  return state;
}

// Runs of `replace` shorter than minLen become `withV`
function removeSmall(a: Uint8Array, minLen: number, replace: number, withV: number) {
  const n = a.length;
  let i = 0;
  while (i < n) {
    if (a[i] !== replace) {
      i++;
      continue;
    }
    let j = i;
    while (j < n && a[j] === replace) j++;
    if (j - i < minLen) a.fill(withV, i, j);
    i = j;
  }
}

export function analyze(w: Wave, thresholdDb: number, marginSec: number): Analysis {
  const n = w.levels.length;
  const loud = new Uint8Array(n);
  for (let i = 0; i < n; i++) loud[i] = w.levels[i] >= thresholdDb ? 1 : 0;
  removeSmall(loud, 3, 1, 0); // tiny blips are dropped
  removeSmall(loud, 6, 0, 1); // tiny gaps are kept
  const m = Math.round(marginSec * w.fps);
  const pre = new Int32Array(n + 1);
  for (let i = 0; i < n; i++) pre[i + 1] = pre[i] + loud[i];
  const keep = new Uint8Array(n);
  let kept = 0;
  for (let i = 0; i < n; i++) {
    const lo = Math.max(0, i - m);
    const hi = Math.min(n, i + m + 1);
    if (pre[hi] - pre[lo] > 0) {
      keep[i] = 1;
      kept++;
    }
  }
  return { n, fps: w.fps, loud, keep, keptSec: kept / w.fps, totalSec: n / w.fps };
}
