
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar, Clock, Save, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type GlucoseUnit, type GlucoseTag, glucoseTags, convertGlucoseValue, getGlucoseCategory } from "@/lib/glucoseUtils";

interface GlucoseEntryFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: {
    id?: string;
    value: number;
    unit: GlucoseUnit;
    timestamp: string;
    tag?: GlucoseTag;
    notes?: string;
  };
}

interface FormData {
  value: string;
  unit: GlucoseUnit;
  date: string;
  time: string;
  tag?: GlucoseTag;
  notes: string;
}

const GlucoseEntryForm = ({ onSuccess, onCancel, initialData }: GlucoseEntryFormProps) => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditing = !!initialData?.id;
  
  // Initialize form with current time or initial data
  const now = initialData ? new Date(initialData.timestamp) : new Date();
  const form = useForm<FormData>({
    defaultValues: {
      value: initialData ? initialData.value.toString() : '',
      unit: initialData?.unit || 'mg/dL',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      tag: initialData?.tag,
      notes: initialData?.notes || '',
    },
  });

  const selectedUnit = form.watch('unit');
  const enteredValue = form.watch('value');
  
  // Show converted value
  const getConvertedValue = () => {
    const value = parseFloat(enteredValue);
    if (isNaN(value)) return '';
    
    const targetUnit = selectedUnit === 'mg/dL' ? 'mmol/L' : 'mg/dL';
    const converted = convertGlucoseValue(value, selectedUnit, targetUnit);
    return `≈ ${converted} ${targetUnit}`;
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to save glucose readings.",
          variant: "destructive",
        });
        return;
      }

      const value = parseFloat(data.value);
      if (isNaN(value) || value <= 0) {
        toast({
          title: "Invalid value",
          description: "Please enter a valid glucose value.",
          variant: "destructive",
        });
        return;
      }

      // Combine date and time
      const timestamp = new Date(`${data.date}T${data.time}`).toISOString();
      
      const glucoseData = {
        user_id: user.id,
        value,
        unit: data.unit,
        timestamp,
        tag: data.tag || null,
        notes: data.notes.trim() || null,
        source: 'manual' as const,
      };

      let result;
      if (isEditing && initialData?.id) {
        result = await supabase
          .from('glucose_readings')
          .update(glucoseData)
          .eq('id', initialData.id);
      } else {
        result = await supabase
          .from('glucose_readings')
          .insert([glucoseData]);
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: isEditing ? "Reading updated!" : "Reading saved!",
        description: `Glucose level: ${value} ${data.unit}`,
      });

      // Trigger a custom event to refresh glucose data in other components
      window.dispatchEvent(new CustomEvent('glucoseReadingChanged'));
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving glucose reading:', error);
      toast({
        title: "Error",
        description: "Failed to save glucose reading. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const valueNum = parseFloat(enteredValue);
  const category = !isNaN(valueNum) ? getGlucoseCategory(valueNum, selectedUnit) : 'normal';

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calendar className="w-5 h-5" />
          <span>{isEditing ? 'Edit' : 'Log'} Glucose Reading</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Glucose Level</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type="number"
                          step="0.1"
                          placeholder="Enter value"
                          className={`${
                            category === 'low' ? 'border-yellow-500' :
                            category === 'high' ? 'border-red-500' :
                            'border-green-500'
                          }`}
                        />
                        {!isNaN(valueNum) && (
                          <div className={`absolute -bottom-5 left-0 text-xs ${
                            category === 'low' ? 'text-yellow-600' :
                            category === 'high' ? 'text-red-600' :
                            'text-green-600'
                          }`}>
                            {getConvertedValue()}
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="mg/dL">mg/dL</SelectItem>
                        <SelectItem value="mmol/L">mmol/L</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <Input {...field} type="time" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag (Optional)</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a tag" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {glucoseTags.map((tag) => (
                        <SelectItem key={tag.value} value={tag.value}>
                          {tag.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Any additional notes..."
                      className="resize-none h-20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex space-x-2 pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Save'}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default GlucoseEntryForm;
