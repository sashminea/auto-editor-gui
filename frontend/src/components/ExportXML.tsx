import React, { useEffect } from 'react';
import CardWithForm from './InputCard';
import CardWithArguments from './ArgumentsCard';
import type { SelectedFile } from '@/lib/files';
import { composeEdit, extraArgs, type Extras } from '@/lib/options';
import { usePersisted } from '@/lib/storage';

interface ExportXMLProps {
  selectedFile: SelectedFile | null;
  onFileSelect: (file: SelectedFile | null) => void;
  onCommandChange: (command: string) => void;
  extras: Extras; // options set on the other pages
  running: boolean;
  onRun: (command: string) => Promise<void>;
  onCancel: () => void;
  outputDir: string;
  onChooseOutput: () => void;
  onRevealOutput: () => void;
}

const ExportXML: React.FC<ExportXMLProps> = ({
  selectedFile, onFileSelect, onCommandChange, extras, running, onRun, onCancel,
  outputDir, onChooseOutput, onRevealOutput,
}) => {
  // Remembered between launches
  const [exportAs, setExportAs] = usePersisted<string>('ae.exportAs', 'premiere');
  const [loudness, setLoudness] = usePersisted<number>('ae.loudness', -19);
  const [margin, setMargin] = usePersisted<number>('ae.margin', 0);

  const buildCommand = (loud = loudness, marg = margin): string => {
    const inputFile = selectedFile?.path ?? "example.mp4";
    return [
      `auto_editor "${inputFile}"`,
      `--export ${exportAs}`,
      `--edit ${composeEdit(extras, loud)}`,
      `--margin ${marg}s`,
      ...extraArgs(extras),
    ].join(' ');
  };

  const handleExport = async (loud: number, marg: number) => {
    setLoudness(loud);
    setMargin(marg);
    const command = buildCommand(loud, marg);
    onCommandChange(command);
    await onRun(command);
  };

  const handleApply = (loud: number, marg: number) => {
    setLoudness(loud);
    setMargin(marg);
    onCommandChange(buildCommand(loud, marg));
  };

  useEffect(() => {
    onCommandChange(buildCommand());
  }, [selectedFile, exportAs, loudness, margin, extras]);

  return (
    <div className="flex flex-col gap-2">
      <CardWithForm
        onFileSelect={onFileSelect}
        selectedFile={selectedFile}
        exportAs={exportAs}
        onExportAsChange={setExportAs}
        outputDir={outputDir}
        onChooseOutput={onChooseOutput}
        onRevealOutput={onRevealOutput}
      />
      <CardWithArguments
        onExport={handleExport}
        onApply={handleApply}
        onCancel={onCancel}
        initial={{ loudness, margin }}
        applied={{ loudness, margin }}
        busy={running}
      />
    </div>
  );
};

export default ExportXML;