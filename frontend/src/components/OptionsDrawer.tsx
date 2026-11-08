import React, { useEffect, useMemo, useState } from "react";
import { Cross1Icon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { OptionField } from "./Fields";
import { ADVANCED, CUTS, DETECTION, OUTPUT, activeCount, type Extras, type OptionDef } from "@/lib/options";

type Tab = "cuts" | "detection" | "output" | "advanced";

const TABS: { id: Tab; title: string; blurb: string }[] = [
  { id: "cuts", title: "Cuts & speed", blurb: "Manual cuts, add-ins and playback speed." },
  { id: "detection", title: "Detection", blurb: "Choose how auto-editor decides what to cut." },
  { id: "output", title: "Output", blurb: "Resolution, frame rate, codecs, bitrates and audio." },
  { id: "advanced", title: "Advanced", blurb: "Behaviour flags and a free-form field for anything else." },
];

interface OptionsDrawerProps {
  extras: Extras;
  onChange: (flag: string, value: string | boolean) => void;
  onReset: (flags: string[]) => void;
  onPatch: (p: Extras) => void;
  onClose: () => void;
}

const OptionsDrawer: React.FC<OptionsDrawerProps> = ({ extras, onChange, onReset, onPatch, onClose }) => {
  const [tab, setTab] = useState<Tab>("cuts");

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onClose]);

  // The motion threshold only matters for the motion methods
  const detection: OptionDef[] = useMemo(
    () => DETECTION.filter((d) => d.flag !== "detect.motion" || /motion/.test(String(extras["detect.method"] ?? ""))),
    [extras],
  );
  const defs: Record<Tab, OptionDef[]> = { cuts: CUTS, detection, output: OUTPUT, advanced: ADVANCED };
  const current = defs[tab];
  const meta = TABS.find((t) => t.id === tab)!;
  const anySet = activeCount(current, extras) > 0;

  return (
    <div className="fixed inset-x-0 bottom-0 top-10 z-40">
      <div className="absolute inset-0 bg-foreground/20 backdrop-blur-[2px] animate-in fade-in duration-200" onClick={onClose} />
      <aside
        role="dialog"
        aria-label="More options"
        className="absolute right-0 top-0 flex h-full w-[min(460px,100vw)] flex-col border-l bg-background shadow-2xl animate-in slide-in-from-right duration-300"
      >
        <div className="flex items-start justify-between gap-3 p-5 pb-3">
          <div>
            <h2 className="text-2xl font-medium">More options</h2>
            <p className="mt-1 text-sm text-muted-foreground">Everything auto-editor can do. You rarely need these.</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <Cross1Icon />
          </Button>
        </div>

        <div className="flex flex-wrap gap-1.5 px-5 pb-3" role="tablist" aria-label="Option groups">
          {TABS.map((t) => {
            const count = activeCount(defs[t.id], extras);
            return (
              <button key={t.id} type="button" role="tab" className="chip gap-1.5" aria-selected={tab === t.id} aria-pressed={tab === t.id} onClick={() => setTab(t.id)}>
                {t.title}
                {count > 0 && <span className="mono-label rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-primary-foreground">{count}</span>}
              </button>
            );
          })}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-4">
          <p className="mb-4 text-sm text-muted-foreground">{meta.blurb}</p>
          <div className="grid gap-4">
            {tab === "cuts" && (
              <div className="flex items-center justify-between gap-3 rounded-2xl border p-4">
                <p className="text-sm text-muted-foreground">Want to see what gets removed? Keep only the cut parts instead.</p>
                <Button variant="outline" size="sm" className="shrink-0" onClick={() => onPatch({ "--video-speed": "99999", "--silent-speed": "1" })}>
                  Show the cut parts
                </Button>
              </div>
            )}
            {current.map((d) => (
              <OptionField key={d.flag} def={d} value={extras[d.flag]} onChange={onChange} />
            ))}
          </div>
          <p className="mt-5 text-xs text-muted-foreground">
            Empty fields are left out of the command, so auto-editor uses its own defaults.
          </p>
        </div>

        <div className="flex items-center justify-between gap-2 border-t p-4">
          <Button variant="ghost" size="sm" disabled={!anySet} onClick={() => onReset(current.map((d) => d.flag))}>
            Reset this group
          </Button>
          <Button onClick={onClose}>Done</Button>
        </div>
      </aside>
    </div>
  );
};

export default OptionsDrawer;
