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
import { Plus, Camera, Dumbbell, Coffee, Apple, Check, Droplets } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { addLog } from "@/lib/logStore";
import { toast as sonnerToast } from "sonner";
import MealCamera from "./MealCamera";
import GlucoseEntryForm from "./GlucoseEntryForm";

type LogType = 'exercise' | 'snack' | 'beverage';

const QuickAddDrawer = () => {
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [isCameraOpen, setIsCameraOpen] = React.useState(false);
  const [isGlucoseFormOpen, setIsGlucoseFormOpen] = React.useState(false);
  const [loggingStep, setLoggingStep] = React.useState(0); // 0: main view, 1: logging view
  const [currentLog, setCurrentLog] = React.useState<{type: LogType, label: string, icon: React.ElementType, points: number, defaultDescription: string, color: string} | null>(null);
  const [description, setDescription] = React.useState("");

  const handleMealPhoto = () => {
    setIsCameraOpen(true);
  };

  const handleGlucoseLog = () => {
    setIsGlucoseFormOpen(true);
  };

  const handleCaptureMeal = (imageDataUrl: string) => {
    console.log("Captured meal image:", imageDataUrl.substring(0, 50) + "...");
    addLog({ type: 'meal', description: 'Logged via photo', points: 15 });
    setOpen(false);
      
    sonnerToast.custom((t) => (
      <div className="flex flex-col items-center justify-center bg-background p-6 rounded-xl shadow-lg border w-full max-w-md mx-auto">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
              <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
          </div>
          <p className="mt-4 text-xl font-semibold text-gray-800 animate-fade-in" style={{animationDelay: '0.2s'}}>Logged</p>
      </div>
    ), {
      duration: 2000,
    });
  };

  const handleGlucoseSuccess = () => {
    setIsGlucoseFormOpen(false);
    setOpen(false);
    
    sonnerToast.custom((t) => (
      <div className="flex flex-col items-center justify-center bg-background p-6 rounded-xl shadow-lg border w-full max-w-md mx-auto">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
              <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
          </div>
          <p className="mt-4 text-xl font-semibold text-gray-800 animate-fade-in" style={{animationDelay: '0.2s'}}>Glucose Logged</p>
      </div>
    ), {
      duration: 2000,
    });
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
      addLog({ type: currentLog.type, description, points: currentLog.points });
      setOpen(false);
      
      sonnerToast.custom((t) => (
        <div className="flex flex-col items-center justify-center bg-background p-6 rounded-xl shadow-lg border w-full max-w-md mx-auto">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-scale-in">
                <Check className="w-10 h-10 text-green-600" strokeWidth={3} />
            </div>
            <p className="mt-4 text-xl font-semibold text-gray-800 animate-fade-in" style={{animationDelay: '0.2s'}}>Logged</p>
        </div>
      ), {
        duration: 2000,
      });
  };
  
  // If glucose form is open, show it
  if (isGlucoseFormOpen) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
        <div className="bg-white w-full rounded-t-xl p-4">
          <GlucoseEntryForm
            onSuccess={handleGlucoseSuccess}
            onCancel={() => setIsGlucoseFormOpen(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <>
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
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
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
                
                {/* Full Width Glucose Button */}
                <Button
                  onClick={handleGlucoseLog}
                  className="w-full h-12 bg-gradient-to-br from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg transition-all hover:scale-[1.02] flex items-center justify-center space-x-2"
                >
                  <Droplets className="w-5 h-5" />
                  <span className="text-sm font-medium">Log Glucose</span>
                </Button>
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
      <MealCamera 
        open={isCameraOpen}
        onOpenChange={setIsCameraOpen}
        onCapture={handleCaptureMeal}
      />
    </>
  );
};

export default QuickAddDrawer;
