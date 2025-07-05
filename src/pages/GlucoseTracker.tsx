
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, TrendingUp } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import GlucoseEntryForm from "@/components/GlucoseEntryForm";
import GlucoseReadingsList from "@/components/GlucoseReadingsList";

const GlucoseTracker = () => {
  const [showEntryForm, setShowEntryForm] = useState(false);

  const handleEntrySuccess = () => {
    setShowEntryForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Glucose Tracker</h1>
            <p className="text-gray-600">Monitor your blood glucose levels</p>
          </div>
          <Button
            onClick={() => setShowEntryForm(!showEntryForm)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            {showEntryForm ? 'Cancel' : 'Add Reading'}
          </Button>
        </div>

        {showEntryForm && (
          <GlucoseEntryForm
            onSuccess={handleEntrySuccess}
            onCancel={() => setShowEntryForm(false)}
          />
        )}

        <GlucoseReadingsList />

        {/* Quick stats card */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Quick Tips</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• Log readings at consistent times for better tracking</p>
              <p>• Use tags to understand patterns (fasting, post-meal, etc.)</p>
              <p>• Target ranges: 70-180 mg/dL (3.9-10.0 mmol/L)</p>
              <p>• Add notes about meals, exercise, or other factors</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <BottomNav />
    </div>
  );
};

export default GlucoseTracker;
