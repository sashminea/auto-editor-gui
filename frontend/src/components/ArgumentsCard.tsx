import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import ArgumentInput from "./InputLoudness";

interface CardWithArgumentsProps {
  onExport: (loudness: number, margin: number) => void;
  onApply: (loudness: number, margin: number) => void;
}

const CardWithArguments: React.FC<CardWithArgumentsProps> = ({ onExport, onApply }) => {
  const [loudness, setLoudness] = React.useState<number>(-19);
  const [margin, setMargin] = React.useState<number>(0);

  const handleLoudnessChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoudness(Number(event.target.value));
  };

  const handleMarginChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMargin(Number(event.target.value));
  };

  const handleExport = () => {
    onExport(loudness, margin);
  };

  const handleApply = () => {
    onApply(loudness, margin);
  };

  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Adjust arguments</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid w-full items-center gap-4">
          <div className="flex flex-col space-y-1.5">
            <ArgumentInput label="Loudness" id="loudness" placeholder="-19dB" value={loudness} onChange={handleLoudnessChange} />
          </div>

          <div className="flex flex-col space-y-1.5">
            <ArgumentInput label="Margin" id="margin" placeholder="None" value={margin} onChange={handleMarginChange} />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button onClick={handleApply}>Apply</Button>
        <Button onClick={handleExport}>Export</Button>
      </CardFooter>
    </Card>
  );
};

export default CardWithArguments;
