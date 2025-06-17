
import { useLocation, Link } from "react-router-dom";
import { type GlucoseReading } from "@/components/GlucoseTrendChart";
import GlucoseTrendChart from "@/components/GlucoseTrendChart";
import { ArrowLeft } from "lucide-react";

const FullScreenInsights = () => {
  const location = useLocation();
  const state = location.state as { glucoseData?: GlucoseReading[], trendDirection?: 'up' | 'down' | 'flat' };
  const glucoseData: GlucoseReading[] = state?.glucoseData ?? [];
  const trendDirection = state?.trendDirection ?? 'flat';

  return (
    <div className="w-screen h-screen bg-white">
      <div className="h-full w-full flex flex-col p-3 lg:p-4">
        <header className="flex-shrink-0">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
        </header>
        <main className="flex-grow pt-2">
          <GlucoseTrendChart
            data={glucoseData}
            trendDirection={trendDirection}
            containerClassName="h-full"
          />
        </main>
      </div>
    </div>
  );
};

export default FullScreenInsights;
