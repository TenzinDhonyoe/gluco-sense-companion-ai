
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { UtensilsCrossed, Dumbbell, Clock, Flame, Apple, Wheat, Beef, Droplets } from "lucide-react";
import { format } from "date-fns";

interface DatabaseLog {
  id: string;
  type: 'meal' | 'exercise';
  description: string;
  time: Date;
  calories?: number;
  duration?: number;
  // Additional meal properties
  total_carbs?: number;
  total_protein?: number;
  total_fat?: number;
  total_fiber?: number;
  meal_type?: string;
  notes?: string;
  // Additional exercise properties
  intensity?: string;
  exercise_type?: string;
  calories_burned?: number;
  average_heart_rate?: number;
  max_heart_rate?: number;
}

interface LogDetailModalProps {
  log: DatabaseLog | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const LogDetailModal = ({ log, open, onOpenChange }: LogDetailModalProps) => {
  if (!log) return null;

  const formatTime = (date: Date) => {
    return format(date, "MMM dd, yyyy 'at' h:mm a");
  };

  const renderMealDetails = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <UtensilsCrossed className="w-6 h-6 text-green-500" />
        <div>
          <h3 className="text-xl font-semibold">{log.description}</h3>
          <p className="text-sm text-gray-500">{formatTime(log.time)}</p>
          {log.meal_type && (
            <Badge variant="secondary" className="mt-1 capitalize">
              {log.meal_type}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {log.calories && (
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Calories</p>
                <p className="text-lg font-semibold">{log.calories}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {log.total_carbs && (
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <Wheat className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-sm text-gray-600">Carbs</p>
                <p className="text-lg font-semibold">{log.total_carbs}g</p>
              </div>
            </CardContent>
          </Card>
        )}

        {log.total_protein && (
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <Beef className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Protein</p>
                <p className="text-lg font-semibold">{log.total_protein}g</p>
              </div>
            </CardContent>
          </Card>
        )}

        {log.total_fat && (
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <Droplets className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Fat</p>
                <p className="text-lg font-semibold">{log.total_fat}g</p>
              </div>
            </CardContent>
          </Card>
        )}

        {log.total_fiber && (
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <Apple className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Fiber</p>
                <p className="text-lg font-semibold">{log.total_fiber}g</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {log.notes && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2">Notes</h4>
            <p className="text-gray-700">{log.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderExerciseDetails = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Dumbbell className="w-6 h-6 text-blue-500" />
        <div>
          <h3 className="text-xl font-semibold">{log.description}</h3>
          <p className="text-sm text-gray-500">{formatTime(log.time)}</p>
          {log.exercise_type && (
            <Badge variant="secondary" className="mt-1 capitalize">
              {log.exercise_type}
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {log.duration && (
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <Clock className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Duration</p>
                <p className="text-lg font-semibold">{log.duration} min</p>
              </div>
            </CardContent>
          </Card>
        )}

        {log.calories_burned && (
          <Card>
            <CardContent className="p-4 flex items-center space-x-3">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Calories Burned</p>
                <p className="text-lg font-semibold">{log.calories_burned}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {log.intensity && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Intensity</p>
              <Badge className={`mt-1 ${
                log.intensity === 'high' ? 'bg-red-500' :
                log.intensity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
              }`}>
                {log.intensity}
              </Badge>
            </CardContent>
          </Card>
        )}

        {log.average_heart_rate && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Avg Heart Rate</p>
              <p className="text-lg font-semibold">{log.average_heart_rate} bpm</p>
            </CardContent>
          </Card>
        )}

        {log.max_heart_rate && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-gray-600">Max Heart Rate</p>
              <p className="text-lg font-semibold">{log.max_heart_rate} bpm</p>
            </CardContent>
          </Card>
        )}
      </div>

      {log.notes && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2">Notes</h4>
            <p className="text-gray-700">{log.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {log.type === 'meal' ? 'Meal Details' : 'Exercise Details'}
          </DialogTitle>
        </DialogHeader>
        
        {log.type === 'meal' ? renderMealDetails() : renderExerciseDetails()}
      </DialogContent>
    </Dialog>
  );
};

export default LogDetailModal;
