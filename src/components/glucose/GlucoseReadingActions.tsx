
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { type GlucoseUnit, type GlucoseTag } from "@/lib/glucoseUtils";

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

interface GlucoseReadingActionsProps {
  reading: GlucoseReading;
  onEdit: (reading: GlucoseReading) => void;
  onDelete: (id: string) => void;
}

const GlucoseReadingActions = ({ reading, onEdit, onDelete }: GlucoseReadingActionsProps) => {
  if (reading.is_sensor_reading) {
    return null;
  }

  return (
    <div className="flex space-x-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => onEdit(reading)}
      >
        <Edit className="w-3 h-3" />
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => onDelete(reading.id)}
        className="text-red-600 hover:text-red-700"
      >
        <Trash2 className="w-3 h-3" />
      </Button>
    </div>
  );
};

export default GlucoseReadingActions;
