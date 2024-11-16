import React from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StringInput from "./StringInput";  // Assuming StringInput is the only other required component

interface CardWithFormProps {
  onFileSelect: (file: { name: string; path: string }) => void;
  onExportPathChange: (path: string) => void;
  onExportAsChange: (exportAs: string) => void;
}

const CardWithForm: React.FC<CardWithFormProps> = ({ onFileSelect, onExportPathChange, onExportAsChange }) => {
  const handleFileChange = async () => {
    try {
      // Call Electron's file dialog API to open the file selection dialog
      const selectedFilePath = await window.electron.openFileDialog();
      if (selectedFilePath) {
        // Extract file name and pass full path to parent component
        const fileName = selectedFilePath.split('/').pop() || 'example.mp4';
        onFileSelect({
          name: fileName,
          path: selectedFilePath, // Full file path returned by Electron
        });
      } else {
        // Handle case where no file is selected
        onFileSelect({
          name: 'example.mp4',
          path: 'example.mp4',
        });
      }
    } catch (error) {
      console.error('File selection failed:', error);
    }
  };

  const handleExportPathChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onExportPathChange(event.target.value);
  };

  const handleExportAsChange = (value: string) => {
    onExportAsChange(value);
  };
  

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Choose a video file</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            {/* Replace InputFile with a button that triggers file selection */}
            <button onClick={handleFileChange} className="btn">Select File</button>
          </div>
          <div className="flex flex-col space-y-1.5">
            <StringInput
              label="Export Path"
              id="exportPath"
              placeholder="AppData\Roaming\Auto Editor Output"
              onChange={handleExportPathChange}
             
            />
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="framework">Export as</Label>
            <Select onValueChange={handleExportAsChange}>
              <SelectTrigger id="framework">
                <SelectValue placeholder="Premiere Pro XML" />
              </SelectTrigger>
              <SelectContent position="popper">
                <SelectItem value="mp4">Default (MP4)</SelectItem>
                <SelectItem value="premiere">Premiere Pro XML</SelectItem>
                <SelectItem value="resolve-fcp7">Resolve FCP7 XML</SelectItem>
                <SelectItem value="final-cut-pro">Final Cut Pro XML</SelectItem>
                <SelectItem value="resolve">DaVinci Resolve XML</SelectItem>
                <SelectItem value="shotcut">Shotcut MLT</SelectItem>
                <SelectItem value="json">JSON Format</SelectItem>
                <SelectItem value="timeline">Timeline Format</SelectItem>
                <SelectItem value="audio">Audio Only</SelectItem>
                <SelectItem value="clip-sequence">Clip Sequence</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
      <CardFooter />
    </Card>
  );
};

export default CardWithForm;
