import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { OptionDef } from "@/lib/options";

const UNSET = "__default__"; // Radix Select can't use "" as a value

interface OptionFieldProps {
  def: OptionDef;
  value: string | boolean | undefined;
  onChange: (flag: string, value: string | boolean) => void;
}

const Help: React.FC<{ def: OptionDef }> = ({ def }) => (
  <p className="text-xs text-muted-foreground">
    {def.help} {def.flag !== "raw" && !def.flag.includes(".") && <code className="font-mono">{def.flag}</code>}
  </p>
);

export const OptionField: React.FC<OptionFieldProps> = ({ def, value, onChange }) => {
  const id = `opt-${def.flag.replace(/\W/g, "")}`;

  if (def.type === "bool") {
    return (
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-accent/40">
        <input
          id={id}
          type="checkbox"
          checked={value === true}
          onChange={(e) => onChange(def.flag, e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
        />
        <span className="grid gap-0.5">
          <span className="text-sm font-medium leading-tight">{def.label}</span>
          <Help def={def} />
        </span>
      </label>
    );
  }

  return (
    <div className="grid content-start gap-1.5">
      <Label htmlFor={id}>{def.label}</Label>
      {def.type === "select" ? (
        <Select value={(value as string) || UNSET} onValueChange={(v) => onChange(def.flag, v === UNSET ? "" : v)}>
          <SelectTrigger id={id}><SelectValue /></SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={UNSET}>Default (audio loudness)</SelectItem>
            {def.options!.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
      ) : (
        <div className="relative">
          <Input
            id={id}
            type={def.type === "number" ? "number" : "text"}
            step={def.type === "number" ? "any" : undefined}
            placeholder={def.placeholder}
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(def.flag, e.target.value)}
            className={def.unit ? "pr-10" : undefined}
          />
          {def.unit && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{def.unit}</span>
          )}
        </div>
      )}
      <Help def={def} />
    </div>
  );
};