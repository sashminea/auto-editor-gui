import { contextBridge, ipcRenderer, webUtils } from "electron";

interface CommandResult {
  success: boolean;
  message?: string;
}

interface ElectronAPI {
  runCommand: (args: string[]) => Promise<CommandResult | string>;
  cancelCommand: () => Promise<boolean>; // NEW
  getAppDataPath: () => Promise<string>;
  openFileDialog: () => Promise<string | null>; // null when the dialog is cancelled
  openFolderDialog: () => Promise<string | null>;
  getOutputDir: () => Promise<string>; // NEW
  chooseOutputDir: () => Promise<string | null>; // NEW
  revealPath: (path: string) => Promise<boolean>; // NEW
  checkRuntime: () => Promise<{ ok: boolean; detail: string }>; // NEW
  onCommandOutput: (callback: (output: string) => void) => () => void;
  setTitleBarTheme: (theme: string) => void;
  getPathForFile: (file: File) => string;
  platform: string; // NEW
}

contextBridge.exposeInMainWorld("electron", {
  runCommand: async (args: string[]): Promise<CommandResult | string> => {
    console.log("runCommand called in preload with command:", args);
    try {
      return await ipcRenderer.invoke("run-command", args); // Send the command to main process
    } catch (error) {
      console.error("Error in preload runCommand:", error);
      throw error;
    }
  },

  // NEW: stop the running export
  cancelCommand: (): Promise<boolean> => ipcRenderer.invoke("cancel-command"),

  getAppDataPath: async (): Promise<string> => {
    try {
      return await ipcRenderer.invoke("get-appdata-path");
    } catch (error) {
      console.error("Error getting AppData path:", error);
      throw error;
    }
  },

  openFileDialog: async (): Promise<string | null> => {
    try {
      return await ipcRenderer.invoke("open-file-dialog");
    } catch (error) {
      console.error("Error opening file dialog:", error);
      throw error;
    }
  },

  openFolderDialog: (): Promise<string | null> =>
    ipcRenderer.invoke("open-folder-dialog"),

  // NEW: output folder (default Videos\Auto Editor Output, changeable and remembered)
  getOutputDir: (): Promise<string> => ipcRenderer.invoke("get-output-dir"),
  chooseOutputDir: (): Promise<string | null> =>
    ipcRenderer.invoke("choose-output-dir"),

  // NEW: show a file (or open a folder) in Explorer / Finder
  revealPath: (path: string): Promise<boolean> =>
    ipcRenderer.invoke("reveal-path", path),

  // NEW: is Python + auto_editor usable? Used for the first-launch check
  checkRuntime: (): Promise<{ ok: boolean; detail: string }> =>
    ipcRenderer.invoke("check-runtime"),

  // Same channel as before ('commandOutput'), but the caller can unsubscribe
  onCommandOutput: (callback: (output: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, output: string) =>
      callback(output);
    ipcRenderer.on("commandOutput", handler);
    return () => ipcRenderer.removeListener("commandOutput", handler);
  },

  // Recolour the native window buttons when the theme toggles
  setTitleBarTheme: (theme: string): void =>
    ipcRenderer.send("set-title-bar-theme", theme),

  // Real file path for drag-and-drop (Electron 32+)
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),

  platform: process.platform,
} as ElectronAPI);
