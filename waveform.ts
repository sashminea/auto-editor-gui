import { app, ipcMain } from "electron";
import { spawn, type ChildProcess } from "child_process";
import fs from "fs";
import path from "path";

// Reads the audio of a file and returns loudness (dB, 30 values per second) for the waveform preview.
// Runs with the same Python that runs auto-editor (it already ships PyAV + numpy).
const SCRIPT = String.raw`import sys, json
try:
    import av
    import numpy as np
except Exception as e:
    sys.stdout.write(json.dumps({'ok': False, 'error': 'Missing Python module: ' + str(e)}))
    sys.exit(0)

FPS = 30
RATE = 9000
WIN = RATE // FPS  # 300 samples = 1/30 s


def as_list(out):
    if out is None:
        return []
    return out if isinstance(out, (list, tuple)) else [out]


def main(path):
    c = av.open(path)
    stream = next((s for s in c.streams if s.type == 'audio'), None)
    if stream is None:
        return {'ok': False, 'error': 'no-audio'}
    try:
        stream.thread_type = 'AUTO'
    except Exception:
        pass
    rs = av.AudioResampler(format='s16', layout='mono', rate=RATE)
    levels = []
    state = {'rest': np.zeros(0, dtype=np.int16)}

    def feed(frames):
        for f in frames:
            data = np.concatenate([state['rest'], f.to_ndarray().reshape(-1)])
            n = len(data) // WIN
            if n:
                chunk = np.abs(data[:n * WIN].astype(np.float32)) / 32768.0
                levels.extend(chunk.reshape(n, WIN).max(axis=1).tolist())
            state['rest'] = data[n * WIN:]

    try:
        for frame in c.decode(stream):
            feed(as_list(rs.resample(frame)))
        feed(as_list(rs.resample(None)))
    except Exception:
        if not levels:
            raise
    c.close()
    if not levels:
        return {'ok': False, 'error': 'no-audio'}
    arr = np.array(levels, dtype=np.float32)
    db = 20.0 * np.log10(np.maximum(arr, 1e-4))
    return {'ok': True, 'fps': FPS, 'duration': len(levels) / FPS, 'levels': np.round(db, 1).tolist()}


try:
    sys.stdout.write(json.dumps(main(sys.argv[1])))
except Exception as e:
    sys.stdout.write(json.dumps({'ok': False, 'error': str(e)}))
`;

interface RunnerLike {
  cmd: string;
  prefix: string[];
  cwd?: string;
  module: boolean;
}
type Resolve = (force?: boolean) => { runner?: RunnerLike; error?: string };

const cache = new Map<string, unknown>();
let active: ChildProcess | null = null;

export function registerWaveformIpc(resolveRunner: Resolve, log: (...p: unknown[]) => void) {
  ipcMain.handle("get-waveform", async (_e, filePath: string) => {
    try {
      const stat = fs.statSync(filePath);
      const key = `${filePath}|${stat.size}|${stat.mtimeMs}`;
      if (cache.has(key)) return cache.get(key);

      const { runner } = resolveRunner();
      if (!runner || !runner.module) return { ok: false, error: "Waveform preview needs the bundled Python." };

      const script = path.join(app.getPath("userData"), "waveform.py");
      fs.mkdirSync(path.dirname(script), { recursive: true });
      fs.writeFileSync(script, SCRIPT);

      if (active) active.kill(); // a newer file replaces an older analysis
      const result = await new Promise<unknown>((resolve) => {
        const child = spawn(runner.cmd, [...runner.prefix, script, filePath], {
          cwd: runner.cwd,
          windowsHide: true,
          env: { ...process.env, PYTHONIOENCODING: "utf-8", PYTHONUNBUFFERED: "1" },
        });
        active = child;
        const out: Buffer[] = [];
        child.stdout?.on("data", (d: Buffer) => out.push(d));
        child.on("error", (err) => resolve({ ok: false, error: err.message }));
        child.on("close", (code, signal) => {
          if (active === child) active = null;
          if (signal) return resolve({ ok: false, error: "superseded" });
          try {
            resolve(JSON.parse(Buffer.concat(out).toString("utf8")));
          } catch {
            resolve({ ok: false, error: `Could not read the audio (exit ${code}).` });
          }
        });
      });
      if ((result as { ok?: boolean }).ok) {
        if (cache.size > 6) cache.delete(cache.keys().next().value as string);
        cache.set(key, result);
      } else {
        log("Waveform failed:", JSON.stringify(result).slice(0, 300));
      }
      return result;
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  });
}
