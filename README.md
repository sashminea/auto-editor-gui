# 🎥 Auto-Editor GUI

Welcome to the **Auto-Editor GUI** project! This is a modified version of the original Auto-Editor, designed to provide a user-friendly graphical interface for editing videos using the Auto-Editor CLI tool. 

## 📸 Screenshots

### 🗒️ Updated Screenshot (11/17)
![Updated Screenshot](https://i.ibb.co/WVxwZXk/image.png)

### 🗒️ Initial Screenshot (10/22)
![Initial Screenshot](https://i.imgur.com/I6CT4By.png)

## 🛠️ Changes Made

- **GUI Implementation**: Integrated a React-based graphical user interface to simplify video editing tasks. 🎨
- **File Selection**: Added functionality for users to easily select video files through a file input instead of using command-line prompts. 📂
- **Real-time Feedback**: Implemented real-time logging to display command execution results and errors in the UI. 📜
- **Enhanced User Experience**: Improved the layout and design using Tailwind CSS and Shadcn for a modern look and feel. ✨
- **Dark Mode Default**: Set dark mode as the default theme for better visibility in various lighting conditions. 🌙
- **Folder Creation**: Added logic to ensure that the `Auto Editor Output` folder is created in the `AppData` directory if it doesn't already exist, enabling seamless file export. 📂
- **Admin Permissions**: Added instructions for running the application with admin privileges to ensure folder creation and access to system directories. 🛡️

## 🌟 Features

- User-friendly interface for video editing. 🎬
- Easy selection of video files. 🖱️
- Clear logging of actions and results. 📊
- Modern UI components with Tailwind CSS. 🛠️
- Built-in dark mode for comfortable viewing. 🌒
- Automatic creation of `Auto Editor Output` folder (if it doesn't already exist). 📁
- Instructions for running the app with admin privileges to handle folder creation issues. 🔑

## 📁 Project Structure

```
auto-editor-gui/
├── frontend/                # Contains the React application
│   ├── src/                # Source files for the React app
│   ├── public/             # Public assets
│   ├── package.json        # Dependencies for the frontend
│   └── ...
├── create-folder.js        # Script to create the output folder if it doesn't exist
├── main.ts                 # Main Electron process file
├── tsconfig.json           # TypeScript configuration
└── package.json            # Dependencies for the entire project
```

## 🚀 Getting Started

### 🔧 Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (>= 14.x)
- [Electron](https://www.electronjs.org/) (for building the app; we'll integrate this later as a dependency)
- [Auto-Editor CLI](https://github.com/WZBSocialScienceCenter/auto-editor) (installed via `pip`)
- [Python](https://www.python.org/) (required for the Auto-Editor CLI)

### 📝 Installation

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/auto-editor-gui.git
   cd auto-editor-gui
   ```

2. Install the Auto-Editor CLI:

   ```bash
   pip install .
   ```

3. Install dependencies for the root directory:

   ```bash
   npm install
   ```

4. Navigate to the `frontend` folder and install dependencies and start localhost:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. Navigate back to the root directory and run the electron app

   ```bash
   cd ..
   npm start
   ```

   This will create the `Auto Editor Output` folder if it doesn't exist and launch the app. If you encounter permissions issues, ensure that you're running the app with **admin privileges**.

### 📽️ Using the Application

The application is currently under development and, for now, can only be used to generate commands.

### 📝 Folder Creation Logic

If the `Auto Editor Output` folder in `AppData` does not exist, it will be created automatically upon running the app. This ensures smooth operation and avoids errors during file export. If you are experiencing issues with folder creation, please try running the app with **admin permissions**.

## 🤝 Contribution

Contributions are welcome! If you have suggestions or improvements, feel free to submit a pull request. 💡

## 🙏 Acknowledgments

- Thanks to the original developers of Auto-Editor for creating the CLI tool. ❤️
- Inspired by the community and developers contributing to open-source projects. 🌍

---
