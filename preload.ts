// preload.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  runCommand: async (args: string[]) => {
    console.log("runCommand called in preload with command:", args);
    try {
      return await ipcRenderer.invoke('run-command', args); // Send the command to main process
    } catch (error) {
      console.error("Error in preload runCommand:", error);
      throw error;
    }
  },
  // Expose a method to get the AppData path
  getAppDataPath: async () => {
    try {
      return await ipcRenderer.invoke('get-appdata-path');
    } catch (error) {
      console.error('Error getting AppData path:', error);
    }
  },
  
  openFileDialog: async () => {
    try {
      return await ipcRenderer.invoke('open-file-dialog');
    } catch (error) {
      console.error('Error opening file dialog:', error);
    }
  },

  openFolderDialog: () => ipcRenderer.invoke("open-folder-dialog"),

  onCommandOutput: (callback: (output: string) => void) => {
    ipcRenderer.on('commandOutput', (event, output) => {
      callback(output);
    });
  },
});
