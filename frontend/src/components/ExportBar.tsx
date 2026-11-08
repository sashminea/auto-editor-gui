import React, { useEffect, useRef, useState } from "react";
import { DownloadIcon, OpenInNewWindowIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CommandDisplay from "./CommandDisplay";

const EXPORTS: [string, string][] = [
  ["default", "Video file"],
  ["clip-sequence", "Clips"],
  ["premiere", "Premiere Pro"],
  ["resolve-fcp7", "Resolve"],
  ["final-cut-pro", "Final Cut Pro"],
  ["shotcut", "Shotcut"],
];

interface ExportBarProps {
  exportAs: string;
  onExportAs: (v: string) => void;
  command: string;
  running: boolean;
  progress: number | null;
  status: string;
  lines: string[];
  outputDir: string;
  onExport: () => void;
  onCancel: () => void;
  onChooseOutput: () => void;
  onRevealOutput: () => void;
  className?: string;
}

// Two slim rows (format + folder, then command + action). The output log floats above it
// instead of growing the bar, so the video and sliders never get pushed off screen.
const ExportBar: React.FC<ExportBarProps> = ({
  exportAs, onExportAs, command, running, progress, status, lines, outputDir, onExport, onCancel, onChooseOutput, onRevealOutput, className,
}) => {
  const [showLog, setShowLog] = useState(false);
  const log = useRef<HTMLDivElement>(null);
  useEffect(() => {
    log.current?.scrollTo({ top: log.current.scrollHeight });
  }, [lines, showLog]);
  useEffect(() => { if (!running) setShowLog(false); }, [running]);

  return (
    <div className={cn("relative grid gap-2 border-t bg-background/90 px-3 py-2 backdrop-blur-xl", className)}>
      {running && showLog && (
        <div
          ref={log}
          className="absolute inset-x-3 bottom-full z-20 mb-2 h-40 overflow-auto rounded-xl bg-[#15101f] p-4 font-mono text-xs leading-relaxed text-white/70 shadow-xl animate-in fade-in slide-in-from-bottom-1 duration-150"
        >
          {lines.length ? lines.map((l, i) => <div key={i} className="whitespace-pre-wrap break-all">{l}</div>) : "No output yet."}
        </div>
      )}

      <div className="flex items-center gap-3">
        <div
          className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto [scrollbar-width:none]"
          role="group"
          aria-label="Export as"
        >
          <span className="mono-label mr-1 shrink-0 text-muted-foreground">Export as</span>
          {EXPORTS.map(([value, label]) => (
            <button key={value} type="button" className="chip shrink-0" aria-pressed={exportAs === value} onClick={() => onExportAs(value)} disabled={running}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex min-w-0 max-w-[42%] shrink items-center gap-0.5 text-xs text-muted-foreground">
          <p className="min-w-0 truncate" title={outputDir}>Saves to {outputDir || "…"}</p>
          <Button variant="ghost" size="sm" className="h-7 shrink-0 px-2" onClick={onChooseOutput} disabled={running}>Change</Button>
          <Button variant="ghost" size="sm" className="h-7 shrink-0 px-2" onClick={onRevealOutput} disabled={!outputDir} aria-label="Open output folder" title="Open output folder">
            <OpenInNewWindowIcon />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {running ? (
          <>
            <div className="grid min-w-0 flex-1 gap-1">
              <div className="h-2 w-full overflow-hidden rounded-full bg-foreground/[0.08]" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress ?? undefined}>
                <div
                  className={cn("h-full rounded-full bg-primary transition-[width] duration-300", progress === null && "w-2/5 animate-pulse")}
                  style={progress !== null ? { width: `${progress}%` } : undefined}
                />
              </div>
              <p className="flex justify-between gap-3 text-xs text-muted-foreground">
                <span className="truncate">{status || "Starting…"}</span>
                <span className="flex shrink-0 items-center gap-3">
                  <button type="button" className="underline-offset-2 hover:underline" onClick={() => setShowLog((s) => !s)}>
                    {showLog ? "Hide output" : "Show output"}
                  </button>
                  {progress !== null && <span className="tabular-nums">{Math.round(progress)}%</span>}
                </span>
              </p>
            </div>
            <Button variant="destructive" onClick={onCancel}>Cancel</Button>
          </>
        ) : (
          <>
            <div className="min-w-0 flex-1"><CommandDisplay command={command} /></div>
            <Button onClick={onExport} title="Ctrl+Enter">
              <DownloadIcon /> Export
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ExportBar;