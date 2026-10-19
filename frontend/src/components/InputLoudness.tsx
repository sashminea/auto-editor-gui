import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomInputProps {
  label: string;
  id: string;
  placeholder: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  suffix?: string; // unit shown inside the field, e.g. "dB"
}

const ArgumentInput: React.FC<CustomInputProps> = ({ label, id, placeholder, value, onChange, suffix }) => {
  return (
    <div className="grid w-full items-center gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input type="number" id={id} placeholder={placeholder} value={value} onChange={onChange} className={suffix ? "pr-9" : undefined} />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>
        )}
      </div>
    </div>
  );
};

export default ArgumentInput;