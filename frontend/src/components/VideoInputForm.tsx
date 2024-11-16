import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InputFileProps {
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  dialogOpened: boolean; // New prop to control whether the dialog is open or not
}

const InputFile: React.FC<InputFileProps> = ({ onFileChange, dialogOpened }) => {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="picture">Import Video</Label>
      <Input
        id="video"
        type="file"
        onChange={onFileChange}
        disabled={dialogOpened} // Disable the input if the dialog is already open
      />
    </div>
  );
};

export default InputFile;
