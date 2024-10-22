import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

function InputFile() {
  return (
    <div className="grid w-full max-w-sm items-center gap-1.5">
      <Label htmlFor="picture">Import Video</Label>
      <Input id="video" type="file" />
    </div>
  )
}

export default InputFile;
