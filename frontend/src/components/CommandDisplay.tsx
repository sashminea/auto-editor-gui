import React, { useState } from "react";
import { CheckIcon, CopyIcon } from "@radix-ui/react-icons";

// The site's dark .cmd box: program, --flags and quoted paths coloured
const colourise = (command: string) =>
  command
    .split(/("[^"]*"|\s+)/)
    .filter((t) => t !== "")
    .map((t, i) => {
      if (/^\s+$/.test(t)) return <span key={i}>{t}</span>;
      if (t.startsWith("--")) return <span key={i} className="text-[#f3b77b]">{t}</span>;
      if (t.startsWith('"')) return <span key={i} className="text-[#9bd98c]">{t}</span>;
      if (i === 0) return <span key={i} className="text-[#c4a3ff]">{t}</span>;
      return <span key={i}>{t}</span>;
    });

const CommandDisplay: React.FC<{ command: string }> = ({ command }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl bg-[#15101f] py-1 pl-4 pr-1.5">
      <pre className="min-w-0 flex-1 overflow-x-auto whitespace-pre py-2 font-mono text-xs leading-none text-white/90 [scrollbar-width:none]" title={command}>
        {command ? colourise(command) : <span className="text-white/50">Your command appears here.</span>}
      </pre>
      <button
        type="button"
        onClick={copy}
        disabled={!command}
        className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs text-white/80 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-40"
      >
        {copied ? <CheckIcon /> : <CopyIcon />} {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
};

export default CommandDisplay;
