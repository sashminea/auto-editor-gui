import React, { useEffect, useRef, useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ConsolePanelProps {
  running: boolean;
  progress: number | null; // 0-100, null when unknown
  status: string; // latest progress line from auto-editor
  lines: string[];
}

const ConsolePanel: React.FC<ConsolePanelProps> = ({ running, progress, status, lines }) => {
  const [open, setOpen] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (running) setOpen(true); }, [running]);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [lines, open]);

  const showBar = running || progress !== null;
  const pct = progress ?? 0;

  return (
    <Card className="shrink-0 rounded-md shadow-none">
      <CardHeader className="flex-row items-center justify-between space-y-0 px-4 py-2">
        <CardTitle className="text-sm">Progress</CardTitle>
        <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? <ChevronUpIcon /> : <ChevronDownIcon />} {open ? "Hide output" : "Show output"}
        </Button>
      </CardHeader>
      <CardContent className="grid gap-2 px-4 pb-4 pt-0">
        {showBar ? (
          <div className="grid gap-1.5">
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress ?? undefined}
            >
              <div
                className={cn("h-full rounded-full bg-primary transition-[width] duration-300", progress === null && "w-2/5 animate-pulse")}
                style={progress !== null ? { width: `${pct}%` } : undefined}
              />
            </div>
            <p className="flex justify-between text-xs text-muted-foreground">
              <span className="truncate">{status || (running ? "Starting…" : "Finished")}</span>
              {progress !== null && <span className="tabular-nums">{Math.round(pct)}%</span>}
            </p>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Export progress appears here once you press Export.</p>
        )}

        {open && (
          <div
            ref={logRef}
            className="h-32 overflow-auto rounded-md border bg-background p-3 font-mono text-xs leading-relaxed text-muted-foreground"
          >
            {lines.length ? lines.map((l, i) => <div key={i} className="whitespace-pre-wrap break-all">{l}</div>) : "No output yet."}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConsolePanel;