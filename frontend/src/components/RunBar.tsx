import React from "react";
import { Button } from "@/components/ui/button";
import CommandDisplay from "./CommandDisplay";
import ConsolePanel from "./Consolepanel";
import { isPlaceholder, type SelectedFile } from "@/lib/files";

interface RunBarProps {
  command: string;
  file: SelectedFile | null;
  running: boolean;
  progress: number | null;
  status: string;
  lines: string[];
  onExport: () => void;
  onCancel: () => void;
  onGoQuick: () => void;
}

// Pinned under every non-Quick page so the command and Export are always reachable
const RunBar: React.FC<RunBarProps> = ({ command, file, running, progress, status, lines, onExport, onCancel, onGoQuick }) => {
  const hasFile = !isPlaceholder(file);
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t bg-card/50 p-2">
      <div className="flex items-center justify-between gap-3 px-1">
        {hasFile ? (
          <p className="min-w-0 truncate text-xs text-muted-foreground" title={file!.path}>Video: {file!.name}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            No video selected.{" "}
            <button type="button" className="text-primary underline-offset-2 hover:underline" onClick={onGoQuick}>Choose one in Quick Edit</button>
          </p>
        )}
        {running ? (
          <Button size="sm" variant="destructive" onClick={onCancel}>Cancel</Button>
        ) : (
          <Button size="sm" disabled={!hasFile} onClick={onExport}>Export</Button>
        )}
      </div>
      <CommandDisplay command={command} />
      <ConsolePanel running={running} progress={progress} status={status} lines={lines} />
    </div>
  );
};

export default RunBar;