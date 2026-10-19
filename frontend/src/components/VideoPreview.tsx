import React, { useEffect, useState } from "react";
import { UploadIcon, VideoIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fileFromDrop, isPlaceholder, pickVideo, toPreviewUrl, type SelectedFile } from "@/lib/files";

interface VideoPreviewProps {
  file: SelectedFile | null;
  onFileSelect: (file: SelectedFile) => void;
}

const VideoPreview: React.FC<VideoPreviewProps> = ({ file, onFileSelect }) => {
  const [dragging, setDragging] = useState(false);
  const [failed, setFailed] = useState(false);
  const hasFile = !isPlaceholder(file);

  useEffect(() => setFailed(false), [file?.path]);

  const browse = async () => {
    const picked = await pickVideo();
    if (picked) onFileSelect(picked);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (!dropped || !/^(video|audio)\//.test(dropped.type)) return;
    const selected = fileFromDrop(dropped);
    if (selected) onFileSelect(selected);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "relative flex min-h-[240px] flex-1 flex-col overflow-hidden rounded-md border bg-black transition-colors sm:min-h-[320px] lg:min-h-0",
        dragging && "border-primary ring-1 ring-primary"
      )}
    >
      {hasFile ? (
        <>
          <div className="flex h-9 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-card px-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-card-foreground">
              <VideoIcon className="shrink-0 text-muted-foreground" />
              <span className="truncate" title={file!.path}>{file!.name}</span>
            </span>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={browse}>Change file</Button>
          </div>
          <video
            key={file!.path}
            src={toPreviewUrl(file!.path)}
            controls
            onError={() => setFailed(true)}
            className="min-h-0 w-full flex-1 bg-black object-contain"
          />
          {failed && (
            <div className="pointer-events-none absolute inset-x-0 bottom-14 mx-auto w-fit max-w-[90%] rounded-md bg-black/80 px-3 py-2 text-center text-xs text-white/80">
              This format can't be previewed here. You can still export it.
            </div>
          )}
        </>
      ) : (
        <button
          type="button"
          onClick={browse}
          className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-white/70 hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <UploadIcon className="h-8 w-8" />
          <span className="text-sm font-medium">Drop a video here, or click to select one</span>
          <span className="text-xs text-white/50">Your clip shows up here so you can check it before exporting</span>
        </button>
      )}
      {dragging && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-primary/20 text-sm font-medium text-white">
          Drop to load this file
        </div>
      )}
    </div>
  );
};

export default VideoPreview;