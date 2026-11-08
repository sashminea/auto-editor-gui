import React, { useCallback, useEffect, useMemo, useState } from "react";
import TitleBar from "./TitleBar";
import Hero from "./Hero";
import Editor from "./Editor";
import OptionsDrawer from "./OptionsDrawer";
import AlertComponent from "./Alert";
import { useTheme } from "@/lib/theme";
import { usePersisted } from "@/lib/storage";
import { useExport } from "@/lib/useExport";
import { analyze, fmtTime, useWaveform } from "@/lib/waveform";
import { CUTS, DETECTION, OUTPUT, ADVANCED, activeCount, composeEdit, extraArgs, type Extras } from "@/lib/options";
import { fileFromDrop, isPlaceholder, pickVideo, type SelectedFile } from "@/lib/files";

const Layout: React.FC = () => {
  const { theme, toggle } = useTheme();
  const [extras, setExtras] = usePersisted<Extras>("ae.extras", {});
  const [exportAs, setExportAs] = usePersisted<string>("ae.exportAs", "default");
  const [loudness, setLoudness] = usePersisted<number>("ae.loudness", -19);
  const [margin, setMargin] = usePersisted<number>("ae.margin", 0.2);
  const [file, setFile] = useState<SelectedFile | null>(null);
  const [outputDir, setOutputDir] = useState("");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [dragging, setDragging] = useState(false);

  const hasFile = !isPlaceholder(file);
  const exp = useExport(file, outputDir);
  const wave = useWaveform(hasFile ? file!.path : undefined);

  const setOpt = useCallback((flag: string, v: string | boolean) => setExtras((e) => ({ ...e, [flag]: v })), [setExtras]);
  const patch = useCallback((p: Extras) => setExtras((e) => ({ ...e, ...p })), [setExtras]);
  const reset = useCallback(
    (flags: string[]) =>
      setExtras((e) => {
        const next = { ...e };
        flags.forEach((f) => delete next[f]);
        return next;
      }),
    [setExtras],
  );

  // First launch checks: output folder, and whether Python + auto_editor can actually run
  useEffect(() => {
    (async () => {
      try { setOutputDir(await window.electron.getOutputDir()); } catch (e) { console.error(e); }
      try {
        const runtime = await window.electron.checkRuntime();
        if (!runtime.ok) exp.setAlert({ message: runtime.detail, type: "error" });
      } catch (e) { console.error(e); }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chooseOutput = useCallback(async () => {
    const dir = await window.electron.chooseOutputDir();
    if (dir) setOutputDir(dir);
  }, []);
  const revealOutput = useCallback(() => { window.electron.revealPath(outputDir); }, [outputDir]);

  const pick = useCallback(async () => {
    const picked = await pickVideo();
    if (picked) setFile(picked);
  }, []);

  // A file dropped anywhere loads it; it must never replace the whole app with the video
  useEffect(() => {
    const stop = (e: DragEvent) => e.preventDefault();
    document.addEventListener("dragover", stop);
    document.addEventListener("drop", stop);
    return () => {
      document.removeEventListener("dragover", stop);
      document.removeEventListener("drop", stop);
    };
  }, []);

  // The command always matches the screen, so there is no "Apply" step
  const command = useMemo(() => {
    const input = hasFile ? file!.path : "example.mp4";
    return [
      `auto_editor "${input}"`,
      `--export ${exportAs}`,
      `--edit ${composeEdit(extras, loudness)}`,
      `--margin ${margin}s`,
      ...extraArgs(extras),
    ].join(" ");
  }, [hasFile, file, exportAs, extras, loudness, margin]);

  const thresholdActive = !["motion", "none", "all/e"].includes(String(extras["detect.method"] ?? ""));
  const analysis = useMemo(() => (wave.data ? analyze(wave.data, loudness, margin) : null), [wave.data, loudness, margin]);

  const doExport = useCallback(() => {
    if (!hasFile || exp.running) return;
    const removed = analysis && thresholdActive ? analysis.totalSec - analysis.keptSec : 0;
    exp.run(command, removed >= 1 ? `Removed about ${fmtTime(removed)} of silence.` : undefined);
  }, [hasFile, exp, analysis, thresholdActive, command]);

  // Keyboard: Ctrl/Cmd+O open, Ctrl/Cmd+Enter export, Ctrl/Cmd+, options
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === "o") { e.preventDefault(); pick(); }
      else if (e.key === "Enter") { e.preventDefault(); doExport(); }
      else if (e.key === ",") { e.preventDefault(); setOptionsOpen((o) => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pick, doExport]);

  const optionsCount = useMemo(
    () => activeCount(CUTS, extras) + activeCount(DETECTION, extras) + activeCount(OUTPUT, extras) + activeCount(ADVANCED, extras),
    [extras],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped || !/^(video|audio)\//.test(dropped.type)) return;
    const selected = fileFromDrop(dropped);
    if (selected) setFile(selected);
  };

  return (
    <div
      className="relative flex h-screen flex-col bg-background text-foreground"
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={(e) => { if (e.currentTarget === e.target) setDragging(false); }}
      onDrop={onDrop}
    >
      <TitleBar theme={theme} onToggleTheme={toggle} onOpenOptions={() => setOptionsOpen(true)} optionsCount={optionsCount}
        onHome={hasFile && !exp.running ? () => setFile(null) : undefined} />

      <main className="min-h-0 flex-1 overflow-y-auto">
        {hasFile ? (
          <Editor
            file={file!}
            theme={theme}
            wave={wave}
            analysis={analysis}
            loudness={loudness}
            margin={margin}
            onLoudness={setLoudness}
            onMargin={setMargin}
            thresholdActive={thresholdActive}
            onChangeFile={pick}
            exportBar={{
              exportAs, onExportAs: setExportAs, command,
              running: exp.running, progress: exp.progress, status: exp.status, lines: exp.lines,
              outputDir, onExport: doExport, onCancel: exp.cancel,
              onChooseOutput: chooseOutput, onRevealOutput: revealOutput,
            }}
          />
        ) : (
          <Hero onPick={pick} />
        )}
      </main>

      {optionsOpen && (
        <OptionsDrawer extras={extras} onChange={setOpt} onReset={reset} onPatch={patch} onClose={() => setOptionsOpen(false)} />
      )}
      {exp.alert && <AlertComponent type={exp.alert.type} message={exp.alert.message} action={exp.alert.action} onDismiss={exp.dismiss} />}

      {dragging && (
        <div className="hero-gradient pointer-events-none absolute inset-2 z-50 grid place-items-center rounded-[28px] text-3xl font-medium tracking-tight text-white animate-in fade-in duration-150">
          Drop to load this file
        </div>
      )}
    </div>
  );
};

export default Layout;