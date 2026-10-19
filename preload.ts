import { contextBridge, ipcRenderer, webUtils } from "electron";

interface CommandResult {
  success: boolean;
  message?: string;
}

interface ElectronAPI {
  runCommand: (args: string[]) => Promise<CommandResult | string>;
  getAppDataPath: () => Promise<string>;
  openFileDialog: () => Promise<string>;
  openFolderDialog: () => Promise<string>;
  onCommandOutput: (callback: (output: string) => void) => () => void; // now returns an unsubscribe function
  setTitleBarTheme: (theme: string) => void;
  getPathForFile: (file: File) => string;
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

  getAppDataPath: async (): Promise<string> => {
    try {
      return await ipcRenderer.invoke("get-appdata-path");
    } catch (error) {
      console.error("Error getting AppData path:", error);
      throw error;
    }
  },

  openFileDialog: async (): Promise<string> => {
    try {
      return await ipcRenderer.invoke("open-file-dialog");
    } catch (error) {
      console.error("Error opening file dialog:", error);
      throw error;
    }
  },

  openFolderDialog: (): Promise<string> =>
    ipcRenderer.invoke("open-folder-dialog"),

  // Same channel as before ('commandOutput'), but the caller can now unsubscribe
  onCommandOutput: (callback: (output: string) => void): (() => void) => {
    const handler = (_event: Electron.IpcRendererEvent, output: string) =>
      callback(output);
    ipcRenderer.on("commandOutput", handler);
    return () => ipcRenderer.removeListener("commandOutput", handler);
  },

  // NEW: recolour the native window buttons when the theme toggles
  setTitleBarTheme: (theme: string): void =>
    ipcRenderer.send("set-title-bar-theme", theme),

  // NEW: real file path for drag-and-drop (Electron 32+)
  getPathForFile: (file: File): string => webUtils.getPathForFile(file),
} as ElectronAPI);
