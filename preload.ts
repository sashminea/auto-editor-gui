import { contextBridge, ipcRenderer, webUtils } from "electron";

interface CommandResult {
  success: boolean;
  message?: string;
}

interface WaveformResult {
  ok: boolean;
  fps?: number;
  duration?: number;
  levels?: number[];
  error?: string;
}

interface ElectronAPI {
  runCommand: (args: string[]) => Promise<CommandResult | string>;
  cancelCommand: () => Promise<boolean>;
  getAppDataPath: () => Promise<string>;
  openFileDialog: () => Promise<string | null>;
  openFolderDialog: () => Promise<string | null>;
  getOutputDir: () => Promise<string>;
  chooseOutputDir: () => Promise<string | null>;
  revealPath: (path: string) => Promise<boolean>;
  checkRuntime: () => Promise<{ ok: boolean; detail: string }>;
  getWaveform: (path: string) => Promise<WaveformResult>;
  onCommandOutput: (callback: (output: string) => void) => () => void;
  setTitleBarTheme: (theme: string) => void;
  getPathForFile: (file: File) => string;
  platform: string;
}

contextBridge.exposeInMainWorld("electron", {
  runCommand: async (args: string[]): Promise<CommandResult | string> => {
    console.log("runCommand called in preload with command:", args);
    try {
      return await ipcRenderer.invoke("run-command", args);
    } catch (error) {
      console.error("Error in preload runCommand:", error);
      throw error;
    }
  },

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

  getOutputDir: (): Promise<string> => ipcRenderer.invoke("get-output-dir"),
  chooseOutputDir: (): Promise<string | null> =>
    ipcRenderer.invoke("choose-output-dir"),

  revealPath: (path: string): Promise<boolean> =>
    ipcRenderer.invoke("reveal-path", path),

  checkRuntime: (): Promise<{ ok: boolean; detail: string }> =>
    ipcRenderer.invoke("check-runtime"),

  // NEW: loudness levels (30/sec) for the waveform preview
  getWaveform: (path: string): Promise<WaveformResult> =>
    ipcRenderer.invoke("get-waveform", path),

  onCommandOutput: (callback: (output: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, output: string) =>
      callback(output);
    ipcRenderer.on("commandOutput", handler);
    return () => ipcRenderer.removeListener("commandOutput", handler);
  },

  setTitleBarTheme: (theme: string): void =>
    ipcRenderer.send("set-title-bar-theme", theme),

  getPathForFile: (file: File): string => webUtils.getPathForFile(file),

  platform: process.platform,
} as ElectronAPI);
