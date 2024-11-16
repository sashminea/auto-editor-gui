import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StringInputProps {
  label: string;
  id: string;
  placeholder: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const StringInput: React.FC<StringInputProps> = ({ label, id, placeholder, onChange }) => {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input type="text" id={id} placeholder={placeholder} onChange={onChange} />
    </div>
  );
};

export default StringInput;
