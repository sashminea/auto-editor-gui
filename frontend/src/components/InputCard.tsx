import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import InputFile from "./VideoInputForm"
import StringInput from "./stringInput"

function CardWithForm() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Choose a video file</CardTitle>
        <CardDescription>Eliminate silent sections from your video.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            {/* <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Export as</Label>
              <Input id="name" placeholder="Filename" />
            </div> */}
             <div className="flex flex-col space-y-1.5">
              <InputFile/>
            </div>
            
            <div className="flex flex-col space-y-1.5">
              <StringInput label="Export Path" id="exportPath" placeholder="C:\Auto Editor Output"/>
            </div>
         
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="framework">Export as</Label>
              <Select>
                <SelectTrigger id="framework">
                  <SelectValue placeholder="Premiere Pro XML" />
                </SelectTrigger>
                <SelectContent position="popper">
                  <SelectItem value="xml">Premiere Pro XML</SelectItem>
                  <SelectItem value="mp4">MP4</SelectItem>
                </SelectContent>
              </Select>
            </div>
           
         
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex justify-between">
        {/* <Button variant="outline">Cancel</Button> */}
        {/* <Button>Export</Button> */}
      </CardFooter>
    </Card>
  )
}

export default CardWithForm;