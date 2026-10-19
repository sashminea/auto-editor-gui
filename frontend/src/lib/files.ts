export interface SelectedFile {
  name: string;
  path: string;
}

// Placeholder used only to build a preview command before a video is chosen
const FALLBACK: SelectedFile = { name: "example.mp4", path: "example.mp4" };

export const isPlaceholder = (f: SelectedFile | null) =>
  !f || f.path === FALLBACK.path;

// Returns null when the dialog is cancelled, so the loaded file is never replaced by accident
export async function pickVideo(): Promise<SelectedFile | null> {
  try {
    const selected = await window.electron.openFileDialog();
    if (!selected) return null;
    return { name: selected.split(/[\\/]/).pop() || FALLBACK.name, path: selected };
  } catch (error) {
    console.error("File selection failed:", error);
    return null;
  }
}

// Drag & drop: newer Electron removed File.path, so use webUtils via the preload
export function fileFromDrop(file: File): SelectedFile | null {
  const api = (window as any).electron;
  const path: string | undefined = api?.getPathForFile?.(file) ?? (file as any).path;
  return path ? { name: file.name, path } : null;
}

// Served by the custom `local-media` protocol in main.ts
export const toPreviewUrl = (p: string) =>
  `local-media://${p.startsWith("/") ? "" : "/"}${p.replace(/\\/g, "/").split("/").map(encodeURIComponent).join("/")}`;