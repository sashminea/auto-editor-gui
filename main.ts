import {
  app,
  BrowserWindow,
  ipcMain,
  dialog,
  protocol,
  net,
  shell,
  screen,
  Menu,
} from "electron";
import path from "path";
import { spawn, spawnSync, type ChildProcess } from "child_process";
import fs from "fs";
import os from "os";
import { pathToFileURL } from "url";

// ───────────────────────────── Paths & constants ─────────────────────────────
const isDev = !app.isPackaged;
const DEV_URL = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
// Vite build output. CHANGE this if your `vite build` writes somewhere else.
const RENDERER_INDEX = path.join(
  __dirname,
  "..",
  "frontend",
  "dist",
  "index.html",
);
const PRELOAD = path.join(__dirname, "..", "dist", "preload.js");

const MEDIA_EXT = new Set([
  ".mp4",
  ".m4v",
  ".mov",
  ".mkv",
  ".avi",
  ".webm",
  ".flv",
  ".wmv",
  ".ts",
  ".mp3",
  ".wav",
  ".flac",
  ".aac",
  ".m4a",
  ".ogg",
  ".opus",
]);

// Lets the <video> preview read local files (must run before app is ready)
protocol.registerSchemesAsPrivileged([
  {
    scheme: "local-media",
    privileges: { secure: true, supportFetchAPI: true, stream: true },
  },
]);

// ───────────────────────────── Logging & settings ─────────────────────────────
function log(...parts: unknown[]) {
  const line = `[${new Date().toISOString()}] ${parts.map(String).join(" ")}`;
  console.log(line);
  try {
    const file = path.join(app.getPath("userData"), "logs", "main.log");
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (fs.existsSync(file) && fs.statSync(file).size > 1_000_000)
      fs.truncateSync(file, 0);
    fs.appendFileSync(file, line + "\n");
  } catch {
    /* logging must never crash the app */
  }
}

interface Settings {
  outputDir?: string;
  bounds?: { x?: number; y?: number; width: number; height: number };
  maximized?: boolean;
}
let settings: Settings = {};
const settingsFile = () => path.join(app.getPath("userData"), "settings.json");
const loadSettings = () => {
  try {
    settings = JSON.parse(fs.readFileSync(settingsFile(), "utf8"));
  } catch {
    settings = {};
  }
};
const saveSettings = () => {
  try {
    fs.mkdirSync(path.dirname(settingsFile()), { recursive: true });
    fs.writeFileSync(settingsFile(), JSON.stringify(settings, null, 2));
  } catch (e) {
    log("Could not save settings:", e);
  }
};

// Exports go to the user's Videos folder (the app folder is read-only once installed)
const defaultOutputDir = () =>
  path.join(app.getPath("videos"), "Auto Editor Output");
const getOutputDir = () => {
  for (const dir of [settings.outputDir, defaultOutputDir()]) {
    if (!dir) continue;
    try {
      fs.mkdirSync(dir, { recursive: true });
      return dir;
    } catch (e) {
      log("Output dir unusable:", dir, e);
    }
  }
  return os.tmpdir();
};

// "clip.xml" -> "clip (1).xml" if it already exists, so exports never overwrite each other
const uniquePath = (dir: string, base: string, ext: string) => {
  let candidate = path.join(dir, base + ext);
  for (let i = 1; fs.existsSync(candidate); i++)
    candidate = path.join(dir, `${base} (${i})${ext}`);
  return candidate;
};

// ───────────────────────────── Python / auto-editor runtime ─────────────────────────────
// module=true runs `python -m auto_editor`; module=false runs the auto-editor executable directly
interface Runner {
  cmd: string;
  prefix: string[];
  cwd?: string;
  label: string;
  module: boolean;
}
let cachedRunner: Runner | undefined;

// Folder that contains the `auto_editor` package (your fork)
const autoEditorHome = () =>
  app.isPackaged
    ? path.join(process.resourcesPath, "auto-editor")
    : path.join(__dirname, "..");

// Directory that holds a runnable auto_editor package (auto_editor/__main__.py), if your fork ships one.
// Checks the project root and a nested copy of the repo; otherwise the pip-installed package is used.
const hasMain = (dir: string) =>
  fs.existsSync(path.join(dir, "auto_editor", "__main__.py"));
function findPackageHome(): string | undefined {
  const home = autoEditorHome();
  return [
    home,
    path.join(home, "auto_editor"),
    path.join(home, "auto-editor"),
  ].find(hasMain);
}

