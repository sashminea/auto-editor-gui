import React, { useState, useEffect, useCallback } from 'react';
import TitleBar from './TitleBar';
import ExportXML from './ExportXML';
import CommandDisplay from './CommandDisplay';
import ConsolePanel from './Consolepanel';
import VideoPreview from './VideoPreview';
import AlertComponent from './Alert';
import { useTheme } from '@/lib/theme';
import type { SelectedFile } from '@/lib/files';

const Layout: React.FC = () => {
  const { theme, toggle } = useTheme();
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [, setExportPath] = useState<string>('\\output');
  const [command, setCommand] = useState<string>('');
  const [alert, setAlert] = useState<{ message: string, type: 'normal' | 'error' | 'success' | null } | null>(null);

  // Export progress (fed by auto-editor's output, see ELECTRON-SETUP.md)
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [status, setStatus] = useState('');
  const [lines, setLines] = useState<string[]>([]);

  const dismissAlert = useCallback(() => setAlert(null), []);

  // Keep the original AppData default for the export path
  useEffect(() => {
    const fetchAppDataPath = async () => {
      try {
        const appDataPath = await window.electron.getAppDataPath();
        setExportPath(`${appDataPath}\\Auto Editor Output`);
      } catch (error) {
        console.error("Failed to get AppData path:", error);
      }
    };
    fetchAppDataPath();
  }, []);

  // Subscribe to live command output when the preload exposes it
  useEffect(() => {
    const api = (window as any).electron;
    if (!api?.onCommandOutput) return;
    const off = api.onCommandOutput((chunk: string) => {
      // auto-editor redraws its progress bar with \r, so split on both
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

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <TitleBar theme={theme} onToggleTheme={toggle} />

      <main className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2 lg:flex-row lg:overflow-hidden">
        {/* Workspace: preview, command, progress */}
        <section className="flex min-w-0 flex-1 flex-col gap-2 lg:min-h-0">
          <VideoPreview file={selectedFile} onFileSelect={setSelectedFile} />
          <CommandDisplay command={command} />
          <ConsolePanel running={running} progress={progress} status={status} lines={lines} />
        </section>

        {/* Inspector: source and settings */}
        <aside className="w-full shrink-0 lg:w-[340px] lg:overflow-y-auto">
          <ExportXML
            selectedFile={selectedFile}
            onFileSelect={setSelectedFile}
            onCommandChange={setCommand}
            onExportPathChange={setExportPath}
            setAlert={setAlert}
            running={running}
            onRunStart={onRunStart}
            onRunEnd={onRunEnd}
          />
        </aside>
      </main>

      {alert && <AlertComponent type={alert.type!} message={alert.message} onDismiss={dismissAlert} />}
    </div>
  );
};

export default Layout;