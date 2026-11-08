import React from "react";
import { FileIcon, VideoIcon, OpenInNewWindowIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { isPlaceholder, pickVideo } from "@/lib/files";

const EXPORTS: [string, string][] = [
  ["default", "Default (MP4)"],
  ["clip-sequence", "Clip Sequence"],
  ["premiere", "Premiere Pro XML"],
  ["resolve-fcp7", "Resolve FCP7 XML"],
  ["final-cut-pro", "Final Cut Pro XML"],
  ["shotcut", "Shotcut MLT"],
];

interface CardWithFormProps {
  onFileSelect: (file: { name: string; path: string }) => void;
  selectedFile: { name: string; path: string } | null;
  exportAs: string;
  onExportAsChange: (exportAs: string) => void;
  outputDir: string;
  onChooseOutput: () => void;
  onRevealOutput: () => void;
}

const CardWithForm: React.FC<CardWithFormProps> = ({
  onFileSelect, selectedFile, exportAs, onExportAsChange, outputDir, onChooseOutput, onRevealOutput,
}) => {
  const handleFileChange = async () => {
    const picked = await pickVideo();
    if (picked) onFileSelect(picked);
  };

  const hasFile = !isPlaceholder(selectedFile);

  return (
    <Card className="w-full">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="mono-label text-muted-foreground">Source</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 p-4">
        <div className="grid gap-2">
          <Button variant="secondary" onClick={handleFileChange} className="w-full justify-start">
            <FileIcon /> {hasFile ? "Change video file" : "Select video file"}
          </Button>
          {hasFile && (
            <p className="flex items-center gap-2 text-xs text-muted-foreground" title={selectedFile!.path}>
              <VideoIcon className="shrink-0" />
              <span className="truncate">{selectedFile!.name}</span>
            </p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label>Output folder</Label>
          <p className="truncate rounded-md border bg-background px-3 py-2 text-xs text-muted-foreground" title={outputDir}>
            {outputDir || "…"}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={onChooseOutput}>Change…</Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={onRevealOutput} disabled={!outputDir}>
              <OpenInNewWindowIcon /> Open
            </Button>
          </div>
        </div>

        <div className="grid gap-1.5">
          <Label>Export as</Label>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Export as">
            {EXPORTS.map(([value, label]) => (
              <button key={value} type="button" className="chip" aria-pressed={exportAs === value} onClick={() => onExportAsChange(value)}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
export default CardWithForm;