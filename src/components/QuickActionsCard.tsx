
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Dumbbell, Coffee, Apple } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const QuickActionsCard = () => {
  const { toast } = useToast();

  const handleMealPhoto = () => {
    toast({
      title: "Camera Feature",
      description: "Meal photo logging will be implemented with device camera access.",
    });
  };

  const handleWorkoutLog = () => {
    toast({
      title: "Workout Logged",
      description: "Quick 15-minute walk added to your activity log!",
    });
  };

  const handleSnackLog = () => {
    toast({
      title: "Snack Logged",
      description: "Apple added to your food log!",
    });
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-gray-900">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={handleMealPhoto}
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4 border-blue-200 hover:bg-blue-50"
          >
            <Camera className="w-6 h-6 text-blue-500" />
            <span className="text-sm font-medium">Log Meal</span>
          </Button>
          
          <Button
            onClick={handleWorkoutLog}
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4 border-green-200 hover:bg-green-50"
          >
            <Dumbbell className="w-6 h-6 text-green-500" />
            <span className="text-sm font-medium">Quick Workout</span>
          </Button>
          
          <Button
            onClick={handleSnackLog}
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4 border-orange-200 hover:bg-orange-50"
          >
            <Apple className="w-6 h-6 text-orange-500" />
            <span className="text-sm font-medium">Log Snack</span>
          </Button>
          
          <Button
            variant="outline"
            className="flex flex-col items-center space-y-2 h-auto py-4 border-purple-200 hover:bg-purple-50"
          >
            <Coffee className="w-6 h-6 text-purple-500" />
            <span className="text-sm font-medium">Beverage</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsCard;
