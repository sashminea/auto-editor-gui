import React, { useState, useEffect, useCallback, useMemo } from 'react';
import TitleBar from './TitleBar';
import Sidebar from './Sidebar';
import ExportXML from './ExportXML';
import CommandDisplay from './CommandDisplay';
import ConsolePanel from './Consolepanel';
import VideoPreview from './VideoPreview';
import AlertComponent from './Alert';
import OptionsPage from './OptionsPage';
import RunBar from './RunBar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useTheme } from '@/lib/theme';
import { usePersisted } from '@/lib/storage';
import { cn } from '@/lib/utils';
import {
  PAGES, CUTS, DETECTION, OUTPUT, ADVANCED, activeCount,
  type Extras, type OptionDef, type PageId,
} from '@/lib/options';
import { isPlaceholder, pickVideo, type SelectedFile } from '@/lib/files';

type AlertState = {
  message: string;
  type: 'normal' | 'error' | 'success' | null;
  action?: { label: string; onClick: () => void };
} | null;

// ipcRenderer.invoke prefixes errors with "Error invoking remote method '...': Error:"
const cleanError = (error: unknown): string => {
  const raw = error instanceof Error ? error.message : String(error || 'An unknown error occurred.');
  return raw.replace(/^Error invoking remote method '[^']+':\s*(Error:\s*)?/, '');
};

