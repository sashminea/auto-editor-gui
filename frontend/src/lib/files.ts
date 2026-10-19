export interface SelectedFile {
  name: string;
  path: string;
}

// Same fallback the app already used when the dialog returns nothing
const FALLBACK: SelectedFile = { name: "example.mp4", path: "example.mp4" };

export const isPlaceholder = (f: SelectedFile | null) =>
  !f || f.path === FALLBACK.path;

export async function pickVideo(): Promise<SelectedFile | null> {
  try {
    const selected = await window.electron.openFileDialog();
    if (selected) {
      return {
        name: selected.split(/[\\/]/).pop() || FALLBACK.name,
        path: selected,
      };
    }
    return FALLBACK;
  } catch (error) {
    console.error("File selection failed:", error);
    return null;
  }
}

// Drag & drop: newer Electron removed File.path, so prefer webUtils via preload if exposed
export function fileFromDrop(file: File): SelectedFile | null {
  const api = (window as any).electron;
  const path: string | undefined =
    api?.getPathForFile?.(file) ?? (file as any).path;
  return path ? { name: file.name, path } : null;
}

// Served by the custom `local-media` protocol (see ELECTRON-SETUP.md)
export const toPreviewUrl = (p: string) =>
  `local-media://${p.startsWith("/") ? "" : "/"}${p.replace(/\\/g, "/").split("/").map(encodeURIComponent).join("/")}`;
