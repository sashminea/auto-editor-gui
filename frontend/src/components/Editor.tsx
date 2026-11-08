import React, { useEffect, useRef, useState } from "react";
import { VideoIcon, LayoutIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePersisted } from "@/lib/storage";
import { toPreviewUrl, type SelectedFile } from "@/lib/files";
import { fmtTime, type Analysis, type WaveState } from "@/lib/waveform";
import Waveform from "./Waveform";
import ExportBar from "./ExportBar";
import VideoPlayer from "./Videplayer";

/* ───────────────────────── Layout model ─────────────────────────
   The video, the timeline + sliders, and the export bar are ALWAYS on screen.
   The video takes whatever space is left, the timeline panel has a fixed size that
   the user controls (height when it is below the video, width when it is beside it). */

type Dock = "bottom" | "right" | "left";
type Preset = "auto" | "stacked" | "side" | "theater" | "timeline";

interface LayoutPrefs {
  preset: Preset;
  dock?: Dock; // personal overrides on top of the preset
  sizes?: Partial<Record<Dock, number>>; // timeline height (bottom) or panel width (sides), px
}
interface Resolved { dock: Dock; size: number }

const PRESET_INFO: { id: Preset; label: string; hint: string }[] = [
  { id: "auto", label: "Auto", hint: "Picks the best layout for this video's shape" },
  { id: "stacked", label: "Stacked", hint: "Video on top, timeline below. Great for widescreen" },
  { id: "side", label: "Side by side", hint: "Video beside the timeline. Great for vertical video" },
  { id: "theater", label: "Theater", hint: "Biggest possible video, slimmest timeline" },
  { id: "timeline", label: "Precision", hint: "Tall timeline for exact cutting" },
];

const SIZE_OPTIONS: Record<"bottom" | "side", [string, string][]> = {
  bottom: [["80", "Small"], ["128", "Medium"], ["210", "Large"]],
  side: [["300", "Small"], ["400", "Medium"], ["520", "Large"]],
};

const base = (p: Preset, portrait: boolean): Resolved => {
  switch (p) {
    case "stacked": return { dock: "bottom", size: 128 };
    case "side": return { dock: "right", size: 400 };
    case "theater": return { dock: "bottom", size: 80 };
    case "timeline": return { dock: "bottom", size: 210 };
    default: return portrait ? { dock: "right", size: 400 } : { dock: "bottom", size: 128 };
  }
};

const resolve = (prefs: LayoutPrefs, portrait: boolean): Resolved => {
  const b = base(prefs.preset, portrait);
  const dock = prefs.dock ?? b.dock;
  const fallback = dock === b.dock ? b.size : dock === "bottom" ? 128 : 400;
  return { dock, size: prefs.sizes?.[dock] ?? fallback };
};

const isCustom = (p: LayoutPrefs) => p.dock !== undefined || Object.values(p.sizes ?? {}).some((v) => v !== undefined);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ───────────────────────── Helpers ───────────────────────── */

const useSize = (ref: React.RefObject<HTMLElement>) => {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [ref]);
  return size;
};

const Thumb: React.FC<{ dock: Dock; size: number }> = ({ dock, size }) => {
  const pct = dock === "bottom" ? 18 + (size / 210) * 22 : 28 + (size / 520) * 14; // rough share for the picture
  return (
    <span
      aria-hidden
      className={cn(
        "flex h-7 w-10 shrink-0 gap-0.5 rounded-md bg-foreground/[0.06] p-0.5",
        dock === "bottom" ? "flex-col" : dock === "left" ? "flex-row-reverse" : "flex-row",
      )}
    >
      <i className="flex-1 rounded-[3px] bg-primary/80" />
      <i className="rounded-[3px] bg-foreground/20" style={dock === "bottom" ? { height: `${pct}%` } : { width: `${pct}%` }} />
    </span>
  );
};

const Seg: React.FC<{ options: [string, string][]; value: string; onChange: (v: string) => void; label: string }> = ({
  options, value, onChange, label,
}) => (
  <div className="flex flex-wrap gap-1.5" role="group" aria-label={label}>
    {options.map(([v, l]) => (
      <button key={v} type="button" className="chip" aria-pressed={value === v} onClick={() => onChange(v)}>{l}</button>
    ))}
  </div>
);

