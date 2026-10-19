import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ArgumentInput from "./InputLoudness";

interface CardWithArgumentsProps {
  onExport: (loudness: number, margin: number) => void;
  onApply: (loudness: number, margin: number) => void;
  onCancel: () => void;
  initial: { loudness: number; margin: number }; // remembered values from last time
  applied?: { loudness: number; margin: number };
  busy?: boolean;
}

const CardWithArguments: React.FC<CardWithArgumentsProps> = ({ onExport, onApply, onCancel, initial, applied, busy }) => {
  const [loudness, setLoudness] = React.useState<number>(initial.loudness);
  const [margin, setMargin] = React.useState<number>(initial.margin);

  const dirty = !!applied && (applied.loudness !== loudness || applied.margin !== margin);

  return (
    <Card className="w-full rounded-md shadow-none">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-sm">Adjust arguments</CardTitle>
      </CardHeader>
      {/* Enter in either field applies the values */}
      <CardContent
        className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-1"
        onKeyDown={(e) => { if (e.key === "Enter") onApply(loudness, margin); }}
      >
        <ArgumentInput label="Loudness" id="loudness" placeholder="-19" suffix="dB" value={loudness} onChange={(e) => setLoudness(Number(e.target.value))} />
        <ArgumentInput label="Margin" id="margin" placeholder="0" suffix="s" value={margin} onChange={(e) => setMargin(Number(e.target.value))} />
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-3 p-4 pt-0">
        <p className="flex h-4 items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
          {dirty && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Not applied yet. Press Apply (or Enter) to update the command.
            </>
          )}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onApply(loudness, margin)}>Apply</Button>
          {busy ? (
            <Button variant="destructive" className="flex-1" onClick={onCancel}>Cancel</Button>
          ) : (
            <Button className="flex-1" onClick={() => onExport(loudness, margin)}>Export</Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

export default CardWithArguments;