
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface stringInputProps {
  label: string;
  id: string;
  placeholder: string;
}

const StringInput: React.FC<stringInputProps> = ({ label, id, placeholder }) => {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input type="string" id={id} placeholder={placeholder} />
    </div>
  );
};

export default StringInput;