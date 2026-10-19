export type PageId = "quick" | "cuts" | "detection" | "output" | "advanced";
export type Extras = Record<string, string | boolean>;

export interface OptionDef {
  flag: string; // CLI flag, also the key in Extras
  label: string;
  help: string;
  type: "text" | "number" | "select" | "bool";
  placeholder?: string;
  unit?: string;
  options?: { value: string; label: string }[]; // select only ("" = default is added automatically)
  multi?: boolean; // value is split on whitespace into several arguments
}

export const PAGES: { id: PageId; title: string; blurb: string }[] = [
  {
    id: "quick",
    title: "Quick Edit",
    blurb: "Pick a video, set loudness and margin, export.",
  },
  {
    id: "cuts",
    title: "Cuts & Speed",
    blurb: "Manual cuts, add-ins and playback speed for kept and cut sections.",
  },
  {
    id: "detection",
    title: "Detection",
    blurb: "Choose how auto-editor decides what to cut.",
  },
  {
    id: "output",
    title: "Output",
    blurb: "Resolution, frame rate, codecs, bitrates and audio.",
  },
  {
    id: "advanced",
    title: "Advanced",
    blurb: "Behaviour flags and a free-form field for anything else.",
  },
];

export const CUTS: OptionDef[] = [
  {
    flag: "--cut-out",
    label: "Cut out",
    type: "text",
    multi: true,
    placeholder: "start,5sec 30sec,40sec",
    help: "Ranges to remove, separated by spaces. Each range is start,end (e.g. start,10sec or -10sec,end).",
  },
  {
    flag: "--add-in",
    label: "Add in",
    type: "text",
    multi: true,
    placeholder: "start,5sec",
    help: "Ranges to force-keep, separated by spaces. Useful with “Cut everything” on the Detection page.",
  },
  {
    flag: "--set-speed",
    label: "Set speed for a range",
    type: "text",
    multi: true,
    placeholder: "2,10sec,30sec",
    help: "Ranges with their own speed, separated by spaces. Each is SPEED,START,STOP.",
  },
  {
    flag: "--video-speed",
    label: "Kept sections speed",
    type: "number",
    placeholder: "1",
    unit: "×",
    help: "Playback speed of the parts that are kept.",
  },
  {
    flag: "--silent-speed",
    label: "Cut sections speed",
    type: "number",
    placeholder: "99999",
    unit: "×",
    help: "Playback speed of the parts that would be cut. 99999 effectively removes them; 1 keeps them.",
  },
];

export const DETECTION: OptionDef[] = [
  {
    flag: "detect.method",
    label: "Edit method",
    type: "select",
    help: "Passed as --edit. “Audio loudness” uses the loudness value from Quick Edit.",
    options: [
      { value: "motion", label: "Motion" },
      { value: "audio-or-motion", label: "Audio or motion" },
      { value: "none", label: "Nothing (keep everything)" },
      { value: "all/e", label: "Cut everything" },
    ],
  },
  {
    flag: "detect.motion",
    label: "Motion threshold",
    type: "number",
    placeholder: "0.02",
    help: "Fraction of the frame that must change to count as motion (0.02 = 2%).",
  },
];

export const OUTPUT: OptionDef[] = [
  {
    flag: "--resolution",
    label: "Resolution",
    type: "text",
    placeholder: "1920,1080",
    help: "Width,height of the exported video.",
  },
  {
    flag: "--scale",
    label: "Scale",
    type: "number",
    placeholder: "1",
    unit: "×",
    help: "Scale the resolution by this factor.",
  },
  {
    flag: "--frame-rate",
    label: "Frame rate",
    type: "number",
    placeholder: "30",
    unit: "fps",
    help: "Output frame rate.",
  },
  {
    flag: "--sample-rate",
    label: "Sample rate",
    type: "number",
    placeholder: "48000",
    unit: "Hz",
    help: "Output audio sample rate.",
  },
  {
    flag: "--video-codec",
    label: "Video codec",
    type: "text",
    placeholder: "libx264",
    help: "FFmpeg video codec name.",
  },
  {
    flag: "--audio-codec",
    label: "Audio codec",
    type: "text",
    placeholder: "aac",
    help: "FFmpeg audio codec name.",
  },
  {
    flag: "--video-bitrate",
    label: "Video bitrate",
    type: "text",
    placeholder: "5M",
    help: "For example 5M or 800k.",
  },
  {
    flag: "--audio-bitrate",
    label: "Audio bitrate",
    type: "text",
    placeholder: "192k",
    help: "For example 192k.",
  },
  {
    flag: "-profile:v",
    label: "Video profile",
    type: "text",
    placeholder: "high",
    help: "For h264: high, main or baseline.",
  },
  {
    flag: "--audio-layout",
    label: "Audio layout",
    type: "text",
    placeholder: "stereo",
    help: "Channel layout of the output audio.",
  },
  {
    flag: "--mix-audio-streams",
    label: "Mix audio streams",
    type: "bool",
    help: "Mix all audio streams together into one.",
  },
  {
    flag: "--audio-normalize",
    label: "Normalize audio",
    type: "text",
    placeholder: "ebu",
    help: "Normalization method (see auto_editor --help for your version).",
  },
  {
    flag: "--background",
    label: "Background colour",
    type: "text",
    placeholder: "#000000",
    help: "Colour used behind the video when needed.",
  },
];

