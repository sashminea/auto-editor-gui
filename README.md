# Auto-Editor GUI

A desktop app that puts a friendly interface on top of [Auto-Editor](https://github.com/WyattBlue/auto-editor), the command-line tool that automatically cuts the dead space (usually silence) out of video and audio.

Cutting silence by hand is a slow first pass on any long recording. Auto-Editor does it by analysing loudness. This GUI lets you pick a file, tune the settings, preview your clip, and run the edit without writing a command yourself.

<!-- Update this screenshot to show the redesigned UI -->
<img width="1488" height="960" alt="Auto-Editor GUI" src="https://github.com/user-attachments/assets/27ce8d0e-22b7-4ade-871d-fb78b6c3c874" />

## Features

- **Export formats.** Premiere Pro XML, Resolve FCP7 XML, Final Cut Pro XML, Shotcut MLT, or audio only.
- **Editing controls.** Set the loudness threshold (dB) and the margin (seconds) kept around the cuts.

## How it works

The GUI builds an `auto_editor` command from your inputs and runs it through the Python module bundled in this repository. The command looks like this:

```
auto_editor "my-video.mp4" --export premiere --edit audio:-19dB --margin 0s
```

The Electron main process runs it, streams its output back to the interface, and writes the result to the `output` folder.

## Tech stack

Electron, React 18, TypeScript, Vite, Tailwind CSS and shadcn/ui, with the Auto-Editor Python package as the backend.

## Project structure

```
auto-editor-gui/
├── auto_editor/            # Auto-Editor Python package (the CLI this app drives)
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Layout, TitleBar, VideoPreview, ExportXML, ...
│   │   ├── components/ui/  # shadcn/ui primitives
│   │   ├── lib/            # Theme and file helpers
│   │   └── index.css       # Theme variables (light and dark)
│   └── package.json        # Frontend dependencies
├── main.ts                 # Electron main process
├── preload.ts              # Bridge between Electron and the React app
├── create-folder.js        # Creates the output folder if it doesn't exist
├── tsconfig.json
└── package.json            # Electron dependencies
```

## Prerequisites

- [Node.js](https://nodejs.org/) 18 or newer
- [Python](https://www.python.org/) 3.11
- `pip`, to install the bundled Auto-Editor package

> **Windows note:** `main.ts` currently looks for Python at
> `C:\Users\<you>\AppData\Local\Programs\Python\Python311\python.exe`.
> Install Python 3.11 to its default location, or change `getPythonPath()` in `main.ts`.

## Getting started

1. **Clone the repository**

   ```bash
   git clone https://github.com/sashminea/auto-editor-gui.git
   cd auto-editor-gui
   ```

2. **Install the Auto-Editor package** (backend)

   ```bash
   pip install .
   ```

3. **Install the Electron dependencies** (from the repository root)

   ```bash
   npm install
   ```

4. **Install and start the frontend** (React, Vite, shadcn/ui)

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

5. **Start the Electron app.** Open a second terminal in the repository root and run:

   ```bash
   npm run start
   ```

   The app loads the frontend from `http://localhost:5173`, so keep step 4 running.

## Using the app

1. **Choose a video.** Drop a file onto the preview area, or press **Select video file**.
2. **Pick an export format** under **Export as**.
3. **Adjust the arguments.** Set **Loudness** (default `-19` dB) and **Margin** (default `0` s).
4. **Press Apply** to update the generated command, then check it in the command box.
5. **Press Export.** Watch the progress bar. Use **Show output** for the full log.
6. **Find your result** in the `output` folder in the project root, named after your video.

## Troubleshooting

| Problem | What to check |
|---|---|
| "Python not found" error | Python 3.11 must be at the path in `getPythonPath()` in `main.ts`. |
| The preview shows "This format can't be previewed here" | Some codecs (such as certain MKV files) can't play in the app. You can still export them. |
| The window is blank | Make sure `npm run dev` is running in `frontend/` before `npm run start`. |
| The progress bar stays empty | Open **Show output** to see what Auto-Editor prints. The bar reads a percentage from that text. |
| Dragging a file does nothing | The file must be a video or audio file. On older Electron versions, select it with the button instead. |


## Contributing

Ideas and pull requests are welcome. Fork the repository, create a branch, and open a pull request describing what you changed and why.

## Credits and license

Auto-Editor is created by [Wyatt Blue](https://github.com/WyattBlue/auto-editor), and this project builds a GUI around it. See the repository's `LICENSE` file for terms.

Questions or feedback? Reach out on [LinkedIn](https://www.linkedin.com/in/sashminadhikari/).
