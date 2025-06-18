
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { logExercise, exerciseIntensities, exerciseTypes, type ExerciseData } from "@/lib/exerciseUtils";
import { Dumbbell } from "lucide-react";

interface ExerciseEntryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ExerciseEntryForm = ({ onSuccess, onCancel }: ExerciseEntryFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ExerciseData>({
    exercise_name: '',
    exercise_type: 'Cardio',
    duration_minutes: 0,
    intensity: 'moderate',
    calories_burned: undefined,
    average_heart_rate: undefined,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.exercise_name.trim()) {
      toast({
        title: "Exercise name required",
        description: "Please enter an exercise name",
        variant: "destructive"
      });
      return;
    }

    if (formData.duration_minutes <= 0) {
      toast({
        title: "Duration required",
        description: "Please enter a valid duration",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await logExercise(formData);
      toast({
        title: "Exercise logged successfully",
        description: `${formData.exercise_name} has been recorded`,
      });
      onSuccess?.();
    } catch (error) {
      console.error('Error logging exercise:', error);
      toast({
        title: "Error",
        description: "Failed to log exercise. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Dumbbell className="w-5 h-5 text-green-500" />
        <h3 className="text-lg font-semibold">Log Exercise</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="exercise_name">Exercise Name</Label>
        <Input
          id="exercise_name"
          value={formData.exercise_name}
          onChange={(e) => setFormData(prev => ({ ...prev, exercise_name: e.target.value }))}
          placeholder="e.g., Morning jog"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="exercise_type">Exercise Type</Label>
        <Select
          value={formData.exercise_type}
          onValueChange={(value) => setFormData(prev => ({ ...prev, exercise_type: value }))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {exerciseTypes.map(type => (
              <SelectItem key={type} value={type}>
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Input
            id="duration_minutes"
            type="number"
            min="1"
            value={formData.duration_minutes || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              duration_minutes: parseInt(e.target.value) || 0 
            }))}
            placeholder="30"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="intensity">Intensity</Label>
          <Select
            value={formData.intensity}
            onValueChange={(value) => setFormData(prev => ({ ...prev, intensity: value as any }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {exerciseIntensities.map(intensity => (
                <SelectItem key={intensity.value} value={intensity.value}>
                  {intensity.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="calories_burned">Calories Burned</Label>
          <Input
            id="calories_burned"
            type="number"
            min="0"
            value={formData.calories_burned || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              calories_burned: e.target.value ? parseInt(e.target.value) : undefined 
            }))}
            placeholder="Optional"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="average_heart_rate">Avg Heart Rate</Label>
          <Input
            id="average_heart_rate"
            type="number"
            min="0"
            max="250"
            value={formData.average_heart_rate || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              average_heart_rate: e.target.value ? parseInt(e.target.value) : undefined 
            }))}
            placeholder="Optional"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any additional details..."
          rows={3}
        />
      </div>

      <div className="flex space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Logging..." : "Log Exercise"}
        </Button>
      </div>
    </form>
  );
};

export default ExerciseEntryForm;
