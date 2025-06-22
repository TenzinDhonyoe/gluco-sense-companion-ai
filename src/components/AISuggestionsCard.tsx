
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type GlucoseReading } from "@/components/GlucoseTrendChart";
import { type LogEntry } from "@/lib/logStore";
import { supabase } from "@/integrations/supabase/client";

interface AISuggestionsCardProps {
  glucoseData: GlucoseReading[];
  logs: LogEntry[];
}

const AISuggestionsCard = ({ glucoseData, logs }: AISuggestionsCardProps) => {
  const { toast } = useToast();

  const {
    data: suggestions,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ai-suggestions', logs],
    queryFn: async () => {
      if (glucoseData.length === 0) return [];

      const { data, error } = await supabase.functions.invoke('ai-suggestions', {
        body: {
          glucoseData: glucoseData,
          logs: logs
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return data?.suggestions || [];
    },
    enabled: glucoseData.length > 0,
    refetchOnWindowFocus: false,
    retry: false,
  });

  useEffect(() => {
    if (isError) {
        console.error("Error fetching AI suggestions:", error);
        let description = "Failed to fetch AI suggestions. Please try again.";
        if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('quota'))) {
            description = "There was an issue with the AI service. Please try again later.";
        }
        toast({ title: "Error", description, variant: "destructive" });
    }
  }, [isError, error, toast]);

  const showLoading = isLoading || isFetching;

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <span className="text-gray-900">AI Suggestions</span>
          </div>
          <Button
            onClick={() => refetch()}
            disabled={showLoading}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700 disabled:text-gray-400"
          >
            <RefreshCw className={`w-4 h-4 ${showLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            ))}
          </div>
        ) : (suggestions && suggestions.length > 0) ? (
          suggestions.map((suggestion: string, index: number) => (
            <div
              key={index}
              className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"
            >
              <p className="text-sm text-gray-700">{suggestion}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600">{isError ? "Could not load AI suggestions. Please try refreshing." : "No suggestions available."}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AISuggestionsCard;
