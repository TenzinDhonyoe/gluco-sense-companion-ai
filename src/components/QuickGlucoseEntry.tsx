
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Droplets } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import GlucoseEntryForm from "./GlucoseEntryForm";

const QuickGlucoseEntry = () => {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-blue-200 hover:bg-blue-50 h-12 text-sm"
        >
          <Droplets className="w-4 h-4 mr-2 text-blue-500" />
          Log Glucose
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Quick Glucose Entry</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <GlucoseEntryForm
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default QuickGlucoseEntry;