/* ───────────────────────── Layout picker ───────────────────────── */

interface LayoutMenuProps {
  prefs: LayoutPrefs;
  eff: Resolved;
  size: number;
  portrait: boolean;
  onPreset: (p: Preset) => void;
  onChange: (p: Partial<LayoutPrefs>) => void;
  onSize: (v: number) => void;
  onReset: () => void;
}

const LayoutMenu: React.FC<LayoutMenuProps> = ({ prefs, eff, size, portrait, onPreset, onChange, onSize, onReset }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  const recommended: Preset[] = portrait ? ["side"] : ["stacked", "theater"];
  const custom = isCustom(prefs);

  return (
    <div className="relative" ref={ref}>
      <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="dialog" title="Change layout">
        <LayoutIcon /> Layout{custom && <span className="mono-label text-[10px] text-muted-foreground">· custom</span>}
      </Button>
      {open && (
        <div role="dialog" aria-label="Layout" className="absolute right-0 top-full z-30 mt-2 w-[min(360px,90vw)] rounded-2xl border bg-popover/95 p-3 text-popover-foreground shadow-xl backdrop-blur-xl animate-in fade-in slide-in-from-top-1 duration-150">
          <p className="mono-label px-1 pb-2 text-muted-foreground">Presets</p>
          <div className="grid gap-1">
            {PRESET_INFO.map((p) => {
              const b = base(p.id, portrait);
              const active = prefs.preset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onPreset(p.id)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center gap-3 rounded-xl p-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active && "bg-accent",
                  )}
                >
                  <Thumb dock={b.dock} size={b.size} />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2 text-sm font-medium leading-tight">
                      {p.label}
                      {recommended.includes(p.id) && (
                        <span className="mono-label rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] text-primary">Suggested</span>
                      )}
                    </span>
                    <span className="block text-xs text-muted-foreground">{p.hint}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-3 grid gap-3 border-t pt-3">
            <p className="mono-label px-1 text-muted-foreground">Fine-tune</p>
            <div className="grid gap-1.5 px-1">
              <span className="text-xs text-muted-foreground">Timeline position</span>
              <Seg
                label="Timeline position"
                value={eff.dock}
                onChange={(v) => onChange({ dock: v as Dock })}
                options={[["bottom", "Below"], ["right", "Right"], ["left", "Left"]]}
              />
            </div>
            <div className="grid gap-1.5 px-1">
              <span className="text-xs text-muted-foreground">Timeline size</span>
              <Seg
                label="Timeline size"
                value={String(size)}
                onChange={(v) => onSize(Number(v))}
                options={SIZE_OPTIONS[eff.dock === "bottom" ? "bottom" : "side"]}
              />
            </div>
            <div className="flex items-center justify-between gap-2 px-1">
              <p className="text-xs text-muted-foreground">Drag the divider to resize. Double-click it to reset.</p>
              <Button variant="ghost" size="sm" className="shrink-0" disabled={!custom} onClick={onReset}>Reset</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ───────────────────────── Editor ───────────────────────── */

interface EditorProps {
  file: SelectedFile;
  theme: string;
  wave: WaveState;
  analysis: Analysis | null;
  loudness: number;
  margin: number;
  onLoudness: (v: number) => void;
  onMargin: (v: number) => void;
  thresholdActive: boolean;
  onChangeFile: () => void;
  exportBar: React.ComponentProps<typeof ExportBar>;
}

const MIN_VIDEO = 140; // the video pane never gets squeezed below this

const Editor: React.FC<EditorProps> = ({
  file, theme, wave, analysis, loudness, margin, onLoudness, onMargin, thresholdActive, onChangeFile, exportBar,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const area = useRef<HTMLDivElement>(null);
  const pane = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; size: number } | null>(null);
  const [failed, setFailed] = useState(false);
  const [videoDuration, setVideoDuration] = useState(0);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const [aspect, setAspect] = useState(16 / 9);
  const [resizing, setResizing] = useState(false);
  const [prefs, setPrefs] = usePersisted<LayoutPrefs>("ae.layout", { preset: "auto" });

  useEffect(() => {
    setFailed(false);
    setAspect(16 / 9);
    setDims(null);
  }, [file.path]);

  const portrait = aspect < 0.95;
  const eff = resolve(prefs, portrait);
  const side = eff.dock !== "bottom";

  const areaSize = useSize(area);
  const paneSize = useSize(pane);

  // Panel size limits keep the video (and the controls) on screen at every window size
  const measured = areaSize.w > 0;
  const [lo, hi] = side
    ? [280, measured ? Math.max(280, Math.min(640, areaSize.w - 340)) : 640]
    : [72, measured ? Math.max(72, areaSize.h - 300) : 400];
  const size = clamp(eff.size, lo, hi);

  const setSize = (v: number) =>
    setPrefs((p) => ({ ...p, sizes: { ...p.sizes, [eff.dock]: Math.round(clamp(v, lo, hi)) } }));

  const fit =
    paneSize.w && paneSize.h
      ? paneSize.w / paneSize.h > aspect
        ? { w: paneSize.h * aspect, h: paneSize.h }
        : { w: paneSize.w, h: paneSize.w / aspect }
      : { w: 0, h: 0 };

  // Divider: drag, double-click to reset, arrow keys
  const grows = (dx: number, dy: number) => (eff.dock === "bottom" ? -dy : eff.dock === "right" ? -dx : dx);
  const onDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, size };
    setResizing(true);
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (d) setSize(d.size + grows(e.clientX - d.x, e.clientY - d.y));
  };
  const onUp = () => { drag.current = null; setResizing(false); };
  const onKey = (e: React.KeyboardEvent) => {
    const k = e.key;
    const dir = k === "ArrowUp" ? [0, -1] : k === "ArrowDown" ? [0, 1] : k === "ArrowLeft" ? [-1, 0] : k === "ArrowRight" ? [1, 0] : null;
    if (!dir) return;
    e.preventDefault();
    setSize(size + grows(dir[0] * 16, dir[1] * 16));
  };
  const resetSize = () => setPrefs((p) => ({ ...p, sizes: { ...p.sizes, [eff.dock]: undefined } }));

  const total = wave.data?.duration ?? videoDuration;
  const keptPct = analysis && thresholdActive ? Math.round((analysis.keptSec / analysis.totalSec) * 100) : null;

  const waveHeight = side ? 150 : size; // beside the video the timeline stays a fixed, modest height

  const sliders = (
    <div className={cn("grid gap-4", !side && "sm:grid-cols-2")}>
      <label className="grid gap-1.5">
        <span className="flex items-baseline justify-between">
          <span className="mono-label text-muted-foreground" title="Quieter than this gets cut">Loudness</span>
          <b className="text-sm font-medium tabular-nums">{loudness} dB</b>
        </span>
        <input
          type="range" className="range" min={-50} max={-5} step={1} value={loudness}
          aria-label="Loudness threshold in decibels"
          onChange={(e) => onLoudness(Number(e.target.value))}
          disabled={!thresholdActive}
        />
        {side && <span className="text-xs text-muted-foreground">Quieter than this gets cut.</span>}
      </label>
      <label className="grid gap-1.5">
        <span className="flex items-baseline justify-between">
          <span className="mono-label text-muted-foreground" title="Breathing room kept around loud parts">Margin</span>
          <b className="text-sm font-medium tabular-nums">{+margin.toFixed(2)} s</b>
        </span>
        <input
          type="range" className="range" min={0} max={1} step={0.05} value={margin}
          aria-label="Margin in seconds"
          onChange={(e) => onMargin(Math.round(Number(e.target.value) * 100) / 100)}
        />
        {side && <span className="text-xs text-muted-foreground">Breathing room kept around loud parts.</span>}
      </label>
    </div>
  );

  return (
    <div className="mx-auto flex h-full min-h-[540px] w-full flex-col animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between gap-3 px-3 py-2">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-secondary"><VideoIcon /></span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium leading-tight" title={file.path}>{file.name}</p>
            <p className="mono-label text-muted-foreground">
              {total ? fmtTime(total) : "—"}{dims ? ` · ${dims.w}×${dims.h}` : ""}
            </p>
          </div>
        </div>

        <div className="hidden min-w-0 items-center gap-x-5 text-sm text-muted-foreground md:flex">
          <span>Kept <b className="font-medium text-foreground">{keptPct === null ? "—" : `${keptPct}%`}</b></span>
          <span>Cut <b className="font-medium text-foreground">{keptPct === null ? "—" : `${100 - keptPct}%`}</b></span>
          <span className="whitespace-nowrap">
            New length <b className="font-medium text-foreground">{analysis && thresholdActive ? fmtTime(analysis.keptSec) : "—"}</b>
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <LayoutMenu
            prefs={prefs}
            eff={eff}
            size={size}
            portrait={portrait}
            onPreset={(preset) => setPrefs({ preset })}
            onChange={(p) => setPrefs((cur) => ({ ...cur, ...p }))}
            onSize={setSize}
            onReset={() => setPrefs((cur) => ({ preset: cur.preset }))}
          />
          <Button variant="outline" size="sm" onClick={onChangeFile}>Change video</Button>
        </div>
      </div>

      {/* Work area: video takes the leftover space, the timeline panel has a fixed size */}
      <div
        ref={area}
        className={cn(
          "flex min-h-0 flex-1 px-3 pb-3",
          eff.dock === "bottom" ? "flex-col" : eff.dock === "right" ? "flex-row" : "flex-row-reverse",
          resizing && "select-none",
        )}
      >
        <div
          ref={pane}
          className="relative grid min-h-0 min-w-0 flex-1 place-items-center overflow-hidden rounded-2xl bg-secondary/60"
          style={side ? { minWidth: MIN_VIDEO } : { minHeight: MIN_VIDEO }}
        >
          {fit.w > 0 && (
            <div className="overflow-hidden rounded-2xl bg-black shadow-lg" style={{ width: fit.w, height: fit.h }}>
              <VideoPlayer
                key={file.path}
                src={toPreviewUrl(file.path)}
                videoRef={videoRef}
                analysis={analysis}
                cutsAvailable={thresholdActive}
                onMeta={(w, h, d) => {
                  setVideoDuration(d);
                  if (w && h) { setAspect(w / h); setDims({ w, h }); }
                }}
                onError={() => setFailed(true)}
                failed={failed}
                width={fit.w}
              />
            </div>
          )}
        </div>

        <div
          role="separator"
          tabIndex={0}
          aria-orientation={side ? "vertical" : "horizontal"}
          aria-label="Resize timeline"
          aria-valuemin={lo}
          aria-valuemax={hi}
          aria-valuenow={size}
          title="Drag to resize · double-click to reset"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onDoubleClick={resetSize}
          onKeyDown={onKey}
          className={cn(
            "group relative z-10 flex shrink-0 touch-none items-center justify-center focus-visible:outline-none",
            side ? "w-3 cursor-col-resize" : "h-3 cursor-row-resize",
          )}
        >
          <i
            className={cn(
              "rounded-full bg-foreground/20 transition-colors group-hover:bg-primary group-focus-visible:bg-primary",
              resizing && "bg-primary",
              side ? "h-12 w-1" : "h-1 w-12",
            )}
          />
        </div>

        <div
          className={cn(
            "flex min-h-0 min-w-0 shrink-0 flex-col gap-4 overflow-hidden rounded-2xl border bg-card p-4",
            side && "justify-center overflow-y-auto",
          )}
          style={side ? { width: size } : undefined}
        >
          <div>
            <Waveform
              status={wave.status}
              wave={wave.data}
              analysis={analysis}
              error={wave.error}
              thresholdDb={loudness}
              thresholdActive={thresholdActive}
              onThreshold={onLoudness}
              videoRef={videoRef}
              fallbackDuration={videoDuration}
              theme={theme}
              height={waveHeight}
            />
          </div>
          {sliders}
          {!thresholdActive && (
            <p className="rounded-xl bg-secondary px-3 py-2 text-xs text-muted-foreground">
              Detection is set to a different method in Options, so loudness is ignored.
            </p>
          )}
        </div>
      </div>

      <ExportBar {...exportBar} className="shrink-0" />
    </div>
  );
};

export default Editor;