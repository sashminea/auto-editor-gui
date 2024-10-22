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
import ArgumentInput from "./InputLoudness"

function CardWithArguments() {
  return (
    <Card className="w-[350px]">
      <CardHeader>
        <CardTitle>Adjust arguments</CardTitle>
        <CardDescription>Specify variable values for automatic edit.</CardDescription>
      </CardHeader>
      <CardContent>
        <form>
          <div className="grid w-full items-center gap-4">
            {/* <div className="flex flex-col space-y-1.5">
              <Label htmlFor="name">Export as</Label>
              <Input id="name" placeholder="Filename" />
            </div> */}
    
            <div className="flex flex-col space-y-1.5">
               <ArgumentInput label="Loudness" id="loudness" placeholder="-19dB" />
            </div>
            <div className="flex flex-col space-y-1.5">
               <ArgumentInput label="Margin" id="margin" placeholder="None" />
            </div>
         
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-row-reverse justify-between">
        {/* <Button variant="outline">Cancel</Button> */}
        <Button>Export</Button>
      </CardFooter>
    </Card>
  )
}

export default CardWithArguments;