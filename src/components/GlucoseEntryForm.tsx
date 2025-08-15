
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar, Save, X, Clock, Hash, Tag, FileText } from "lucide-react";
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
    tag?: GlucoseTag | null;
    notes?: string | null;
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
      tag: initialData?.tag || undefined,
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

  // Get time-based tag suggestions
  const getTimeSuggestions = () => {
    const currentHour = new Date().getHours();
    if (currentHour >= 5 && currentHour <= 8) return 'fasting';
    if (currentHour >= 12 && currentHour <= 14) return 'post-meal';
    if (currentHour >= 17 && currentHour <= 19) return 'post-meal';
    if (currentHour >= 21 || currentHour <= 5) return 'bedtime';
    return 'random';
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('Authentication required');
        return;
      }

      const value = parseFloat(data.value);
      if (isNaN(value) || value <= 0) {
        console.error('Invalid glucose value');
        return;
      }

      // Combine date and time
      const timestamp = new Date(`${data.date}T${data.time}`).toISOString();
      
      // Calculate both mg/dL and mmol/L values for accurate storage
      const value_mg_dl = data.unit === 'mg/dL' ? value : convertGlucoseValue(value, 'mmol/L', 'mg/dL');
      const value_mmol_l = data.unit === 'mmol/L' ? value : convertGlucoseValue(value, 'mg/dL', 'mmol/L');

      const glucoseData = {
        user_id: user.id,
        value,
        unit: data.unit,
        value_mg_dl,
        value_mmol_l,
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

      // Trigger a custom event to refresh glucose data in other components
      window.dispatchEvent(new CustomEvent('glucoseReadingChanged'));
      
      onSuccess?.();
    } catch (error) {
      console.error('Error saving glucose reading:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const valueNum = parseFloat(enteredValue);
  const category = !isNaN(valueNum) ? getGlucoseCategory(valueNum, selectedUnit) : 'normal';

  // Common tag chips for quick selection
  const quickTags = ['fasting', 'post-meal', 'bedtime', 'random'];

  return (
    <Card className="w-full max-w-md mx-auto rounded-2xl shadow-lg border-0">
      <CardHeader className="pb-3 px-4 pt-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Calendar className="w-4 h-4 text-muted-foreground" />
        </div>
        <CardTitle className="text-base font-semibold text-gray-900">
          {isEditing ? 'Edit' : 'Log'} Glucose Reading
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Manually add your latest glucose level
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
            
            {/* Glucose Value and Unit */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1 text-xs font-medium h-5">
                      <Hash className="w-3 h-3 text-muted-foreground" />
                      Glucose Level
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type="number"
                          step="0.1"
                          placeholder="e.g., 110"
                          className={`rounded-lg shadow-sm border focus:ring-1 h-9 text-sm ${
                            category === 'low' ? 'border-yellow-500 focus:ring-yellow-200' :
                            category === 'high' ? 'border-red-500 focus:ring-red-200' :
                            'border-green-500 focus:ring-green-200'
                          }`}
                        />
                        {!isNaN(valueNum) && (
                          <div className={`absolute -bottom-4 left-0 text-xs font-medium ${
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
                    <FormLabel className="text-xs font-medium h-5 flex items-center">Unit</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-lg shadow-sm border-gray-200 h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white shadow-lg border rounded-lg z-50">
                        <SelectItem value="mg/dL">mg/dL</SelectItem>
                        <SelectItem value="mmol/L">mmol/L</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1 text-xs font-medium">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      Date
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="date" 
                        className="rounded-lg shadow-sm border-gray-200 h-9 text-sm focus:ring-1 focus:ring-blue-200"
                      />
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
                    <FormLabel className="flex items-center gap-1 text-xs font-medium">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      Time
                    </FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="time" 
                        className="rounded-lg shadow-sm border-gray-200 h-9 text-sm focus:ring-1 focus:ring-blue-200"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Tag Selection */}
            <FormField
              control={form.control}
              name="tag"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1 text-xs font-medium">
                    <Tag className="w-3 h-3 text-muted-foreground" />
                    Tag (Optional)
                  </FormLabel>
                  
                  {/* Quick Tag Chips */}
                  <div className="flex flex-wrap gap-1 mb-2">
                    {quickTags.map((tag) => (
                      <Button
                        key={tag}
                        type="button"
                        size="sm"
                        variant={field.value === tag ? "default" : "outline"}
                        onClick={() => field.onChange(tag)}
                        className="rounded-full px-2 py-0.5 text-xs capitalize h-6"
                      >
                        {glucoseTags.find(t => t.value === tag)?.label || tag}
                      </Button>
                    ))}
                  </div>
                  
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-lg shadow-sm border-gray-200 h-9 text-sm">
                        <SelectValue placeholder="Select a tag" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white shadow-lg border rounded-lg z-50">
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

            {/* Notes */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1 text-xs font-medium">
                    <FileText className="w-3 h-3 text-muted-foreground" />
                    Notes (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="e.g., Ate pasta before reading..."
                      className="resize-none h-16 rounded-lg shadow-sm border-gray-200 focus:ring-1 focus:ring-blue-200 text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-primary text-white rounded-lg shadow-sm px-3 py-2 h-9 font-medium text-sm"
              >
                <Save className="w-3 h-3 mr-1" />
                {isSubmitting ? 'Saving...' : isEditing ? 'Update' : 'Save'}
              </Button>
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="rounded-lg border-gray-200 px-3 py-2 h-9 text-sm"
                >
                  <X className="w-3 h-3 mr-1" />
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
