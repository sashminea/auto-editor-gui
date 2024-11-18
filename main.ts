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



// Helper function to get the correct Python interpreter
const getPythonPath = () => {
  const pythonPath = path.join(os.homedir(), 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'python.exe');
  // Check if Python exists at the specified path
  if (!fs.existsSync(pythonPath)) {
    throw new Error(`Python not found at: ${pythonPath}`);
  }
  return pythonPath;
};

// Helper function to find the local Auto-Editor __main__.py script
const getAutoEditorScriptPath = () => {
  return path.join(__dirname, 'auto_editor'); // Folder containing __main__.py
};

// Helper function to find Python and Auto-Editor paths
const getPythonAndEditorPaths = () => {
  const userHomeDir = os.homedir();
  const pythonPath = path.join(userHomeDir, 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'python.exe');
  const autoEditorScript = path.join(userHomeDir, 'AppData', 'Local', 'Programs', 'Python', 'Python311', 'Scripts', 'auto-editor');
  return { pythonPath, autoEditorScript };
};

const appDataPath = app.getPath('appData');  // Automatically gets the AppData path

// Define the path for the AutoEditorOutput folder
const autoEditorOutputPath = path.join(appDataPath, 'AutoEditorOutput');

// Ensure the Auto-Editor Output directory exists
const ensureAutoEditorOutputDirectory = () => {
  const appDataPath = app.getPath('appData');
  const autoEditorOutputPath = path.join(appDataPath, 'AutoEditorOutput');
  if (!fs.existsSync(autoEditorOutputPath)) {
    try {
      fs.mkdirSync(autoEditorOutputPath, { recursive: true });
      console.log(`Created folder: ${autoEditorOutputPath}`);
    } catch (error) {
      console.error(`Error creating output directory: ${error}`);
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



ipcMain.handle('run-command', async (_event, args) => {
  const autoEditorFolder = path.join(__dirname, 'dist/auto_editor');  // Path to your local auto_editor module
  const inputFile = args[0];  // File path as input
  
  // Extract the selected export format from the args (assuming it's passed as the 2nd argument)
    const exportFormat = args.find((arg: string) => arg.startsWith('--export'))?.split('=')[1] || 'mp4'; // Default to 'mp4'

  
  // Define the output folder path in the root directory
  const outputFolderPath = path.join(__dirname, '..', 'output');
  
  // Ensure the 'output' folder exists, create it if necessary
  if (!fs.existsSync(outputFolderPath)) {
    fs.mkdirSync(outputFolderPath);
    console.log(`Output folder created at: ${outputFolderPath}`);
  }

  // Get the file name without the extension
  const inputFileName = path.basename(inputFile, path.extname(inputFile));
  
  // Define a mapping between export formats and extensions
  const formatExtensions: { [key: string]: string } = {
    premiere: '.xml',
    'resolve-fcp7': '.xml',
    'final-cut-pro': '.xml',
    resolve: '.xml',
    shotcut: '.mlt',
    json: '.json',
    timeline: '.timeline',
    audio: '.mp3', // or .wav depending on your audio export settings
    'clip-sequence': '.clip-sequence',
    mp4: '.mp4',  // Default to mp4
  };

  // Get the correct file extension for the selected format
  const fileExtension = formatExtensions[exportFormat] || '.mp4'; // Default to mp4 if not found

  // Create the output file path with the new extension
  const outputFilePath = path.join(outputFolderPath, `${inputFileName}${fileExtension}`);

  // Add --output argument pointing to the full output file path
  const command = [
    getPythonPath(),  // This gets the path to the Python executable
    '-m',  // Running the auto_editor module
    inputFile,  // File to process
    ...args.slice(1),  // Additional arguments for the Auto-Editor
    '--output', `"${outputFilePath}"`  // Specify the output file path
  ];

  console.log("Executing command:", command.join(' '));

  return new Promise((resolve, reject) => {
    const process = spawn(command[0], command.slice(1), { shell: true });

    process.stdout.on('data', (data) => {
      console.log(`stdout: ${data}`);
    });

    process.stderr.on('data', (data) => {
      console.error(`stderr: ${data}`);
    });

    process.on('close', (code) => {
      console.log(`Process exited with code ${code}`);
      if (code === 0) {
        resolve(`Process completed successfully with code ${code}`);
      } else {
        reject(`Process failed with code ${code}`);
      }
    });

    process.on('error', (error) => {
      console.error(`Process error: ${error.message}`);
      reject(error);
    });
  });
});




// Handle file dialog for selecting and moving files
ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Videos', extensions: ['mp4', 'avi', 'mov', 'mkv'] }],
  });

  if (result.filePaths && result.filePaths.length > 0) {
    const selectedFilePath = result.filePaths[0];

    // Define the 'import' folder path in your repo (root level)
    const importFolderPath = path.join(__dirname, '..', 'import');  // Root-level 'import' folder
    if (!fs.existsSync(importFolderPath)) {
      // Create the 'import' folder if it doesn't exist
      fs.mkdirSync(importFolderPath, { recursive: true });
      console.log(`Import folder created at: ${importFolderPath}`);
    }

    // Move the selected file to the 'import' folder
    const fileName = path.basename(selectedFilePath);
    const newFilePath = path.join(importFolderPath, fileName);

    fs.copyFileSync(selectedFilePath, newFilePath);  // This moves the file

    console.log(`File moved to: ${newFilePath}`);
    
    return newFilePath;  // Return the new file path
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
