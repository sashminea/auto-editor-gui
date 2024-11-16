import React, { useState, useEffect } from 'react';
import CardWithForm from './InputCard';
import CardWithArguments from './ArgumentsCard';

const ExportXML: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<{ name: string; path: string } | null>(null);
  const [exportAs, setExportAs] = useState<string>("premiere");
  const [exportPath, setExportPath] = useState<string>("");
  const [loudness, setLoudness] = useState<number>(-19);
  const [margin, setMargin] = useState<number>(0);

  // Fetch the AppData path when the component mounts
  useEffect(() => {
    const fetchAppDataPath = async () => {
      try {
        const appDataPath = await window.electron.getAppDataPath();
        setExportPath(`${appDataPath}\\Auto Editor Output`); // Set the default export path to AppData
      } catch (error) {
        console.error("Failed to get AppData path:", error);
      }
    };

    fetchAppDataPath();
  }, []);

  const buildCommand = (): string => {
    const inputFile = selectedFile?.path ?? "example.mp4";
    return `auto-editor "${inputFile}" --export ${exportAs} --edit audio:${loudness}dB --margin ${margin}sec --output "${exportPath}"`;
  };

  const runAutoEditor = async () => {
    if (!selectedFile) {
      console.error("No file selected for processing.");
      return;
    }

    const command = buildCommand();
    console.log("Running command:", command);

    try {
      const result = await window.electron.runCommand(command);
      console.log("Command executed with result:", result);
    } catch (error) {
      const err = error as Error;
      console.error("Error executing command:", err.message);
    }
  };

  return (
    <div>
      <CardWithForm onFileSelect={setSelectedFile} onExportAsChange={setExportAs} onExportPathChange={setExportPath} />
      <CardWithArguments
        onExport={(loud, marg) => {
          setLoudness(loud);
          setMargin(marg);
          runAutoEditor();
        }}
      />
    </div>
  );
};

export default ExportXML;
