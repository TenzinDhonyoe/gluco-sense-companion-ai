
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
    <Drawer open={open} onOpenChange={setOpen} dismissible>
      <DrawerTrigger asChild>
        <Button
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 gap-2 text-sm rounded-xl"
        >
          <Droplets className="w-4 h-4 text-red-500" />
          Log Glucose
        </Button>
      </DrawerTrigger>
      <DrawerContent className="rounded-t-2xl">
        <DrawerHeader className="text-center px-6 pt-6">
          <DrawerTitle className="text-lg font-semibold">Log Glucose Reading</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-6">
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
