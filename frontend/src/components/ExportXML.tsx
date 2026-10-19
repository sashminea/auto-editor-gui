import React, { useState, useEffect } from 'react';
import CardWithForm from './InputCard';
import CardWithArguments from './ArgumentsCard';
import type { SelectedFile } from '@/lib/files';

interface ExportXMLProps {
  selectedFile: SelectedFile | null; // now owned by Layout so the preview can share it
  onFileSelect: (file: SelectedFile | null) => void;
  onCommandChange: (command: string) => void;
  onExportPathChange: (path: string) => void;
  setAlert: React.Dispatch<React.SetStateAction<{ message: string, type: 'normal' | 'error' | 'success' | null } | null>>;
  running: boolean;
  onRunStart: () => void;
  onRunEnd: (ok: boolean) => void;
}

const ExportXML: React.FC<ExportXMLProps> = ({
  selectedFile, onFileSelect, onCommandChange, onExportPathChange, setAlert, running, onRunStart, onRunEnd,
}) => {
  const [exportAs, setExportAs] = useState<string>('premiere');
  const [loudness, setLoudness] = useState<number>(-19);
  const [margin, setMargin] = useState<number>(0);

  // Fetch the AppData path when the component mounts
  useEffect(() => {
    const fetchAppDataPath = async () => {
      try {
        await window.electron.getAppDataPath();
        const defaultExportPath = `\\output`;
        onExportPathChange(defaultExportPath);
      } catch (error) {
        console.error('Failed to get AppData path:', error);
      }
    };
    fetchAppDataPath();
  }, [onExportPathChange]);

  const buildCommand = (): string => {
    const inputFile = selectedFile?.path ?? "example.mp4";
    const quotedInputFile = `"${inputFile}"`; // Ensure the path is quoted
    return `auto_editor ${quotedInputFile} --export ${exportAs} --edit audio:${loudness}dB --margin ${margin}s`;
  };

  // Handle export (loudness and margin changes)
  const handleExport = async (loud: number, marg: number) => {
    setLoudness(loud);
    setMargin(marg);
    const command = buildCommand();
    onCommandChange(command);
    setAlert({ message: 'Exporting video...', type: 'normal' });
    await runAutoEditor(command);
  };

  const handleApply = (loud: number, marg: number) => {
    const command = `auto_editor "${selectedFile?.path ?? 'example.mp4'}" --export ${exportAs} --edit audio:${loud}dB --margin ${marg}s`;
    setLoudness(loud);
    setMargin(marg);
    onCommandChange(command);
  };

  useEffect(() => {
    onCommandChange(buildCommand());
  }, [selectedFile, exportAs, loudness, margin]);

  const runAutoEditor = async (command: string) => {
    if (!selectedFile) {
      setAlert({ message: 'No file selected for processing.', type: 'error' });
      return;
    }

    onRunStart();
    let ok = false;
    try {
      console.log('Running command:', command);
      const commandArgs = command.split(' ');
      const result = await window.electron.runCommand(commandArgs);
      console.log('Command executed with result:', result);

      if (typeof result === 'string') {
        if (result.includes('Process completed successfully with code 0')) {
          ok = true;
          setAlert({ message: 'File processed successfully!', type: 'success' });
        } else {
          setAlert({ message: result, type: 'error' });
        }
      } else {
        setAlert({ message: 'Unexpected result format.', type: 'error' });
      }
    } catch (error: unknown) {
      console.error('Error executing command:', error);
      if (error instanceof Error) {
        setAlert({ message: `Error: ${error.message}`, type: 'error' });
      } else {
        setAlert({ message: 'An unknown error occurred.', type: 'error' });
      }
    } finally {
      onRunEnd(ok);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <CardWithForm
        onFileSelect={onFileSelect}
        onExportAsChange={setExportAs}
        onExportPathChange={onExportPathChange}
        selectedFile={selectedFile}
      />
      <CardWithArguments
        onExport={handleExport}
        onApply={handleApply}
        applied={{ loudness, margin }}
        busy={running}
      />
    </div>
  );
};

export default ExportXML;