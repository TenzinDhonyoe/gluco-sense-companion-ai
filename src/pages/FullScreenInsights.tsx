
import { useLocation, Link } from "react-router-dom";
import { type GlucoseReading } from "@/components/GlucoseTrendChart";
import GlucoseTrendChart from "@/components/GlucoseTrendChart";
import { ArrowLeft, RotateCw } from "lucide-react";

const FullScreenInsights = () => {
  const location = useLocation();
  const state = location.state as { glucoseData?: GlucoseReading[] };
  const glucoseData: GlucoseReading[] = state?.glucoseData ?? [];

  return (
    <div className="w-screen h-screen bg-white">
      {/* Portrait mode message */}
      <div className="fixed inset-0 bg-white z-50 flex flex-col items-center justify-center text-center p-4 landscape:hidden">
        <RotateCw className="w-12 h-12 mb-4 text-gray-400" />
        <h2 className="text-xl font-bold text-gray-800">
          Please rotate your device
        </h2>
        <p className="text-gray-600 mt-2">
          This view is best experienced in landscape mode.
        </p>
      </div>

      {/* Landscape content */}
      <div className="hidden landscape:flex flex-col w-full h-full p-4 lg:p-6">
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
            trendDirection="flat"
            containerClassName="h-full"
          />
        </main>
      </div>
    </div>
  );
};

export default FullScreenInsights;
