import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomInputProps {
  label: string;
  id: string;
  placeholder: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ArgumentInput: React.FC<CustomInputProps> = ({ label, id, placeholder, value, onChange }) => {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input type="number" id={id} placeholder={placeholder} value={value} onChange={onChange} />
    </div>
  );
};

export default ArgumentInput;
