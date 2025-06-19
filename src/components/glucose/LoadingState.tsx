
import { Card, CardContent } from "@/components/ui/card";

const LoadingState = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center text-gray-500">Loading readings...</div>
      </CardContent>
    </Card>
  );
};

export default LoadingState;
