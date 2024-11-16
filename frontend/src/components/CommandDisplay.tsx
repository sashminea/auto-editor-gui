import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CommandDisplayProps {
  selectedFile: { name: string; path: string } | null;
  exportPath: string;
  exportAs: string;
  loudness: number;
  margin: number;
}

const CommandDisplay: React.FC<CommandDisplayProps> = ({
  selectedFile,
  exportPath,
  exportAs,
  loudness,
  margin
}) => {
  const [appDataPath, setAppDataPath] = useState<string>('');

  useEffect(() => {
    const fetchAppDataPath = async () => {
      try {
        const path = await window.electron.getAppDataPath();
        setAppDataPath(path);
      } catch (error) {
        console.error("Failed to get AppData path:", error);
      }
    };

    fetchAppDataPath();
  }, []);

  const outputFile = exportPath || `${appDataPath}\\AutoEditorOutput`; 

  const inputFilePath = selectedFile?.path || 'example.mp4';

  const command = exportAs === 'mp4'
    ? `auto-editor "${inputFilePath}" --edit audio:${loudness}dB --margin ${margin}sec --output "${outputFile}"`
    : `auto-editor "${inputFilePath}" --export ${exportAs} --edit audio:${loudness}dB --margin ${margin}sec --output "${outputFile}"`;

  return (
    <Card className="border p-4 rounded-md gap-2 flex flex-col">
      <CardHeader>
        <CardTitle>Generated Command</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm font-mono">{command}</p>
      </CardContent>
    </Card>
  );
};

export default CommandDisplay;
