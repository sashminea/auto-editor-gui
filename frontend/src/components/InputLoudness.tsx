
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CustomInputProps {
  label: string;
  id: string;
  placeholder: string;
}

const ArgumentInput: React.FC<CustomInputProps> = ({ label, id, placeholder }) => {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input type="number" id={id} placeholder={placeholder} />
    </div>
  );
};

export default ArgumentInput;