const Layout: React.FC = () => {
  const { theme, toggle } = useTheme();
  const [page, setPage] = usePersisted<PageId>('ae.page', 'quick');
  const [extras, setExtras] = usePersisted<Extras>('ae.extras', {});
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [command, setCommand] = useState<string>('');
  const [outputDir, setOutputDir] = useState<string>('');
  const [alert, setAlert] = useState<AlertState>(null);

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState('');
  const [lines, setLines] = useState<string[]>([]);
  const cancelledRef = React.useRef(false);

  const dismissAlert = useCallback(() => setAlert(null), []);

  const setOpt = useCallback((flag: string, v: string | boolean) => setExtras((e) => ({ ...e, [flag]: v })), [setExtras]);
  const patch = useCallback((p: Extras) => setExtras((e) => ({ ...e, ...p })), [setExtras]);
  const reset = useCallback((flags: string[]) => setExtras((e) => {
    const next = { ...e };
    flags.forEach((f) => delete next[f]);
    return next;
  }), [setExtras]);

  // First launch checks: output folder, and whether Python + auto_editor can actually run
  useEffect(() => {
    (async () => {
      try { setOutputDir(await window.electron.getOutputDir()); } catch (e) { console.error(e); }
      try {
        const runtime = await window.electron.checkRuntime();
        if (!runtime.ok) setAlert({ message: runtime.detail, type: 'error' });
      } catch (e) { console.error(e); }
    })();
  }, []);

  const chooseOutput = useCallback(async () => {
    const dir = await window.electron.chooseOutputDir();
    if (dir) setOutputDir(dir);
  }, []);
  const revealOutput = useCallback(() => { window.electron.revealPath(outputDir); }, [outputDir]);

  // A file dropped outside the preview must not replace the whole app with the video
  useEffect(() => {
    const stop = (e: DragEvent) => e.preventDefault();
    document.addEventListener('dragover', stop);
    document.addEventListener('drop', stop);
    return () => {
      document.removeEventListener('dragover', stop);
      document.removeEventListener('drop', stop);
    };
  }, []);

  // Live command output -> progress bar and log
  useEffect(() => {
    const api = (window as any).electron;
    if (!api?.onCommandOutput) return;
    const off = api.onCommandOutput((chunk: string) => {
      const parts = String(chunk).split(/\r\n|\r|\n/).map((s) => s.trim()).filter(Boolean);
      const logLines: string[] = [];
      for (const part of parts) {
        const m = part.match(/(\d{1,3}(?:\.\d+)?)\s*%/);
        if (m) {
          setProgress(Math.min(100, parseFloat(m[1])));
          setStatus(part);
        } else {
          logLines.push(part);
        }
      }
      if (logLines.length) setLines((prev) => [...prev, ...logLines].slice(-300));
    });
    return typeof off === 'function' ? off : undefined;
  }, []);

  const onRunStart = useCallback(() => {
    setRunning(true);
    setProgress(null);
    setStatus('');
    setLines([]);
  }, []);

  const onRunEnd = useCallback((ok: boolean) => {
    setRunning(false);
    if (ok) {
      setProgress(100);
      setStatus('Finished');
    }
  }, []);

  const runCommand = useCallback(async (cmd: string) => {
    if (running) return;
    if (!selectedFile || isPlaceholder(selectedFile)) {
      setAlert({ message: 'Select a video first.', type: 'error' });
      return;
    }
    cancelledRef.current = false;
    setAlert({ message: 'Exporting video...', type: 'normal' });
    onRunStart();
    let ok = false;
    try {
      const result = await window.electron.runCommand(cmd.split(' '));
      if (typeof result === 'string' && result.includes('Process completed successfully with code 0')) {
        ok = true;
        const outPath = result.split('\n')[1]?.trim(); // main.ts puts the written file on line 2
        setAlert({
          message: outPath ? `Saved to:\n${outPath}` : 'File processed successfully!',
          type: 'success',
          action: { label: 'Open output folder', onClick: () => { window.electron.revealPath(outPath || outputDir); } },
        });
      } else {
        setAlert({ message: typeof result === 'string' ? result : 'Unexpected result format.', type: 'error' });
      }
    } catch (error: unknown) {
      if (cancelledRef.current) {
        setStatus('Cancelled');
        setAlert(null);
      } else {
        console.error('Error executing command:', error);
        setAlert({ message: cleanError(error), type: 'error' });
      }
    } finally {
      onRunEnd(ok);
    }
  }, [running, selectedFile, outputDir, onRunStart, onRunEnd]);

  const cancelRun = useCallback(() => {
    cancelledRef.current = true;
    window.electron.cancelCommand();
  }, []);

  const hasFile = !isPlaceholder(selectedFile);

  // Keyboard shortcuts: Ctrl/Cmd+O open, Ctrl/Cmd+Enter export, Ctrl/Cmd+1..5 switch page
  useEffect(() => {
    const onKey = async (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key.toLowerCase() === 'o') {
        e.preventDefault();
        const picked = await pickVideo();
        if (picked) setSelectedFile(picked);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (hasFile && !running) runCommand(command);
      } else if (/^[1-5]$/.test(e.key)) {
        e.preventDefault();
        setPage(PAGES[Number(e.key) - 1].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [hasFile, running, command, runCommand, setPage]);

  const counts = useMemo(() => ({
    cuts: activeCount(CUTS, extras),
    detection: activeCount(DETECTION, extras),
    output: activeCount(OUTPUT, extras),
    advanced: activeCount(ADVANCED, extras),
  }), [extras]);

  // The motion threshold only matters for the motion methods
  const detectionDefs: OptionDef[] = useMemo(
    () => DETECTION.filter((d) => d.flag !== 'detect.motion' || /motion/.test(String(extras['detect.method'] ?? ''))),
    [extras],
  );

  const runBar = (
    <RunBar
      command={command}
      file={selectedFile}
      running={running}
      progress={progress}
      status={status}
      lines={lines}
      onExport={() => runCommand(command)}
      onCancel={cancelRun}
      onGoQuick={() => setPage('quick')}
    />
  );

  // Pages stay mounted (just hidden) so Quick Edit keeps its values and the video keeps its place
  const frame = (id: PageId, body: React.ReactNode) => (
    <div className={cn('min-h-0 flex-1 flex-col', page === id ? 'flex' : 'hidden')}>
      {body}
      {runBar}
    </div>
  );
  const meta = (id: PageId) => PAGES.find((p) => p.id === id)!;

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TitleBar theme={theme} onToggleTheme={toggle} />

      <div className="flex min-h-0 flex-1">
        <Sidebar page={page} onChange={setPage} counts={counts} />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <main className={cn('min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2 lg:flex-row lg:overflow-hidden', page === 'quick' ? 'flex' : 'hidden')}>
            <section className="flex min-w-0 flex-1 flex-col gap-2 lg:min-h-0">
              <VideoPreview file={selectedFile} onFileSelect={setSelectedFile} />
              <CommandDisplay command={command} />
              <ConsolePanel running={running} progress={progress} status={status} lines={lines} />
            </section>
            <aside className="w-full shrink-0 lg:w-[340px] lg:overflow-y-auto">
              <ExportXML
                selectedFile={selectedFile}
                onFileSelect={setSelectedFile}
                onCommandChange={setCommand}
                extras={extras}
                running={running}
                onRun={runCommand}
                onCancel={cancelRun}
                outputDir={outputDir}
                onChooseOutput={chooseOutput}
                onRevealOutput={revealOutput}
              />
            </aside>
          </main>

          {frame('cuts',
            <OptionsPage title={meta('cuts').title} blurb={meta('cuts').blurb} defs={CUTS} values={extras} onChange={setOpt} onReset={reset}>
              <Card className="rounded-md shadow-none">
                <CardContent className="flex items-center justify-between gap-3 p-4">
                  <p className="text-sm text-muted-foreground">Want to see what gets removed? Keep only the cut parts instead.</p>
                  <Button variant="outline" size="sm" className="shrink-0" onClick={() => patch({ '--video-speed': '99999', '--silent-speed': '1' })}>
                    Show the cut parts
                  </Button>
                </CardContent>
              </Card>
            </OptionsPage>
          )}

          {frame('detection',
            <OptionsPage title={meta('detection').title} blurb={meta('detection').blurb} defs={detectionDefs} values={extras} onChange={setOpt} onReset={() => reset(DETECTION.map((d) => d.flag))} />
          )}

          {frame('output',
            <OptionsPage title={meta('output').title} blurb={meta('output').blurb} defs={OUTPUT} values={extras} onChange={setOpt} onReset={reset} />
          )}

          {frame('advanced',
            <OptionsPage title={meta('advanced').title} blurb={meta('advanced').blurb} defs={ADVANCED} values={extras} onChange={setOpt} onReset={reset} />
          )}
        </div>
      </div>

      {alert && <AlertComponent type={alert.type!} message={alert.message} action={alert.action} onDismiss={dismissAlert} />}
    </div>
  );
};

export default Layout;