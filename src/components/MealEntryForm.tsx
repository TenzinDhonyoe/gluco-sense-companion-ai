
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { logMeal, mealTypes, type MealData } from "@/lib/mealUtils";
import { Utensils } from "lucide-react";

interface MealEntryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const MealEntryForm = ({ onSuccess, onCancel }: MealEntryFormProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<MealData>({
    meal_type: 'breakfast',
    meal_name: '',
    total_carbs: undefined,
    total_calories: undefined,
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.meal_name.trim()) {
      toast({
        title: "Meal name required",
        description: "Please enter a meal name",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await logMeal(formData);
      toast({
        title: "Meal logged successfully",
        description: `${formData.meal_name} has been recorded`,
      });
      onSuccess?.();
    } catch (error) {
      console.error('Error logging meal:', error);
      toast({
        title: "Error",
        description: "Failed to log meal. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Utensils className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold">Log Meal</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meal_type">Meal Type</Label>
        <Select
          value={formData.meal_type}
          onValueChange={(value) => setFormData(prev => ({ ...prev, meal_type: value as any }))}
        >
          <SelectTrigger className="h-12 text-base" style={{ fontSize: '16px' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {mealTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="meal_name">Meal Name</Label>
        <Input
          id="meal_name"
          value={formData.meal_name}
          onChange={(e) => setFormData(prev => ({ ...prev, meal_name: e.target.value }))}
          placeholder="e.g., Grilled chicken salad"
          className="h-12 text-base"
          style={{ fontSize: '16px' }}
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="total_carbs">Carbs (g)</Label>
          <Input
            id="total_carbs"
            type="number"
            step="0.1"
            min="0"
            value={formData.total_carbs || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              total_carbs: e.target.value ? parseFloat(e.target.value) : undefined 
            }))}
            placeholder="Optional"
            className="h-12 text-base"
            style={{ fontSize: '16px' }}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="total_calories">Calories</Label>
          <Input
            id="total_calories"
            type="number"
            min="0"
            value={formData.total_calories || ''}
            onChange={(e) => setFormData(prev => ({ 
              ...prev, 
              total_calories: e.target.value ? parseInt(e.target.value) : undefined 
            }))}
            placeholder="Optional"
            className="h-12 text-base"
            style={{ fontSize: '16px' }}
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
          className="text-base min-h-20"
          style={{ fontSize: '16px' }}
        />
      </div>

      <div className="flex space-x-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "Logging..." : "Log Meal"}
        </Button>
      </div>
    </form>
  );
};

export default MealEntryForm;
