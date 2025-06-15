
import { useLocation, Link } from "react-router-dom";
import { type GlucoseReading } from "@/components/GlucoseTrendChart";
import GlucoseTrendChart from "@/components/GlucoseTrendChart";
import { ArrowLeft, RotateCw } from "lucide-react";

const FullScreenInsights = () => {
  const location = useLocation();
  const state = location.state as { glucoseData?: GlucoseReading[], trendDirection?: 'up' | 'down' | 'flat' };
  const glucoseData: GlucoseReading[] = state?.glucoseData ?? [];
  const trendDirection = state?.trendDirection ?? 'flat';

  return (
    <div className="w-screen h-screen bg-white">
      {/* Rotation prompt, shown only in portrait mode */}
      <div className="flex h-full w-full items-center justify-center p-4 text-center landscape:hidden">
        <div className="flex flex-col items-center">
          <RotateCw className="w-12 h-12 mb-4 text-gray-400 animate-spin" />
          <h2 className="text-xl font-bold text-gray-800">
            Please rotate your device
          </h2>
          <p className="text-gray-600 mt-2">
            This view is optimized for landscape.
          </p>
        </div>
      </div>

      {/* Content, shown only in landscape mode */}
      <div className="hidden h-full w-full flex-col p-4 landscape:flex lg:p-6">
        <header className="flex-shrink-0">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
        </header>
        <main className="flex-grow pt-4">
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
