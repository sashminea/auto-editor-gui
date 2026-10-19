# Auto-Editor GUI

This is a modified version of the original Auto-Editor, designed to provide a user-friendly graphical interface for editing videos using the Auto-Editor CLI tool. Auto-Editor automatically edits video and audio by analyzing a variety of methods, most notably audio loudness. Before doing the real editing, you first cut out the "dead space" which is typically silence. This is known as a "first pass". Cutting these is a boring task, especially if the video is very long. This is where, Auto-Editor steps in.

<p align="center"><img src="https://auto-editor.com/img/auto-editor-banner.webp" title="Auto-Editor" width="700"></p>


### Project Structure

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


### Prerequisites

Ensure you have the following installed:

- [Node.js](https://nodejs.org/) (>= 14.x)
- [Electron](https://www.electronjs.org/) (for building the app; we'll integrate this later as a dependency)
- [Auto-Editor CLI](https://github.com/WZBSocialScienceCenter/auto-editor) (installed via `pip`)
- [Python](https://www.python.org/) (required for the Auto-Editor CLI)

### Installation & Using the Application

1. Clone this repository:

   ```bash
   git clone https://github.com/sashminea/auto-editor-gui.git
   cd auto-editor-gui
   ```

2. Install the Auto-Editor CLI (Python dependencies - Backend):

   ```bash
   pip install .
   ```

3. Install dependencies for the root directory (Electron dependencies - App):

   ```bash
   npm install
   ```


4. Navigate to the `frontend` folder and install dependencies and start localhost (React/ShadCN - Frontend):

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. In a second terminal (while in root directory) run the electron app:

   ```bash
   cd ..
   npm run start
   ```


---
