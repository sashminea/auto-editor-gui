import React, { useState, useEffect } from 'react';
import NavigationMenuDemo from './NavBar';
import CardWithForm from './InputCard';
import CardWithArguments from './ArgumentsCard';
import CommandDisplay from './CommandDisplay';

interface SelectedFile {
  name: string;
  path: string;
}

const Layout: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [exportPath, setExportPath] = useState<string>('');
  const [exportAs, setExportAs] = useState<string>('premiere');
  const [loudness, setLoudness] = useState<number>(-19);
  const [margin, setMargin] = useState<number>(0);

  useEffect(() => {
    // Fetch the AppData path when the component mounts
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

  const handleFileSelect = (file: { name: string; path: string } | null) => {
    if (file) {
      const filePath = file.path;
      setSelectedFile({
        name: file.name,
        path: filePath, // Ensure the correct path is passed
      });
    } else {
      setSelectedFile(null);
    }
  };

  const handleExportPathChange = (path: string) => {
    setExportPath(path);
  };

  const handleExportAsChange = (exportAs: string) => {
    setExportAs(exportAs);
  };

  const handleExport = (loudness: number, margin: number) => {
    setLoudness(loudness);
    setMargin(margin);

    if (selectedFile) {
      const command = `auto-editor "${selectedFile.path}" --export ${exportAs} --edit audio:${loudness}dB --margin ${margin}sec --output "${exportPath}"`;
      console.log("Running command:", command);
    }
  };

  return (
    <div className="flex flex-col container gap-4">
      <NavigationMenuDemo />
      <main className="flex sm:flex-row flex-col gap-2">
        <CardWithForm
          onFileSelect={handleFileSelect} 
          onExportPathChange={handleExportPathChange}
          onExportAsChange={handleExportAsChange}
        />
        <CardWithArguments onExport={handleExport} />
      </main>
      <CommandDisplay
        selectedFile={selectedFile}
        exportPath={exportPath}
        exportAs={exportAs}
        loudness={loudness}
        margin={margin}
      />
    </div>
  );
};

export default Layout;
