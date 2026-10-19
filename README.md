# Auto-Editor GUI

A desktop app that puts a friendly interface on top of [Auto-Editor](https://github.com/WyattBlue/auto-editor), the command-line tool that automatically cuts the dead space (usually silence) out of video and audio.

Cutting silence by hand is a slow first pass on any long recording. Auto-Editor does it by analysing loudness. This GUI lets you pick a file, tune the settings, preview your clip, and run the edit without writing a command yourself.

<!-- Update this screenshot to show the redesigned UI -->
<img width="1488" height="960" alt="Auto-Editor GUI" src="https://github.com/user-attachments/assets/27ce8d0e-22b7-4ade-871d-fb78b6c3c874" />

## Features

- **Export formats.** Premiere Pro XML, Resolve FCP7 XML, Final Cut Pro XML, Shotcut MLT, or audio only.
- **Editing controls.** Set the loudness threshold (dB) and the margin (seconds) kept around the cuts.
- **Keyboard shortcuts:** `Ctrl/⌘+O` open a video, `Ctrl/⌘+Enter` export, `Ctrl/⌘+1…5` switch pages, `Esc` dismiss alerts.

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
├── auto_editor/        # Auto-Editor 28.0.2 (Python), bundled in this repo
├── frontend/           # React + Vite + Tailwind + shadcn/ui interface
│   └── src/
│       ├── components/ # Layout, Sidebar, pages, cards, dialogs
│       └── lib/        # options (CLI flag definitions), files, theme, storage
├── main.ts             # Electron main process: window, running auto_editor, dialogs
├── preload.ts          # Safe bridge between the window and the main process
├── run.js              # Cross-platform start script
├── pyproject.toml      # Python dependencies for auto_editor
└── package.json        # Electron dependencies and scripts
```
 
The app runs the copy of `auto_editor` that lives in this repository, so end users never have to install Auto-Editor themselves.

## Requirements (development)
 
- [Node.js](https://nodejs.org/) 18 or newer
- [Python](https://www.python.org/) 3.10 or newer, available as `py -3` / `python` / `python3`
- The Python libraries Auto-Editor needs: `numpy` and `av`
## Getting started
 
1. Clone the repository:
```bash
   git clone https://github.com/sashminea/auto-editor-gui.git
   cd auto-editor-gui
```
 
2. Install the Python libraries (Auto-Editor itself is already in the repo, so this installs only its dependencies):
```bash
   python -m pip install "numpy>=2,<3" "av>=15.0.0rc1,<16"
```
 
   You can confirm it works with `python -m auto_editor --help` from the repo root.
 
3. Install the Electron dependencies (root folder):
```bash
   npm install
```
 
4. Install the frontend dependencies and start the dev server:
```bash
   cd frontend
   npm install
   npm run dev
```
 
5. In a second terminal, from the repo root, start the app:
```bash
   npm run start
```
 
## How to use it
 
1. Open a video by dropping it onto the preview or pressing **Select video file**.
2. Set **Loudness** (anything quieter than this is cut) and **Margin** (how much to keep around loud parts).
3. Choose what to export as: Premiere Pro XML, Resolve FCP7 XML, Final Cut Pro XML, Shotcut MLT or audio only.
4. Press **Apply** to see the generated command, then **Export**. Watch the progress bar, or press **Cancel** to stop.
5. When it finishes, use **Open output folder** to find the result.
For finer control, open the other pages from the sidebar. Their options are added to the command automatically. Fields you leave empty are not passed to Auto-Editor.
 
## Troubleshooting
 
| Problem | What to do |
| --- | --- |
| An error about Python or `auto_editor` on launch | Check that `python -m auto_editor --help` works from the repo root, and that `numpy` and `av` are installed. |
| `No module named auto_editor.__main__` | The `auto_editor/` folder is missing its Python files. Restore it with `git checkout 6a3ae43c -- auto_editor`. |
| The preview says the format can't be previewed | Chromium can't play every format (for example some `.mkv` and `.avi` files). You can still export. |
| The progress bar stays empty | Open **Show output** in the Progress panel to see what Auto-Editor prints. |
| Something else went wrong | The app log is in the app's data folder, at `logs/main.log`. On Windows that is `%APPDATA%\auto-editor-gui\logs\main.log`. |


## Contributing

- Upstream Auto-Editor has been rewritten in Nim, and it is no longer a Python program. **Do not merge `upstream/master` into this repo**: it removes the Python source that this app runs. To take upstream changes, cherry-pick specific commits instead.
- The CLI options shown in the GUI are defined in `frontend/src/lib/options.ts`. They match Auto-Editor 28.0.2. If you update the bundled version, check them against `python -m auto_editor --help`.
- Ideas and pull requests are welcome. Fork the repository, create a branch, and open a pull request describing what you changed and why.

## Credits and license

Auto-Editor is created by [Wyatt Blue](https://github.com/WyattBlue/auto-editor), and this project builds a GUI around it. See the repository's `LICENSE` file for terms.

Questions or feedback? Reach out on [LinkedIn](https://www.linkedin.com/in/sashminadhikari/).