function resolveRunner(force = false): { runner?: Runner; error?: string } {
  if (cachedRunner && !force) return { runner: cachedRunner };

  const cwd = findPackageHome();
  const win = process.platform === "win32";

  const candidates: { cmd: string; prefix: string[] }[] = [];
  // 1. Python bundled with the release build
  const bundled = win
    ? path.join(process.resourcesPath ?? "", "python", "python.exe")
    : path.join(process.resourcesPath ?? "", "python", "bin", "python3");
  if (app.isPackaged && fs.existsSync(bundled))
    candidates.push({ cmd: bundled, prefix: [] });
  // 2. Explicit override
  if (process.env.AUTO_EDITOR_PYTHON)
    candidates.push({ cmd: process.env.AUTO_EDITOR_PYTHON, prefix: [] });
  // 3. System Python
  if (win) {
    candidates.push(
      { cmd: "py", prefix: ["-3"] },
      { cmd: "python", prefix: [] },
    );
    candidates.push({
      cmd: path.join(
        os.homedir(),
        "AppData",
        "Local",
        "Programs",
        "Python",
        "Python311",
        "python.exe",
      ),
      prefix: [],
    });
  } else {
    candidates.push(
      { cmd: "python3", prefix: [] },
      { cmd: "python", prefix: [] },
    );
  }

  let pythonFound = false;
  for (const c of candidates) {
    try {
      const r = spawnSync(
        c.cmd,
        [
          ...c.prefix,
          "-c",
          "import importlib.util as u,sys; sys.exit(0 if u.find_spec('auto_editor.__main__') else 1)",
        ],
        { cwd, timeout: 20000, windowsHide: true },
      );
      if (r.error) continue; // not installed / not runnable
      pythonFound = true;
      if (r.status === 0) {
        cachedRunner = {
          ...c,
          cwd,
          label: [c.cmd, ...c.prefix].join(" "),
          module: true,
        };
        log("Using runtime:", cachedRunner.label, "cwd:", cwd ?? "(none)");
        return { runner: cachedRunner };
      }
    } catch {
      /* try the next one */
    }
  }
  // 4. The standalone `auto-editor` executable (bundled with a release, or installed with pip / from the website)
  const exeName = win ? "auto-editor.exe" : "auto-editor";
  const exes = [
    app.isPackaged
      ? path.join(process.resourcesPath, "auto-editor", exeName)
      : "",
    process.env.AUTO_EDITOR_EXE ?? "",
    "auto-editor",
  ].filter(Boolean);
  for (const exe of exes) {
    try {
      const r = spawnSync(exe, ["--version"], {
        timeout: 20000,
        windowsHide: true,
      });
      if (!r.error && r.status === 0) {
        cachedRunner = {
          cmd: exe,
          prefix: [],
          label: `${exe} ${String(r.stdout).trim()}`,
          module: false,
        };
        log("Using runtime:", cachedRunner.label);
        return { runner: cachedRunner };
      }
    } catch {
      /* try the next one */
    }
  }

  return {
    error: pythonFound
      ? "auto-editor could not be started. Install it with: py -3 -m pip install auto-editor (then restart the app)."
      : "auto-editor was not found. Install Python 3.9+ (tick “Add python.exe to PATH”), run: py -3 -m pip install auto-editor, then restart the app.",
  };
}

// ───────────────────────────── Running exports ─────────────────────────────
let current: {
  child: ChildProcess;
  cancelled: boolean;
  outPath?: string;
} | null = null;

const killTree = (child: ChildProcess) => {
  if (!child.pid) return;
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      windowsHide: true,
    });
  } else {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
  }
};

const cancelCurrent = () => {
  if (!current) return false;
  current.cancelled = true;
  killTree(current.child);
  return true;
};

