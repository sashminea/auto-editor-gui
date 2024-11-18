const fs = require('fs');
const path = require('path');

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