
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type GlucoseUnit, type GlucoseTag } from "@/lib/glucoseUtils";
import GlucoseEntryForm from "../GlucoseEntryForm";
import GlucoseReadingItem from "./GlucoseReadingItem";
import LoadingState from "./LoadingState";
import EmptyState from "./EmptyState";
import { type Database } from "@/integrations/supabase/types";

type GlucoseReadingRow = Database['public']['Tables']['glucose_readings']['Row'];

interface GlucoseReading {
  id: string;
  user_id: string;
  value: number;
  unit: GlucoseUnit;
  timestamp: string;
  tag?: GlucoseTag | null;
  notes?: string | null;
  source: string;
  is_sensor_reading: boolean;
  created_at: string;
  updated_at: string;
}

const GlucoseReadingsList = () => {
  const { toast } = useToast();
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingReading, setEditingReading] = useState<GlucoseReading | null>(null);

  const fetchReadings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('glucose_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;
      
      // Transform the data to ensure proper typing
      const transformedData: GlucoseReading[] = (data || []).map((row: GlucoseReadingRow) => ({
        id: row.id,
        user_id: row.user_id,
        value: row.value,
        unit: row.unit as GlucoseUnit,
        timestamp: row.timestamp,
        tag: row.tag as GlucoseTag | null,
        notes: row.notes,
        source: row.source,
        is_sensor_reading: row.is_sensor_reading,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
      
      setReadings(transformedData);
    } catch (error) {
      console.error('Error fetching glucose readings:', error);
      toast({
        title: "Error",
        description: "Failed to load glucose readings.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadings();

    // Listen for glucose reading changes
    const handleGlucoseChange = () => fetchReadings();
    window.addEventListener('glucoseReadingChanged', handleGlucoseChange);

    // Set up real-time subscription for new sensor readings
    const channel = supabase
      .channel('glucose-readings-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'glucose_readings'
        },
        (payload) => {
          console.log('New glucose reading:', payload);
          fetchReadings(); // Refresh the list when new readings are added
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener('glucoseReadingChanged', handleGlucoseChange);
      supabase.removeChannel(channel);
    };
  }, []);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('glucose_readings')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Reading deleted",
        description: "Glucose reading has been removed.",
      });

      fetchReadings();
    } catch (error) {
      console.error('Error deleting glucose reading:', error);
      toast({
        title: "Error",
        description: "Failed to delete glucose reading.",
        variant: "destructive",
      });
    }
  };

  const handleEditSuccess = () => {
    setEditingReading(null);
    fetchReadings();
  };

  if (editingReading) {
    return (
      <GlucoseEntryForm
        initialData={editingReading}
        onSuccess={handleEditSuccess}
        onCancel={() => setEditingReading(null)}
      />
    );
  }

  if (loading) {
    return <LoadingState />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5" />
          <span>Recent Readings</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {readings.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-3">
            {readings.map((reading) => (
              <GlucoseReadingItem
                key={reading.id}
                reading={reading}
                onEdit={setEditingReading}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GlucoseReadingsList;
