import { useCallback, useEffect, useRef, useState } from "react";
import { isPlaceholder, type SelectedFile } from "@/lib/files";

export type AlertState = {
  message: string;
  type: "normal" | "error" | "success";
  action?: { label: string; onClick: () => void };
} | null;

// ipcRenderer.invoke prefixes errors with "Error invoking remote method '...': Error:"
const cleanError = (error: unknown): string => {
  const raw = error instanceof Error ? error.message : String(error || "An unknown error occurred.");
  return raw.replace(/^Error invoking remote method '[^']+':\s*(Error:\s*)?/, "");
};

export function useExport(file: SelectedFile | null, outputDir: string) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState("");
  const [lines, setLines] = useState<string[]>([]);
  const [alert, setAlert] = useState<AlertState>(null);
  const cancelled = useRef(false);

  const dismiss = useCallback(() => setAlert(null), []);

  // Live command output -> progress bar and log
  useEffect(() => {
    const api = (window as any).electron;
    if (!api?.onCommandOutput) return;
    const off = api.onCommandOutput((chunk: string) => {
      const parts = String(chunk).split(/\r\n|\r|\n/).map((s) => s.trim()).filter(Boolean);
      const log: string[] = [];
      for (const part of parts) {
        const m = part.match(/(\d{1,3}(?:\.\d+)?)\s*%/);
        if (m) {
          setProgress(Math.min(100, parseFloat(m[1])));
          setStatus(part);
        } else log.push(part);
      }
      if (log.length) setLines((prev) => [...prev, ...log].slice(-300));
    });
    return typeof off === "function" ? off : undefined;
  }, []);

  const run = useCallback(
    async (cmd: string, note?: string) => {
      if (running) return;
      if (!file || isPlaceholder(file)) {
        setAlert({ message: "Select a video first.", type: "error" });
        return;
      }
      cancelled.current = false;
      setAlert({ message: "Exporting…", type: "normal" });
      setRunning(true);
      setProgress(null);
      setStatus("");
      setLines([]);
      let ok = false;
      try {
        const result = await window.electron.runCommand(cmd.split(" "));
        if (typeof result === "string" && result.includes("Process completed successfully with code 0")) {
          ok = true;
          const outPath = result.split("\n")[1]?.trim(); // main.ts puts the written file on line 2
          setAlert({
            message: `${note ? note + "\n" : ""}${outPath ? `Saved to:\n${outPath}` : "File processed successfully!"}`,
            type: "success",
            action: { label: "Open output folder", onClick: () => window.electron.revealPath(outPath || outputDir) },
          });
        } else {
          setAlert({ message: typeof result === "string" ? result : "Unexpected result format.", type: "error" });
        }
      } catch (error: unknown) {
        if (cancelled.current) {
          setStatus("Cancelled");
          setAlert(null);
        } else {
          console.error("Error executing command:", error);
          setAlert({ message: cleanError(error), type: "error" });
        }
      } finally {
        setRunning(false);
        if (ok) {
          setProgress(100);
          setStatus("Finished");
        }
      }
    },
    [running, file, outputDir],
  );

  const cancel = useCallback(() => {
    cancelled.current = true;
    window.electron.cancelCommand();
  }, []);

  return { running, progress, status, lines, alert, setAlert, dismiss, run, cancel };
}
