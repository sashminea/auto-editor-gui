import React, { useState } from 'react';
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, CopyIcon } from "@radix-ui/react-icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CommandDisplayProps {
  command: string;
}

// Light syntax colouring: program name, --flags, quoted paths
const colourise = (command: string) =>
  command
    .split(/("[^"]*"|\s+)/)
    .filter((t) => t !== '')
    .map((t, i) => {
      if (/^\s+$/.test(t)) return <span key={i}>{t}</span>;
      if (t.startsWith('--')) return <span key={i} className="text-[#f3b77b]">{t}</span>;
      if (t.startsWith('"')) return <span key={i} className="text-[#9bd98c]">{t}</span>;
      if (i === 0) return <span key={i} className="font-medium text-[#c4a3ff]">{t}</span>;
      return <span key={i}>{t}</span>;
    });

const CommandDisplay: React.FC<CommandDisplayProps> = ({ command }) => {
  const [copied, setCopied] = useState(false);
  const [hidden, setHidden] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <Card className="shrink-0">
      <CardHeader className="flex-row items-center justify-between space-y-0 px-4 py-2">
        <CardTitle className="mono-label text-muted-foreground">Generated command</CardTitle>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={copy} disabled={!command}>
            {copied ? <CheckIcon /> : <CopyIcon />} {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setHidden((h) => !h)} aria-expanded={!hidden}>
            {hidden ? <ChevronDownIcon /> : <ChevronUpIcon />} {hidden ? "Show" : "Hide"}
          </Button>
        </div>
      </CardHeader>
      {!hidden && (
        <CardContent className="px-4 pb-4 pt-0">
          <pre className="max-h-28 overflow-auto whitespace-pre-wrap break-all rounded-xl bg-[#15101f] p-4 font-mono text-xs leading-relaxed text-white/90">
            {command ? colourise(command) : <span className="text-white/50">Select a file and press Apply to see the command.</span>}
          </pre>
        </CardContent>
      )}
    </Card>
  );
};

export default CommandDisplay;