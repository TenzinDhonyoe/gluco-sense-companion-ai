
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

  const renderEditableField = (field: string, value: any, icon: React.ReactNode, label: string, suffix = '') => {
    const isEditing = editingField === field;

    return (
      <Card>
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {icon}
            <div>
              <p className="text-sm text-gray-600">{label}</p>
              {isEditing ? (
                <Input
                  value={editValues[field] || ''}
                  onChange={(e) => setEditValues({ ...editValues, [field]: e.target.value })}
                  className="text-lg font-semibold mt-1"
                  autoFocus
                />
              ) : (
                <p className="text-lg font-semibold">{value}{suffix}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isEditing ? (
              <>
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
              </>
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
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <UtensilsCrossed className="w-6 h-6 text-green-500" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {editingField === 'description' ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={editValues.description || ''}
                    onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                    className="text-xl font-semibold"
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
                <div className="flex items-center space-x-2">
                  <h3 className="text-xl font-semibold">{log.description}</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit('description', log.description)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
              <p className="text-sm text-gray-500">{formatTime(log.time)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {log.calories && renderEditableField('calories', log.calories, <Flame className="w-5 h-5 text-orange-500" />, 'Calories')}
        {log.total_carbs && renderEditableField('total_carbs', log.total_carbs, <Wheat className="w-5 h-5 text-yellow-500" />, 'Carbs', 'g')}
        {log.total_protein && renderEditableField('total_protein', log.total_protein, <Beef className="w-5 h-5 text-red-500" />, 'Protein', 'g')}
        {log.total_fat && renderEditableField('total_fat', log.total_fat, <Droplets className="w-5 h-5 text-blue-500" />, 'Fat', 'g')}
        {log.total_fiber && renderEditableField('total_fiber', log.total_fiber, <Apple className="w-5 h-5 text-green-600" />, 'Fiber', 'g')}
      </div>

      {log.notes && renderEditableText('notes', log.notes, 'Notes')}
    </div>
  );

  const renderExerciseDetails = () => (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-4">
        <Dumbbell className="w-6 h-6 text-blue-500" />
        <div className="flex-1">
          {editingField === 'description' ? (
            <div className="flex items-center space-x-2">
              <Input
                value={editValues.description || ''}
                onChange={(e) => setEditValues({ ...editValues, description: e.target.value })}
                className="text-xl font-semibold"
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
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-semibold">{log.description}</h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleEdit('description', log.description)}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            </div>
          )}
          <p className="text-sm text-gray-500">{formatTime(log.time)}</p>
          {log.exercise_type && renderEditableBadge('exercise_type', log.exercise_type, editingField === 'exercise_type')}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {log.duration && renderEditableField('duration', log.duration, <Clock className="w-5 h-5 text-purple-500" />, 'Duration', ' min')}
        {log.calories_burned && renderEditableField('calories_burned', log.calories_burned, <Flame className="w-5 h-5 text-orange-500" />, 'Calories Burned')}
        
        {log.intensity && (
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Intensity</p>
                {editingField === 'intensity' ? (
                  <div className="flex items-center space-x-2 mt-1">
                    <select
                      value={editValues.intensity || ''}
                      onChange={(e) => setEditValues({ ...editValues, intensity: e.target.value })}
                      className="text-lg font-semibold border rounded px-2 py-1"
                      autoFocus
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
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
                  <Badge className={`mt-1 ${
                    log.intensity === 'high' ? 'bg-red-500' :
                    log.intensity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}>
                    {log.intensity}
                  </Badge>
                )}
              </div>
              {editingField !== 'intensity' && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleEdit('intensity', log.intensity)}
                  className="h-8 w-8 p-0"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {log.average_heart_rate && renderEditableField('average_heart_rate', log.average_heart_rate, <div className="w-5 h-5 bg-red-500 rounded-full" />, 'Avg Heart Rate', ' bpm')}
        {log.max_heart_rate && renderEditableField('max_heart_rate', log.max_heart_rate, <div className="w-5 h-5 bg-red-600 rounded-full" />, 'Max Heart Rate', ' bpm')}
      </div>

      {log.notes && renderEditableText('notes', log.notes, 'Notes')}
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
