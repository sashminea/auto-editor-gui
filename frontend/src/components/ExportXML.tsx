import React, { useState, useEffect } from 'react';
import CardWithForm from './InputCard';
import CardWithArguments from './ArgumentsCard';

interface ExportXMLProps {
  onFileSelect: (file: { name: string; path: string } | null) => void;
  onCommandChange: (command: string) => void;
  onExportPathChange: (path: string) => void;
}

const ExportXML: React.FC<ExportXMLProps> = ({ onFileSelect, onCommandChange, onExportPathChange }) => {
  const [selectedFile, setSelectedFile] = useState<{ name: string; path: string } | null>(null);
  const [exportAs, setExportAs] = useState<string>('premiere');
  const [exportPath, setExportPath] = useState<string>('');
  const [loudness, setLoudness] = useState<number>(-19);
  const [margin, setMargin] = useState<number>(0);

  // Fetch the AppData path when the component mounts
  useEffect(() => {
    const fetchAppDataPath = async () => {
      try {
        const appDataPath = await window.electron.getAppDataPath();
        const defaultExportPath = `\\output`;
        setExportPath(defaultExportPath);
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


  // Handle file selection
  const handleFileSelect = (file: { name: string; path: string } | null) => {
    setSelectedFile(file);
    onFileSelect(file);
    const command = buildCommand();
    onCommandChange(command);
  };

  // Handle export (loudness and margin changes)
  const handleExport = (loud: number, marg: number) => {
    setLoudness(loud);
    setMargin(marg);
    const command = buildCommand();
    onCommandChange(command);
    runAutoEditor(command);
  };

  const handleApply = (loud: number, marg: number) => {
    // Directly use loud and marg for building the command
    const command = `auto_editor "${selectedFile?.path ?? 'example.mp4'}" --export ${exportAs} --edit audio:${loud}dB --margin ${marg}s`;
    setLoudness(loud); // Update state
    setMargin(marg);   // Update state
    onCommandChange(command);
  };

  useEffect(() => {
  const command = buildCommand();
  onCommandChange(command);
}, [selectedFile, exportAs, loudness, margin]);



  const runAutoEditor = async (command: string) => {
    if (!selectedFile) {
      console.error("No file selected for processing.");
      return;
    }
    try {
      console.log('Running command:', command);
      const commandArgs = command.split(' '); // Split the command string into arguments
      const result = await window.electron.runCommand(commandArgs);

      console.log('Command executed with result:', result);
    } catch (error) {
      console.error('Error executing command:', error);
    }
  };

  return (
    <div>
      <div className="flex sm:flex-row flex-col gap-2">
        <CardWithForm 
          onFileSelect={setSelectedFile} 
          onExportAsChange={setExportAs} 
          onExportPathChange={setExportPath} 
          selectedFile={selectedFile} // Pass selectedFile to CardWithForm
        />
        <CardWithArguments 
          onExport={handleExport} // Pass the handleExport function to CardWithArguments
          onApply={handleApply}
        />
      </div>
    </div>
  );
};

export default ExportXML;
