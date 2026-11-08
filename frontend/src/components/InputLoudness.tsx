import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomInputProps {
  label: string;
  id: string;
  placeholder: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suffix?: string; // unit shown inside the field, e.g. "dB"
  slider?: { min: number; max: number; step: number }; // optional range slider under the field (like the site demo)
}

const ArgumentInput: React.FC<CustomInputProps> = ({ label, id, placeholder, value, onChange, suffix, slider }) => {
  return (
    <div className="grid w-full items-center gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input type="number" id={id} placeholder={placeholder} value={value} onChange={onChange} className={suffix ? "pr-9" : undefined} />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
      {slider && (
        <input
          type="range"
          className="range"
          aria-label={`${label} slider`}
          min={slider.min}
          max={slider.max}
          step={slider.step}
          value={Math.min(slider.max, Math.max(slider.min, value))}
          onChange={onChange}
        />
      )}
    </div>
  );
};

export default ArgumentInput;
