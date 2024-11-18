import React, { useState, useEffect } from 'react';
import NavigationMenuDemo from './NavBar';
import ExportXML from './ExportXML';
import CommandDisplay from './CommandDisplay';

interface SelectedFile {
  name: string;
  path: string;
}

const Layout: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [exportPath, setExportPath] = useState<string>('\\output');
  const [exportAs, setExportAs] = useState<string>('premiere');
  const [loudness, setLoudness] = useState<number>(-19);
  const [margin, setMargin] = useState<number>(0);
  const [command, setCommand] = useState<string>('');

  // Fetch AppData path when the component mounts
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

   // Dynamically generate the command whenever the dependencies change
  // useEffect(() => {
  //   const generateCommand = () => {
  //     const inputFilePath = selectedFile?.path || 'example.mp4';
  //     const outputFile = exportPath || 'C:\\AutoEditorOutput';
  //     const exportOption = exportAs || 'mp4';
  //     const loudnessOption = `audio:${loudness}dB`;
  //     const marginOption = `${margin}s`;

  //     // Construct the command string
  //     const newCommand = `python -m auto_editor "${inputFilePath}" --export ${exportOption} --edit ${loudnessOption} --margin ${marginOption} --output "${outputFile}"`;
      
  //     setCommand(newCommand); // Update the command state
  //   };

  //   generateCommand(); // Generate the command every time these values change
  // }, [selectedFile, exportPath, exportAs, loudness, margin]); // Dependencies for when the command should regenerate


  return (
    <div className="flex flex-col container gap-4">
      <NavigationMenuDemo />
      <ExportXML
        onFileSelect={setSelectedFile}
        onCommandChange={setCommand}
        onExportPathChange={setExportPath}
      />
      <CommandDisplay
        selectedFile={selectedFile}
        exportPath={exportPath}
        exportAs={exportAs}
        loudness={loudness}
        margin={margin}
        command={command}
      />
    </div>
  );
};

export default Layout;
