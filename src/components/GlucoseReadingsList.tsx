import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Activity, Wifi } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { type GlucoseUnit, type GlucoseTag, formatGlucoseValue, getGlucoseCategory } from "@/lib/glucoseUtils";
import GlucoseEntryForm from "./GlucoseEntryForm";
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

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString([], { 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    }
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
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">Loading readings...</div>
        </CardContent>
      </Card>
    );
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
          <div className="text-center text-gray-500 py-8">
            No glucose readings yet. Add your first reading to get started!
          </div>
        ) : (
          <div className="space-y-3">
            {readings.map((reading) => {
              const category = getGlucoseCategory(reading.value, reading.unit);
              
              return (
                <div
                  key={reading.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`text-lg font-semibold ${
                        category === 'low' ? 'text-yellow-600' :
                        category === 'high' ? 'text-red-600' :
                        'text-green-600'
                      }`}>
                        {formatGlucoseValue(reading.value, reading.unit)} {reading.unit}
                      </div>
                      {reading.is_sensor_reading && (
                        <Badge variant="outline" className="text-xs flex items-center space-x-1">
                          <Wifi className="w-3 h-3" />
                          <span>Sensor</span>
                        </Badge>
                      )}
                      {reading.tag && (
                        <Badge variant="secondary" className="text-xs">
                          {reading.tag.replace('-', ' ')}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatDate(reading.timestamp)}
                    </div>
                    {reading.notes && (
                      <div className="text-sm text-gray-500 mt-1">
                        {reading.notes}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {!reading.is_sensor_reading && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingReading(reading)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(reading.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GlucoseReadingsList;
