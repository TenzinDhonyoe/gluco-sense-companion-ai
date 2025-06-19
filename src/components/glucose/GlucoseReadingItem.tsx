
import { Badge } from "@/components/ui/badge";
import { Wifi } from "lucide-react";
import { type GlucoseUnit, type GlucoseTag, formatGlucoseValue, getGlucoseCategory } from "@/lib/glucoseUtils";
import GlucoseReadingActions from "./GlucoseReadingActions";

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

interface GlucoseReadingItemProps {
  reading: GlucoseReading;
  onEdit: (reading: GlucoseReading) => void;
  onDelete: (id: string) => void;
}

const GlucoseReadingItem = ({ reading, onEdit, onDelete }: GlucoseReadingItemProps) => {
  const category = getGlucoseCategory(reading.value, reading.unit);

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

  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
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
      <GlucoseReadingActions
        reading={reading}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
};

export default GlucoseReadingItem;
