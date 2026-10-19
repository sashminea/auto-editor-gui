import React from "react";
import { FileIcon, VideoIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StringInput from "./StringInput";
import { isPlaceholder, pickVideo } from "@/lib/files";

interface CardWithFormProps {
  onFileSelect: (file: { name: string; path: string }) => void;
  onExportPathChange: (path: string) => void;
  onExportAsChange: (exportAs: string) => void;
  selectedFile: { name: string; path: string } | null;
}

const CardWithForm: React.FC<CardWithFormProps> = ({ onFileSelect, onExportPathChange, onExportAsChange, selectedFile }) => {
  const handleFileChange = async () => {
    const picked = await pickVideo();
    if (picked) onFileSelect(picked);
  };

  const hasFile = !isPlaceholder(selectedFile);

  return (
    <Card className="w-full rounded-md shadow-none">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-sm">Source</CardTitle>
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

        {/* Export path stays non-interactive exactly as before */}
        <div className="pointer-events-none opacity-60">
          <StringInput
            label="Export path"
            id="exportPath"
            placeholder="output/"
            onChange={(e) => onExportPathChange(e.target.value)}
          />
        </div>

        <div className="grid gap-1.5">
          <Label htmlFor="framework">Export as</Label>
          <Select defaultValue="premiere" onValueChange={onExportAsChange}>
            <SelectTrigger id="framework">
              <SelectValue placeholder="Premiere Pro XML" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="premiere">Premiere Pro XML</SelectItem>
              <SelectItem value="resolve-fcp7">Resolve FCP7 XML</SelectItem>
              <SelectItem value="final-cut-pro">Final Cut Pro XML</SelectItem>
              <SelectItem value="shotcut">Shotcut MLT</SelectItem>
              <SelectItem value="audio">Audio Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};
export default CardWithForm;