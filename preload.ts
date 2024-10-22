// preload.ts
import { contextBridge, ipcRenderer } from 'electron';

// Expose a method to the renderer process
contextBridge.exposeInMainWorld('electron', {
    runCommand: (command: string) => ipcRenderer.invoke('runCommand', command),
});
