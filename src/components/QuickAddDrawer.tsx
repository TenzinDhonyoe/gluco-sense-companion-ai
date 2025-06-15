import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Plus, Camera, Dumbbell, Coffee, Apple } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addLog } from "@/lib/logStore";

type LogType = 'exercise' | 'snack' | 'beverage';

const QuickAddDrawer = () => {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);

  const handleLog = (type: LogType, description: string, points: number) => {
    addLog({ type, description, points });
    let title = "";
    let toastDescription = "";

    switch (type) {
      case 'exercise':
        title = "Workout Logged";
        toastDescription = `${description} added to your activity log! (+${points} points)`;
        break;
      case 'snack':
        title = "Snack Logged";
        toastDescription = `${description} added to your food log! (+${points} points)`;
        break;
      case 'beverage':
        title = "Beverage Logged";
        toastDescription = `${description} added to your log! (+${points} points)`;
        break;
    }

    toast({
      title,
      description: toastDescription,
    });
    setOpen(false);
  };

  const handleMealPhoto = () => {
    toast({
      title: "Camera Feature",
      description: "Meal photo logging will be implemented with device camera access.",
    });
    setOpen(false);
  };

  const quickActions = [
    {
      label: "Log Meal",
      icon: Camera,
      color: "text-blue-500",
      borderColor: "border-blue-200",
      hoverBg: "hover:bg-blue-50",
      handler: handleMealPhoto,
    },
    {
      label: "Quick Workout",
      icon: Dumbbell,
      color: "text-green-500",
      borderColor: "border-green-200",
      hoverBg: "hover:bg-green-50",
      handler: () => handleLog('exercise', 'Quick 15-minute walk', 25),
    },
    {
      label: "Log Snack",
      icon: Apple,
      color: "text-orange-500",
      borderColor: "border-orange-200",
      hoverBg: "hover:bg-orange-50",
      handler: () => handleLog('snack', 'Apple', 10),
    },
    {
      label: "Beverage",
      icon: Coffee,
      color: "text-purple-500",
      borderColor: "border-purple-200",
      hoverBg: "hover:bg-purple-50",
      handler: () => handleLog('beverage', 'Water', 5),
    },
  ];

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="icon" className="bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-lg transition hover:scale-105">
          <Plus className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle>Quick Add</DrawerTitle>
        </DrawerHeader>
        <div className="grid grid-cols-2 gap-3 p-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.label}
                onClick={action.handler}
                variant="outline"
                className={`flex flex-col items-center justify-center space-y-2 h-auto py-4 ${action.borderColor} ${action.hoverBg}`}
              >
                <Icon className={`w-6 h-6 ${action.color}`} />
                <span className="text-sm font-medium text-gray-800">{action.label}</span>
              </Button>
            );
          })}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default QuickAddDrawer;
