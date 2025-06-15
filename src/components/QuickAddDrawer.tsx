
import * as React from "react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Camera, Dumbbell, Coffee, Apple } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addLog } from "@/lib/logStore";

type LogType = 'exercise' | 'snack' | 'beverage';

const QuickAddDrawer = () => {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [loggingStep, setLoggingStep] = React.useState(0); // 0: main view, 1: logging view
  const [currentLog, setCurrentLog] = React.useState<{type: LogType, label: string, icon: React.ElementType, points: number, defaultDescription: string} | null>(null);
  const [description, setDescription] = React.useState("");

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
  
  const handleCancelLogging = () => {
      setLoggingStep(0);
      setCurrentLog(null);
      setDescription("");
  };

  const logOptions = [
    {
      label: "Workout",
      icon: Dumbbell,
      color: "text-green-500",
      borderColor: "border-green-200",
      hoverBg: "hover:bg-green-50",
      type: 'exercise' as LogType,
      points: 25,
      defaultDescription: "Quick 15-minute walk",
    },
    {
      label: "Snack",
      icon: Apple,
      color: "text-orange-500",
      borderColor: "border-orange-200",
      hoverBg: "hover:bg-orange-50",
      type: 'snack' as LogType,
      points: 10,
      defaultDescription: "Apple",
    },
    {
      label: "Beverage",
      icon: Coffee,
      color: "text-purple-500",
      borderColor: "border-purple-200",
      hoverBg: "hover:bg-purple-50",
      type: 'beverage' as LogType,
      points: 5,
      defaultDescription: "Water",
    },
  ];

  const handleStartLogging = (option: typeof logOptions[number]) => {
      setCurrentLog(option);
      setDescription(option.defaultDescription);
      setLoggingStep(1);
  };
  
  const handleFinalLog = () => {
      if (!currentLog) return;
      if (!description.trim()) {
          toast({
              title: "Description required",
              description: "Please enter a description for your log.",
              variant: "destructive"
          });
          return;
      }
      handleLog(currentLog.type, description, currentLog.points);
  };

  return (
    <Drawer open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
            handleCancelLogging();
        }
    }}>
      <DrawerTrigger asChild>
        <Button size="icon" className="bg-gradient-to-br from-green-600 to-yellow-500 text-white rounded-full shadow-lg transition hover:scale-105">
          <Plus className="h-5 w-5" />
        </Button>
      </DrawerTrigger>
      <DrawerContent>
        {loggingStep === 0 ? (
          <>
            <DrawerHeader className="text-left">
              <DrawerTitle>Quick Add</DrawerTitle>
            </DrawerHeader>
            <div className="grid grid-cols-2 gap-3 p-4">
              <Button
                key="Log Meal"
                onClick={handleMealPhoto}
                variant="outline"
                className="flex flex-col items-center justify-center space-y-2 h-auto py-4 border-blue-200 hover:bg-blue-50"
              >
                <Camera className="w-6 h-6 text-blue-500" />
                <span className="text-sm font-medium text-gray-800">Log Meal</span>
              </Button>
              {logOptions.map((action) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={action.label}
                    onClick={() => handleStartLogging(action)}
                    variant="outline"
                    className={`flex flex-col items-center justify-center space-y-2 h-auto py-4 ${action.borderColor} ${action.hoverBg}`}
                  >
                    <Icon className={`w-6 h-6 ${action.color}`} />
                    <span className="text-sm font-medium text-gray-800">{action.label}</span>
                  </Button>
                );
              })}
            </div>
          </>
        ) : currentLog && (
            <div className="p-4 space-y-4">
                <DrawerHeader className="p-0 text-left">
                    <DrawerTitle className="flex items-center space-x-2">
                        <currentLog.icon className={`w-6 h-6 ${currentLog.color}`} />
                        <span>Log {currentLog.label}</span>
                    </DrawerTitle>
                </DrawerHeader>
                <Input 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={`E.g., ${currentLog.defaultDescription}`}
                    className="border-gray-200"
                />
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button variant="outline" onClick={handleCancelLogging}>Cancel</Button>
                    <Button onClick={handleFinalLog}>Log Activity</Button>
                </div>
            </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default QuickAddDrawer;
