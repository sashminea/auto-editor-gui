// main.ts
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { exec } from 'child_process';

// Create the Electron window
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Path to your preload script
            contextIsolation: true, // Use context isolation for security
            nodeIntegration: false, // Disable Node.js integration
        },
    });

    // Load your React app (make sure your server is running)
    mainWindow.loadURL('http://localhost:5173/'); // Adjust based on your server URL
}

// Handle IPC for running commands
ipcMain.handle('runCommand', async (event, command: string) => {
    return new Promise((resolve, reject) => {
        exec(command, { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
            if (error) {
                reject(`Error: ${error.message}`);
                return;
            }
            if (stderr) {
                reject(`Stderr: ${stderr}`);
                return;
            }
            resolve(stdout); // Send the output back to the renderer process
        });
    });
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
