
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Utensils } from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import MealEntryForm from "./MealEntryForm";

const QuickMealEntry = () => {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button
          variant="outline"
          className="w-full border-blue-200 hover:bg-blue-50"
        >
          <Utensils className="w-4 h-4 mr-2 text-blue-500" />
          Log Meal
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Quick Meal Entry</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-4">
          <MealEntryForm
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default QuickMealEntry;
