import { contextBridge, ipcRenderer } from 'electron';

interface CommandResult {
  success: boolean;
  message?: string;
}

interface ElectronAPI {
  runCommand: (args: string[]) => Promise<CommandResult | string>;
  getAppDataPath: () => Promise<string>;
  openFileDialog: () => Promise<string>;
  openFolderDialog: () => Promise<string>;
  onCommandOutput: (callback: (output: string) => void) => void;
}

contextBridge.exposeInMainWorld('electron', {
  runCommand: async (args: string[]): Promise<CommandResult | string> => {
    console.log("runCommand called in preload with command:", args);
    try {
      return await ipcRenderer.invoke('run-command', args); // Send the command to main process
    } catch (error) {
      console.error("Error in preload runCommand:", error);
      throw error;
    }
  },

  getAppDataPath: async (): Promise<string> => {
    try {
      return await ipcRenderer.invoke('get-appdata-path');
    } catch (error) {
      console.error('Error getting AppData path:', error);
      throw error;
    }
  },

  openFileDialog: async (): Promise<string> => {
    try {
      return await ipcRenderer.invoke('open-file-dialog');
    } catch (error) {
      console.error('Error opening file dialog:', error);
      throw error;
    }
  },

  openFolderDialog: (): Promise<string> => ipcRenderer.invoke("open-folder-dialog"),

  onCommandOutput: (callback: (output: string) => void): void => {
    ipcRenderer.on('commandOutput', (event, output) => {
      callback(output);
    });
  },
} as ElectronAPI);
