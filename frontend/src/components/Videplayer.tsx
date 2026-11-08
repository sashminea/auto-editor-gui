import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  PlayIcon, PauseIcon, SpeakerLoudIcon, SpeakerOffIcon, EnterFullScreenIcon, ExitFullScreenIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { fmtTime, type Analysis } from "@/lib/waveform";

interface VideoPlayerProps {
  src: string;
  videoRef: React.RefObject<HTMLVideoElement>;
  analysis: Analysis | null;
  cutsAvailable: boolean; // loudness detection is active, so cut ranges are shown on the scrubber
  onMeta: (width: number, height: number, duration: number) => void;
  onError: () => void;
  failed: boolean;
  width: number; // rendered width, used to drop secondary controls on small players
}

const SPEEDS = [0.5, 1, 1.5, 2];
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

const IconBtn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className, ...p }) => (
  <button
    type="button"
    {...p}
    className={cn(
      "grid h-8 w-8 shrink-0 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-40 [&_svg]:size-4",
      className,
    )}
  />
);

const VideoPlayer: React.FC<VideoPlayerProps> = ({
  src, videoRef, analysis, cutsAvailable, onMeta, onError, failed, width,
}) => {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLSpanElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const hideTimer = useRef<number>();
  const scrubbing = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [rate, setRate] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [active, setActive] = useState(true);

  const narrow = width < 440;

  // Ranges that will be cut, as fractions of the timeline (drawn on the scrubber)
  const cuts = useMemo(() => {
    if (!analysis || !cutsAvailable || !analysis.n) return [] as [number, number][];
    const out: [number, number][] = [];
    let s = -1;
    for (let i = 0; i <= analysis.n; i++) {
      const cut = i < analysis.n && !analysis.keep[i];
      if (cut && s < 0) s = i;
      else if (!cut && s >= 0) { out.push([s / analysis.n, i / analysis.n]); s = -1; }
    }
    return out;
  }, [analysis, cutsAvailable]);

  const toggle = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, [videoRef]);

  const seekBy = (s: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = clamp(v.currentTime + s, 0, v.duration || 0);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else root.current?.requestFullscreen?.();
  };

  useEffect(() => {
    const on = () => setFullscreen(document.fullscreenElement === root.current);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  // Controls fade out a moment after the pointer stops while playing
  const wake = useCallback(() => {
    setActive(true);
    window.clearTimeout(hideTimer.current);
    if (playing && !scrubbing.current) hideTimer.current = window.setTimeout(() => setActive(false), 2500);
  }, [playing]);
  useEffect(() => {
    if (!playing) { window.clearTimeout(hideTimer.current); setActive(true); }
    else wake();
    return () => window.clearTimeout(hideTimer.current);
  }, [playing, wake]);

  // Scrubber + clock follow the video without re-rendering React
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const v = videoRef.current;
      const d = v?.duration || 0;
      if (v && d && isFinite(d)) {
        const p = clamp(v.currentTime / d, 0, 1) * 100;
        if (fill.current) fill.current.style.width = `${p}%`;
        if (knob.current) knob.current.style.left = `${p}%`;
        if (clock.current) clock.current.textContent = `${fmtTime(v.currentTime)} / ${fmtTime(d)}`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [videoRef]);

  const seekTo = (clientX: number) => {
    const el = track.current;
    const v = videoRef.current;
    if (!el || !v || !v.duration) return;
    const r = el.getBoundingClientRect();
    v.currentTime = clamp((clientX - r.left) / r.width, 0, 1) * v.duration;
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.target !== e.currentTarget) return;
    const k = e.key.toLowerCase();
    if (k === " " || k === "k") { e.preventDefault(); toggle(); }
    else if (k === "arrowleft") { e.preventDefault(); seekBy(e.shiftKey ? -1 : -5); }
    else if (k === "arrowright") { e.preventDefault(); seekBy(e.shiftKey ? 1 : 5); }
    else if (k === "m") setMuted((m) => !m);
    else if (k === "f") toggleFullscreen();
  };

  const cycleRate = () => {
    const next = SPEEDS[(SPEEDS.indexOf(rate) + 1) % SPEEDS.length];
    setRate(next);
    if (videoRef.current) videoRef.current.playbackRate = next;
  };

  const showBar = active || !playing;

  return (
    <div
      ref={root}
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerMove={wake}
      onPointerLeave={() => playing && setActive(false)}
      className={cn(
        "group/player relative h-full w-full overflow-hidden bg-black outline-none focus-visible:ring-2 focus-visible:ring-ring",
        playing && !showBar && "cursor-none",
      )}
    >
      <video
        ref={videoRef}
        src={src}
        muted={muted}
        onClick={toggle}
        onDoubleClick={toggleFullscreen}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onError={onError}
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          v.volume = volume;
          onMeta(v.videoWidth, v.videoHeight, v.duration);
        }}
        className="h-full w-full object-contain"
      />

      {!playing && !failed && (
        <button
          type="button"
          onClick={toggle}
          aria-label="Play"
          className="absolute left-1/2 top-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-[#272038] shadow-xl backdrop-blur transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <PlayIcon className="h-5 w-5" />
        </button>
      )}

      {failed && (
        <div className="pointer-events-none absolute inset-x-0 top-1/2 mx-auto w-fit max-w-[90%] -translate-y-1/2 rounded-xl bg-black/80 px-3 py-2 text-center text-xs text-white/80">
          This format can't be previewed here. You can still export it.
        </div>
      )}

      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent px-3 pb-2 pt-10 transition-opacity duration-200",
          showBar ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      >
        {/* Scrubber: bright = played, dark stripes = will be cut */}
        <div
          ref={track}
          className="group/track relative flex h-4 cursor-pointer touch-none items-center"
          onPointerDown={(e) => {
            scrubbing.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            seekTo(e.clientX);
          }}
          onPointerMove={(e) => scrubbing.current && seekTo(e.clientX)}
          onPointerUp={() => { scrubbing.current = false; wake(); }}
        >
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/30 transition-[height] group-hover/track:h-1.5">
            {cuts.map(([a, b], i) => (
              <i key={i} className="absolute inset-y-0 bg-black/65" style={{ left: `${a * 100}%`, width: `${(b - a) * 100}%` }} />
            ))}
            <div ref={fill} className="absolute inset-y-0 left-0 bg-white" style={{ width: 0 }} />
          </div>
          <span ref={knob} className="pointer-events-none absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow" style={{ left: 0 }} />
        </div>

        <div className="mt-1 flex items-center gap-1">
          <IconBtn onClick={toggle} aria-label={playing ? "Pause" : "Play"} title="Play / pause (Space)">
            {playing ? <PauseIcon /> : <PlayIcon />}
          </IconBtn>
          <span ref={clock} className="mono-label min-w-0 truncate px-1 tabular-nums text-white/80">0:00 / 0:00</span>

          <div className="ml-auto flex items-center gap-1">
            {!narrow && (
              <button
                type="button"
                onClick={cycleRate}
                title="Playback speed"
                className="h-7 rounded-full px-2.5 text-xs tabular-nums text-white/85 transition-colors hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                {rate}×
              </button>
            )}
            <IconBtn onClick={() => setMuted((m) => !m)} aria-label={muted ? "Unmute" : "Mute"} title="Mute (M)">
              {muted || volume === 0 ? <SpeakerOffIcon /> : <SpeakerLoudIcon />}
            </IconBtn>
            {!narrow && (
              <input
                type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                aria-label="Volume"
                className="range w-16"
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVolume(val);
                  setMuted(val === 0);
                  if (videoRef.current) videoRef.current.volume = val;
                }}
              />
            )}
            <IconBtn onClick={toggleFullscreen} aria-label="Fullscreen" title="Fullscreen (F)">
              {fullscreen ? <ExitFullScreenIcon /> : <EnterFullScreenIcon />}
            </IconBtn>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;