export const ADVANCED: OptionDef[] = [
  {
    flag: "--no-open",
    label: "Don't open the result",
    type: "bool",
    help: "Stops auto-editor from opening the exported file when it finishes.",
  },
  {
    flag: "--preview",
    label: "Preview only",
    type: "bool",
    help: "Print statistics about what would be cut without exporting.",
  },
  {
    flag: "--no-cache",
    label: "Disable cache",
    type: "bool",
    help: "Don't reuse cached analysis between runs.",
  },
  {
    flag: "--debug",
    label: "Debug output",
    type: "bool",
    help: "Show extra diagnostic output in the progress log.",
  },
  {
    flag: "--no-faststart",
    label: "Disable faststart",
    type: "bool",
    help: "Faster for large files; faststart (web-friendly) is on by default.",
  },
  {
    flag: "--fragmented",
    label: "Fragmented mp4/mov",
    type: "bool",
    help: "Allows playback before the video is complete.",
  },
  {
    flag: "-sn",
    label: "Drop subtitle streams",
    type: "bool",
    help: "Leave subtitle streams out of the output.",
  },
  {
    flag: "-dn",
    label: "Drop data streams",
    type: "bool",
    help: "Leave data streams out of the output.",
  },
  {
    flag: "--no-seek",
    label: "Disable seeking",
    type: "bool",
    help: "Helpful for debugging video desync issues.",
  },
  {
    flag: "--player",
    label: "Player command",
    type: "text",
    placeholder: "vlc",
    help: "Program used to open the output when it finishes.",
  },
  {
    flag: "--temp-dir",
    label: "Temp folder",
    type: "text",
    placeholder: "D:\\temp",
    help: "Where intermediate files are written.",
  },
  {
    flag: "raw",
    label: "Extra arguments",
    type: "text",
    placeholder: "--your-flag value",
    help: "Appended to the command exactly as typed. Use this for any option not listed here.",
  },
];

const GENERIC = [...CUTS, ...OUTPUT, ...ADVANCED];

const isSet = (v: string | boolean | undefined) =>
  v === true || (typeof v === "string" && v.trim() !== "");

export const activeCount = (defs: OptionDef[], extras: Extras) =>
  defs.filter((d) => isSet(extras[d.flag])).length;

// The --edit value. With no method chosen this is exactly what Quick Edit always produced.
export function composeEdit(extras: Extras, loudness: number): string {
  const motion = String(extras["detect.motion"] ?? "").trim() || "0.02";
  switch (String(extras["detect.method"] ?? "")) {
    case "motion":
      return `motion:threshold=${motion}`;
    case "audio-or-motion":
      return `"(or audio:${loudness}dB motion:threshold=${motion})"`;
    case "none":
      return "none";
    case "all/e":
      return "all/e";
    default:
      return `audio:${loudness}dB`;
  }
}

// Extra CLI tokens from the Cuts / Output / Advanced pages, in page order.
export function extraArgs(extras: Extras): string[] {
  const out: string[] = [];
  for (const d of GENERIC) {
    const v = extras[d.flag];
    if (!isSet(v)) continue;
    if (d.type === "bool") {
      out.push(d.flag);
      continue;
    }
    const s = String(v).trim();
    if (d.flag === "raw") out.push(...(s.match(/"[^"]*"|\S+/g) ?? []));
    else if (d.multi) out.push(d.flag, ...s.split(/\s+/));
    else out.push(d.flag, /\s/.test(s) ? `"${s}"` : s);
  }
  return out;
}