ipcMain.handle("run-command", async (event, args: string[]) => {
  if (current) throw new Error("An export is already running.");

  // The renderer splits on spaces; re-join and re-tokenise, keeping "quoted sections" together.
  const tokens: string[] = (args.join(" ").match(/"[^"]*"|\S+/g) ?? []).map(
    (t) => t.replace(/^"|"$/g, ""),
  );
  const moduleName = /^[\w.]+$/.test(tokens[0] ?? "")
    ? tokens[0]
    : "auto_editor";
  const inputFile = tokens[1];
  const restArgs = tokens.slice(2);
  if (!inputFile) throw new Error("No input file given.");
  if (!fs.existsSync(inputFile))
    throw new Error(`Video file not found:\n${inputFile}`);

  const { runner, error } = resolveRunner();
  if (!runner) throw new Error(error);

  // Export format -> output extension. Supports "--export premiere", "--export=premiere" and "premiere:name=..."
  const exportIdx = restArgs.findIndex(
    (a) => a === "--export" || a.startsWith("--export="),
  );
  const rawFormat =
    exportIdx === -1
      ? "mp4"
      : restArgs[exportIdx].includes("=")
        ? restArgs[exportIdx].split("=")[1]
        : restArgs[exportIdx + 1] || "mp4";
  const exportFormat = rawFormat.split(":")[0];

  const formatExtensions: Record<string, string> = {
    premiere: ".xml",
    "resolve-fcp7": ".xml",
    "final-cut-pro": ".xml",
    resolve: ".xml",
    shotcut: ".mlt",
    kdenlive: ".kdenlive",
    json: ".json",
    timeline: ".timeline",
    audio: ".mp3",
    "clip-sequence": ".clip-sequence",
    mp4: ".mp4",
  };
  const ext = formatExtensions[exportFormat] || ".mp4";

  const userSetOutput = restArgs.some(
    (a) =>
      a === "--output" ||
      a === "--output-file" ||
      a === "-o" ||
      a.startsWith("--output="),
  );
  const previewOnly =
    restArgs.includes("--preview") || restArgs.includes("--stats");
  const outPath = uniquePath(
    getOutputDir(),
    path.basename(inputFile, path.extname(inputFile)),
    ext,
  );

  // No shell: arguments are passed as an array, so spaces, parentheses and quotes in paths are safe
  const argv = [
    ...runner.prefix,
    ...(runner.module ? ["-m", moduleName] : []),
    inputFile,
    ...restArgs,
    ...(userSetOutput || previewOnly ? [] : ["--output", outPath]),
  ];
  log(
    "Executing:",
    runner.cmd,
    argv.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(" "),
  );

  return new Promise<string>((resolve, reject) => {
    const child = spawn(runner.cmd, argv, {
      cwd: runner.cwd,
      windowsHide: true,
      detached: process.platform !== "win32",
      // Unbuffered output is what makes the progress bar move live instead of all at the end
      env: {
        ...process.env,
        PYTHONUNBUFFERED: "1",
        PYTHONIOENCODING: "utf-8",
        NO_COLOR: "1",
      },
    });
    current = { child, cancelled: false, outPath };

    const tail: string[] = [];
    const forward = (data: Buffer) => {
      const text = data.toString();
      tail.push(
        ...text
          .split(/\r\n|\r|\n/)
          .map((s) => s.trim())
          .filter(Boolean),
      );
      if (tail.length > 12) tail.splice(0, tail.length - 12);
      if (!event.sender.isDestroyed()) event.sender.send("commandOutput", text);
    };
    child.stdout?.on("data", forward);
    child.stderr?.on("data", forward);

    child.on("close", (code) => {
      const run = current;
      current = null;
      log(
        "Process exited with code",
        code,
        run?.cancelled ? "(cancelled)" : "",
      );
      if (run?.cancelled) {
        try {
          if (run.outPath) fs.rmSync(run.outPath, { force: true });
        } catch {
          /* may still be locked */
        }
        reject(new Error("Export cancelled."));
      } else if (code === 0) {
        // 2nd line = where the result was written (the renderer uses it for "Open output folder")
        resolve(
          `Process completed successfully with code ${code}` +
            (userSetOutput || previewOnly ? "" : `\n${outPath}`),
        );
      } else {
        reject(
          new Error(
            `auto-editor exited with code ${code}.\n${tail.join("\n")}`,
          ),
        );
      }
    });
    child.on("error", (err) => {
      current = null;
      log("Process error:", err.message);
      reject(new Error(`Could not start auto-editor: ${err.message}`));
    });
  });
});

ipcMain.handle("cancel-command", () => cancelCurrent());

// ───────────────────────────── Dialogs, folders, misc IPC ─────────────────────────────
ipcMain.handle("open-file-dialog", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      {
        name: "Video & audio",
        extensions: [...MEDIA_EXT].map((e) => e.slice(1)),
      },
      { name: "All files", extensions: ["*"] },
    ],
  });
  // Cancelling returns null; the file is used where it is (no more copying into an import folder)
  return result.canceled || result.filePaths.length === 0
    ? null
    : result.filePaths[0];
});

ipcMain.handle("open-folder-dialog", async () => {
  const result = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  return result.canceled || result.filePaths.length === 0
    ? null
    : result.filePaths[0];
});

ipcMain.handle("get-output-dir", () => getOutputDir());

