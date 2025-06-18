
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dumbbell } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import ExerciseEntryForm from "./ExerciseEntryForm";

const QuickExerciseEntry = () => {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-green-200 hover:bg-green-50"
        >
          <Dumbbell className="w-4 h-4 mr-2 text-green-500" />
          Log Exercise
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Quick Exercise Entry</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <ExerciseEntryForm
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default QuickExerciseEntry;
