import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OptionField } from "./Fields";
import type { Extras, OptionDef } from "@/lib/options";

interface OptionsPageProps {
  title: string;
  blurb: string;
  defs: OptionDef[];
  values: Extras;
  onChange: (flag: string, value: string | boolean) => void;
  onReset: (flags: string[]) => void;
  children?: React.ReactNode; // optional extra card above the fields
}

const OptionsPage: React.FC<OptionsPageProps> = ({ title, blurb, defs, values, onChange, onReset, children }) => {
  const anySet = defs.some((d) => values[d.flag] === true || (typeof values[d.flag] === "string" && values[d.flag] !== ""));
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-4">
      <div className="mx-auto grid max-w-3xl gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-base font-semibold">{title}</h1>
            <p className="text-sm text-muted-foreground">{blurb}</p>
          </div>
          <Button variant="ghost" size="sm" disabled={!anySet} onClick={() => onReset(defs.map((d) => d.flag))}>Reset page</Button>
        </div>
        {children}
        <Card className="rounded-md shadow-none">
          <CardHeader className="border-b px-4 py-3">
            <CardTitle className="text-sm">Options</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
            {defs.map((d) => (
              <div key={d.flag} className={d.type === "text" && (d.multi || d.flag === "raw") ? "sm:col-span-2" : undefined}>
                <OptionField def={d} value={values[d.flag]} onChange={onChange} />
              </div>
            ))}
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          Empty fields are left out of the command, so auto-editor uses its own defaults. Available flags depend on the auto_editor version in your fork.
        </p>
      </div>
    </div>
  );
};

export default OptionsPage;