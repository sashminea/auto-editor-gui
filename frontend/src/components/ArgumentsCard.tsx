import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ArgumentInput from "./InputLoudness";

interface CardWithArgumentsProps {
  onExport: (loudness: number, margin: number) => void;
  onApply: (loudness: number, margin: number) => void;
  applied?: { loudness: number; margin: number }; // values currently reflected in the command
  busy?: boolean; // an export is running
}

const CardWithArguments: React.FC<CardWithArgumentsProps> = ({ onExport, onApply, applied, busy }) => {
  const [loudness, setLoudness] = React.useState<number>(-19);
  const [margin, setMargin] = React.useState<number>(0);

  const handleLoudnessChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoudness(Number(event.target.value));
  };

  const handleMarginChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMargin(Number(event.target.value));
  };

  const dirty = !!applied && (applied.loudness !== loudness || applied.margin !== margin);

  return (
    <Card className="w-full rounded-md shadow-none">
      <CardHeader className="border-b px-4 py-3">
        <CardTitle className="text-sm">Adjust arguments</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-1">
        <ArgumentInput label="Loudness" id="loudness" placeholder="-19" suffix="dB" value={loudness} onChange={handleLoudnessChange} />
        <ArgumentInput label="Margin" id="margin" placeholder="0" suffix="s" value={margin} onChange={handleMarginChange} />
      </CardContent>
      <CardFooter className="flex-col items-stretch gap-3 p-4 pt-0">
        <p className="flex h-4 items-center gap-2 text-xs text-muted-foreground" aria-live="polite">
          {dirty && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Not applied yet. Press Apply to update the command.
            </>
          )}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => onApply(loudness, margin)}>Apply</Button>
          <Button className="flex-1" disabled={busy} onClick={() => onExport(loudness, margin)}>
            {busy ? "Exporting…" : "Export"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CardWithArguments;