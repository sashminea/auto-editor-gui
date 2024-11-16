// main.ts
import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { spawn } from 'child_process';
import fs from 'fs';
import os from 'os';

const createAutoEditorFolder = () => {
  // Define the folder path (for example, AppData/Auto Editor Output)
  const folderPath = path.join(process.env.APPDATA || '', 'Auto Editor Output');

  // Check if the directory exists
  if (!fs.existsSync(folderPath)) {
    try {
      // Create the directory if it doesn't exist
      fs.mkdirSync(folderPath, { recursive: true }); // recursive: true to create intermediate directories
      console.log(`Directory created at: ${folderPath}`);
    } catch (error) {
      console.error('Error creating directory:', error);
    }
  } else {
    console.log(`Directory already exists at: ${folderPath}`);
  }
};

const appDataPath = app.getPath('appData');  // Automatically gets the AppData path

// Define the path for the AutoEditorOutput folder
const autoEditorOutputPath = path.join(appDataPath, 'AutoEditorOutput');

// Check if the AutoEditorOutput folder exists, and create it if not
const ensureAutoEditorOutputDirectory = () => {
  if (!fs.existsSync(autoEditorOutputPath)) {
    try {
      fs.mkdirSync(autoEditorOutputPath, { recursive: true });
      console.log(`Created folder: ${autoEditorOutputPath}`);
    } catch (error) {
      console.error(`Error creating folder: ${error}`);
      throw new Error(`Failed to create folder: ${autoEditorOutputPath}`);
    }
  }
  return autoEditorOutputPath;
};

console.log("AppData Path:", appDataPath);  // Outputs something like "C:\\Users\\<UserName>\\AppData\\Roaming"

// Create the Electron window
function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'dist/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      devTools: true,
      disableDialogs: true,
      spellcheck: false,
      webviewTag: false,
      autoplayPolicy: 'no-user-gesture-required',
      experimentalFeatures: false,
      safeDialogs: true,
    },
  });

  mainWindow.loadURL('http://localhost:5173'); // Adjust based on your server URL
}

// Define the AppData output directory
const getAppDataOutputDirectory = () => {
  const appDataPath = path.join(os.homedir(), 'AppData', 'Roaming', 'AutoEditorOutput');
  if (!fs.existsSync(appDataPath)) {
    try {
      fs.mkdirSync(appDataPath, { recursive: true });
      console.log(`Output directory created: ${appDataPath}`);
    } catch (error) {
      console.error(`Error creating output directory: ${error}`);
      throw new Error(`Failed to create output directory: ${appDataPath}`);
    }
  }
  return appDataPath;
};

// Handle the request for AppData path
  ipcMain.handle('get-appdata-path', () => {
    ensureAutoEditorOutputDirectory(); 
    return app.getPath('appData'); // Returns the AppData path for the user
  });

// Handle IPC for running commands
ipcMain.handle("run-command", async (event, command) => {
  console.log("Received IPC call to run-command with command:", command);

  // Ensure output directory exists
  const outputDir = getAppDataOutputDirectory();
  const updatedCommand = `${command} --output "${outputDir}"`; // Ensure that command is properly updated with output path

  return new Promise((resolve, reject) => {
    const process = spawn(updatedCommand, { shell: true });

    process.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    process.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on('close', (code) => {
      console.log(`Process exited with code ${code}`);
      resolve(`Process exited with code ${code}`);
    });

    process.on('error', (error) => {
      console.error(`Process error: ${error.message}`);
      reject(error);
    });
  });
});

// Handle open-file-dialog
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'mkv'] }],
  });

  if (result.filePaths && result.filePaths.length > 0) {
    return result.filePaths[0];
  } else {
    throw new Error('No file selected');
  }
});


app.whenReady().then(() => {
  createAutoEditorFolder();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