ipcMain.handle("choose-output-dir", async () => {
  const result = await dialog.showOpenDialog({
    title: "Choose where exports are saved",
    defaultPath: getOutputDir(),
    properties: ["openDirectory", "createDirectory"],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  settings.outputDir = result.filePaths[0];
  saveSettings();
  return settings.outputDir;
});

ipcMain.handle("reveal-path", (_e, p: string) => {
  if (!p || !fs.existsSync(p)) return false;
  if (fs.statSync(p).isDirectory()) shell.openPath(p);
  else shell.showItemInFolder(p);
  return true;
});

ipcMain.handle("check-runtime", () => {
  const r = resolveRunner(true);
  return r.runner
    ? { ok: true, detail: r.runner.label }
    : { ok: false, detail: r.error ?? "Unknown error" };
});

// Kept so older renderer code that still asks for it keeps working
ipcMain.handle("get-appdata-path", () => app.getPath("appData"));

// Recolour the native window buttons when the theme toggles
ipcMain.on("set-title-bar-theme", (e, theme: string) => {
  if (process.platform === "darwin") return;
  BrowserWindow.fromWebContents(e.sender)?.setTitleBarOverlay(
    theme === "dark"
      ? { color: "#212121", symbolColor: "#e6e6e6" }
      : { color: "#fcfcfc", symbolColor: "#1f1f1f" },
  );
});

// ───────────────────────────── Window ─────────────────────────────
let mainWindow: BrowserWindow | null = null;

const isAppUrl = (url: string) =>
  isDev
    ? url.startsWith(new URL(DEV_URL).origin)
    : url.split("#")[0] === pathToFileURL(RENDERER_INDEX).toString();

function savedBounds() {
  const b = settings.bounds;
  if (!b) return {};
  // Ignore saved positions that are now off-screen (e.g. a disconnected monitor)
  const visible = screen
    .getAllDisplays()
    .some(
      ({ workArea: w }) =>
        b.x !== undefined &&
        b.y !== undefined &&
        b.x < w.x + w.width &&
        b.x + b.width > w.x &&
        b.y < w.y + w.height &&
        b.y + b.height > w.y,
    );
  return visible ? b : { width: b.width, height: b.height };
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1180,
    height: 760,
    ...savedBounds(),
    minWidth: 760,
    minHeight: 600,
    show: false, // shown on ready-to-show, so there is no white flash
    title: "Auto-Editor GUI",
    backgroundColor: "#151515",
    autoHideMenuBar: true,
    titleBarStyle: "hidden",
    titleBarOverlay: { color: "#212121", symbolColor: "#e6e6e6", height: 40 },
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      devTools: isDev,
      disableDialogs: true,
      spellcheck: false,
      webviewTag: false,
      autoplayPolicy: "no-user-gesture-required",
      experimentalFeatures: false,
      safeDialogs: true,
    },
  });

  mainWindow.once("ready-to-show", () => {
    if (settings.maximized) mainWindow?.maximize();
    mainWindow?.show();
  });

  // Links open in the browser; the app window never navigates away (also stops dropped files replacing the UI)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (e, url) => {
    if (isAppUrl(url)) return;
    e.preventDefault();
    if (/^https?:\/\//.test(url)) shell.openExternal(url);
  });
  mainWindow.webContents.on("did-fail-load", (_e, code, desc, url) =>
    log("Renderer failed to load:", code, desc, url),
  );

  mainWindow.on("close", (e) => {
    if (current) {
      const choice = dialog.showMessageBoxSync(mainWindow!, {
        type: "question",
        buttons: ["Stop export and quit", "Keep exporting"],
        defaultId: 1,
        cancelId: 1,
        title: "Export in progress",
        message: "An export is still running.",
        detail: "Quitting now stops it and discards the partly written file.",
      });
      if (choice === 1) {
        e.preventDefault();
        return;
      }
      cancelCurrent();
    }
    if (mainWindow && !mainWindow.isMinimized()) {
      if (!mainWindow.isMaximized()) settings.bounds = mainWindow.getBounds();
      settings.maximized = mainWindow.isMaximized();
      saveSettings();
    }
  });
  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  if (isDev) mainWindow.loadURL(DEV_URL);
  else mainWindow.loadFile(RENDERER_INDEX);
}

// ───────────────────────────── App lifecycle ─────────────────────────────
if (!app.requestSingleInstanceLock()) {
  app.quit(); // a second copy would fight over the same files
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(() => {
    app.setAppUserModelId("com.sashminea.autoeditorgui"); // correct taskbar grouping on Windows
    loadSettings();
    if (process.platform !== "darwin") Menu.setApplicationMenu(null); // no default File/Edit menu

    protocol.handle("local-media", (req) => {
      let p = decodeURIComponent(new URL(req.url).pathname);
      if (/^\/[A-Za-z]:/.test(p)) p = p.slice(1); // Windows drive letter
      // Only media files can be read through this protocol
      if (!MEDIA_EXT.has(path.extname(p).toLowerCase()))
        return new Response("Forbidden", { status: 403 });
      return net.fetch(pathToFileURL(p).toString(), { headers: req.headers });
    });

    log(
      `Starting ${app.getName()} ${app.getVersion()} (${isDev ? "dev" : "packaged"}) on ${process.platform}`,
    );
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("before-quit", () => {
    cancelCurrent();
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
