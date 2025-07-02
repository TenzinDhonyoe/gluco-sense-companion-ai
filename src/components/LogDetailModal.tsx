
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { UtensilsCrossed, Dumbbell, Clock, Flame, Apple, Wheat, Beef, Droplets, Edit2, Save, X } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  onLogUpdate?: () => void;
}

const LogDetailModal = ({ log, open, onOpenChange, onLogUpdate }: LogDetailModalProps) => {
  const { toast } = useToast();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  if (!log) return null;

  const formatTime = (date: Date) => {
    return format(date, "MMM dd, yyyy 'at' h:mm a");
  };

  const handleEdit = (field: string, currentValue: any) => {
    setEditingField(field);
    setEditValues({ [field]: currentValue });
  };

  const handleSave = async (field: string) => {
    if (!editValues[field] && editValues[field] !== 0) return;

    setIsSaving(true);
    try {
      const tableName = log.type === 'meal' ? 'meals' : 'exercises';
      const updateData: Record<string, any> = {};

      // Map the field to the correct database column
      if (log.type === 'meal') {
        switch (field) {
          case 'description':
            updateData.meal_name = editValues[field];
            break;
          case 'calories':
            updateData.total_calories = parseInt(editValues[field]);
            break;
          case 'total_carbs':
            updateData.total_carbs = parseFloat(editValues[field]);
            break;
          case 'total_protein':
            updateData.total_protein = parseFloat(editValues[field]);
            break;
          case 'total_fat':
            updateData.total_fat = parseFloat(editValues[field]);
            break;
          case 'total_fiber':
            updateData.total_fiber = parseFloat(editValues[field]);
            break;
          case 'notes':
            updateData.notes = editValues[field];
            break;
        }
      } else {
        switch (field) {
          case 'description':
            updateData.exercise_name = editValues[field];
            break;
          case 'duration':
            updateData.duration_minutes = parseInt(editValues[field]);
            break;
          case 'calories_burned':
            updateData.calories_burned = parseInt(editValues[field]);
            break;
          case 'intensity':
            updateData.intensity = editValues[field];
            break;
          case 'exercise_type':
            updateData.exercise_type = editValues[field];
            break;
          case 'average_heart_rate':
            updateData.average_heart_rate = parseInt(editValues[field]);
            break;
          case 'max_heart_rate':
            updateData.max_heart_rate = parseInt(editValues[field]);
            break;
          case 'notes':
            updateData.notes = editValues[field];
            break;
        }
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', log.id);

      if (error) throw error;

      // Update the local log object
      (log as any)[field] = editValues[field];

      toast({
        title: "Updated successfully",
        description: `${field} has been updated.`,
      });

      setEditingField(null);
      onLogUpdate?.();
    } catch (error) {
      console.error('Error updating log:', error);
      toast({
        title: "Error",
        description: "Failed to update. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setEditValues({});
  };

  const renderEditableField = (field: string, value: any, icon: React.ReactNode, label: string, suffix = '', colorClass = '') => {
    const isEditing = editingField === field;

    return (
      <Card className={`rounded-xl shadow-sm bg-white ${colorClass}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-4 h-4 flex items-center justify-center">
              {icon}
            </div>
            <span className="text-sm text-muted-foreground">{label}</span>
            {!isEditing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit(field, value)}
                className="ml-auto h-6 w-6 p-0 hover:bg-gray-100 transition-colors"
              >
                <Edit2 className="w-3 h-3" />
              </Button>
            )}
          </div>
          
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Input
                value={editValues[field] || ''}
                onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
                className="text-lg font-bold"
                autoFocus
              />
              <Button
                size="sm"
                onClick={() => handleSave(field)}
                disabled={isSaving}
                className="h-8 w-8 p-0"
              >
                <Save className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <p className="text-lg font-bold text-gray-900">{value}{suffix}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderEditableText = (field: string, value: string, title: string) => {
    const isEditing = editingField === field;

    return (
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold">{title}</h4>
            {isEditing ? (
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  onClick={() => handleSave(field)}
                  disabled={isSaving}
                  className="h-8 w-8 p-0"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit(field, value)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </div>
          {isEditing ? (
            <Textarea
              value={editValues[field] || ''}
              onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
              className="min-h-[80px]"
              autoFocus
            />
          ) : (
            <p className="text-gray-700">{value}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderEditableBadge = (field: string, value: string, isEditing: boolean) => {
    if (isEditing) {
      return (
        <div className="flex items-center space-x-2 mt-1">
          <Input
            value={editValues[field] || ''}
            onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
            className="w-32"
            autoFocus
          />
          <Button
            size="sm"
            onClick={() => handleSave(field)}
            disabled={isSaving}
            className="h-8 w-8 p-0"
          >
            <Save className="w-4 h-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancel}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center space-x-2 mt-1">
        <Badge variant="secondary" className="capitalize">
          {value}
        </Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleEdit(field, value)}
          className="h-6 w-6 p-0"
        >
          <Edit2 className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  const renderMealDetails = () => (
    <div className="space-y-6">
      {/* Header Section - Centered */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <UtensilsCrossed className="w-6 h-6 text-green-500" />
          {log.meal_type && (
            <Badge variant="secondary" className="text-xs px-2 py-1 rounded-full">
              {log.meal_type}
            </Badge>
          )}
        </div>
        
        {editingField === 'description' ? (
          <div className="flex items-center justify-center gap-2">
            <Input
              value={editValues.description || ''}
              onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
              className="text-lg font-semibold text-center"
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => handleSave('description')}
              disabled={isSaving}
              className="h-8 w-8 p-0"
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-lg font-semibold capitalize">{log.description}</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit('description', log.description)}
              className="h-6 w-6 p-0 hover:bg-gray-100 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        )}
        <p className="text-sm text-muted-foreground">{formatTime(log.time)}</p>
      </div>

      {/* Nutrition Cards */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-2 gap-4">
          {log.calories && renderEditableField('calories', log.calories, <Flame className="w-4 h-4 text-orange-500" />, 'Calories', '', 'border-l-4 border-orange-200')}
          {log.total_carbs && renderEditableField('total_carbs', log.total_carbs, <Wheat className="w-4 h-4 text-yellow-500" />, 'Carbs', 'g', 'border-l-4 border-yellow-200')}
          {log.total_protein && renderEditableField('total_protein', log.total_protein, <Beef className="w-4 h-4 text-red-500" />, 'Protein', 'g', 'border-l-4 border-red-200')}
          {log.total_fat && renderEditableField('total_fat', log.total_fat, <Droplets className="w-4 h-4 text-blue-500" />, 'Fat', 'g', 'border-l-4 border-blue-200')}
          {log.total_fiber && renderEditableField('total_fiber', log.total_fiber, <Apple className="w-4 h-4 text-green-600" />, 'Fiber', 'g', 'border-l-4 border-green-200')}
        </div>
      </div>

      {log.notes && (
        <div className="bg-gray-50 rounded-xl p-4">
          {renderEditableText('notes', log.notes, 'Notes')}
        </div>
      )}
    </div>
  );

  const renderExerciseDetails = () => (
    <div className="space-y-6">
      {/* Header Section - Centered */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Dumbbell className="w-6 h-6 text-blue-500" />
          {log.exercise_type && (
            <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-700">
              {log.exercise_type}
            </Badge>
          )}
        </div>
        
        {editingField === 'description' ? (
          <div className="flex items-center justify-center gap-2">
            <Input
              value={editValues.description || ''}
              onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
              className="text-lg font-semibold text-center"
              autoFocus
            />
            <Button
              size="sm"
              onClick={() => handleSave('description')}
              disabled={isSaving}
              className="h-8 w-8 p-0"
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2">
            <h3 className="text-lg font-semibold capitalize">🏃 {log.description}</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleEdit('description', log.description)}
              className="h-6 w-6 p-0 hover:bg-gray-100 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
          </div>
        )}
        <p className="text-sm text-muted-foreground">{formatTime(log.time)}</p>
        
        {log.intensity && (
          <div className="flex justify-center">
            {editingField === 'intensity' ? (
              <div className="flex items-center gap-2">
                <Input
                  value={editValues.intensity || ''}
                  onChange={(e) => setEditValues({ ...editValues, intensity: e.target.value })}
                  className="w-32"
                  autoFocus
                />
                <Button
                  size="sm"
                  onClick={() => handleSave('intensity')}
                  disabled={isSaving}
                  className="h-8 w-8 p-0"
                >
                  <Save className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleCancel}
                  className="h-8 w-8 p-0"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="capitalize text-xs px-3 py-1 rounded-full">
                  {log.intensity} intensity
                </Badge>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit('intensity', log.intensity)}
                  className="h-6 w-6 p-0"
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exercise Metrics Cards */}
      <div className="bg-gray-50 rounded-xl p-4">
        <div className="grid grid-cols-2 gap-4">
          {log.duration && renderEditableField('duration', log.duration, <Clock className="w-4 h-4 text-purple-500" />, 'Duration', ' min', 'border-l-4 border-purple-200')}
          {log.calories_burned && renderEditableField('calories_burned', log.calories_burned, <Flame className="w-4 h-4 text-orange-500" />, 'Calories Burned', '', 'border-l-4 border-orange-200')}
          {log.average_heart_rate && renderEditableField('average_heart_rate', log.average_heart_rate, <div className="w-4 h-4 bg-red-500 rounded-full" />, 'Avg HR', ' bpm', 'border-l-4 border-red-200')}
          {log.max_heart_rate && renderEditableField('max_heart_rate', log.max_heart_rate, <div className="w-4 h-4 bg-red-600 rounded-full" />, 'Max HR', ' bpm', 'border-l-4 border-red-300')}
        </div>
      </div>

      {log.notes && (
        <div className="bg-gray-50 rounded-xl p-4">
          {renderEditableText('notes', log.notes, 'Notes')}
        </div>
      )}

      {/* Optional glucose linking section */}
      <div className="bg-blue-50 rounded-xl p-4 text-center">
        <p className="text-sm text-blue-700 font-medium">💡 Tip: Link this workout to glucose readings</p>
        <p className="text-xs text-blue-600 mt-1">Track how exercise affects your blood sugar levels</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto p-0 rounded-2xl border-0 shadow-xl w-[90vw] sm:w-full fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="text-center text-xl font-bold text-gray-900">
            {log.type === 'meal' ? 'Meal Details' : 'Exercise Details'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-6">
          {log.type === 'meal' ? renderMealDetails() : renderExerciseDetails()}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LogDetailModal;
