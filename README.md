# 🎥 Auto-Editor GUI

Welcome to the **Auto-Editor GUI** project! This is a modified version of the original Auto-Editor, designed to provide a user-friendly graphical interface for editing videos using the Auto-Editor CLI tool. 

<p align="center"><img src="https://auto-editor.com/img/auto-editor-banner.webp" title="Auto-Editor" width="700"></p>

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

## 🌟 Features

- User-friendly interface for video editing. 🎬
- Easy selection of video files. 🖱️
- Clear logging of actions and results. 📊
- Modern UI components with Tailwind CSS. 🛠️
- Built-in dark mode for comfortable viewing. 🌒

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

### 📝 Installation & Using the Application

1. Clone this repository:

   ```bash
   git clone https://github.com/sashminea/auto-editor-gui.git
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
   npm run start
   ```


## 🤝 Contribution

Contributions are welcome! If you have suggestions or improvements, feel free to submit a pull request. 💡

## 🙏 Acknowledgments

- Thanks to the original developers of Auto-Editor for creating the CLI tool. ❤️
- Inspired by the community and developers contributing to open-source projects. 🌍

---
