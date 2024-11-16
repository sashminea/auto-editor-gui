// preload.ts
import { contextBridge, ipcRenderer, app } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  runCommand: async (command: string) => {
    console.log("runCommand called in preload with command:", command);
    try {
      return await ipcRenderer.invoke('run-command', command); // Ensure this is invoked properly
    } catch (error) {
      console.error("Error in preload runCommand:", error);
      throw error;
    }
  },
  getFilePath: (fileName: string) => ipcRenderer.invoke('get-file-path', fileName),
  openFileDialog: () => ipcRenderer.invoke('open-file-dialog'),
  onCommandOutput: (callback: (output: string) => void) => {
    ipcRenderer.on('commandOutput', (event, output) => {
      callback(output);
    });
  },
  getAppDataPath: () => ipcRenderer.invoke('get-appdata-path'),
});
