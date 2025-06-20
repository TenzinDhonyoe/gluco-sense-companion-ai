import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Trash } from "lucide-react";

const ClearDataButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleClearData = async () => {
    setIsLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to clear data",
          variant: "destructive",
        });
        return;
      }

      console.log('Clearing all glucose readings for user:', user.id);
      
      const { error } = await supabase
        .from('glucose_readings')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing glucose readings:', error);
        toast({
          title: "Error",
          description: "Failed to clear glucose readings. Please try again.",
          variant: "destructive",
        });
        return;
      }

      console.log('Successfully cleared all glucose readings');
      toast({
        title: "Success",
        description: "All glucose readings have been cleared",
      });

      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('glucoseReadingChanged'));
      
    } catch (error) {
      console.error('Error in handleClearData:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm"
          className="text-gray-500 hover:text-red-500 hover:bg-red-50 text-xs"
        >
          <Trash className="w-3 h-3 mr-1" />
          Clear Data
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Clear All Glucose Data</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete all your glucose readings from the database.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleClearData}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
          >
            {isLoading ? "Clearing..." : "Clear All Data"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ClearDataButton;
