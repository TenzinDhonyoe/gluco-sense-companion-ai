
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"; 
import { Brain, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AIParseInput = () => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!input.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe what you ate or your exercise activity.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to use this feature');
      }

      const response = await supabase.functions.invoke('parse-user-input', {
        body: { input: input.trim() }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to parse input');
      }

      const result = response.data;
      if (result.success) {
        toast({
          title: "Successfully Logged!",
          description: result.message,
        });
        setInput("");
        
        // Trigger logs refresh
        window.dispatchEvent(new CustomEvent('logsChanged'));
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error parsing input:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to process your input. Please try again.',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <span>AI-Powered Logging</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Describe what you ate or your exercise... 
          
Examples:
• Had 2 slices of pepperoni pizza and a Coke
• Jogged for 30 minutes at moderate pace  
• Ate a chicken caesar salad with dressing
• Did 45 minutes of weight training"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="min-h-[100px] border-gray-200"
          disabled={isLoading}
        />
        
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !input.trim()}
          className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing with AI...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Parse & Log with AI
            </>
          )}
        </Button>
        
        <p className="text-xs text-gray-500 text-center">
          AI will automatically detect if it's a meal or exercise and log it with nutrition/activity data
        </p>
      </CardContent>
    </Card>
  );
};

export default AIParseInput;
