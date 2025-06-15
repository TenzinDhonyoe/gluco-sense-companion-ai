
import { type GlucoseReading } from "@/components/GlucoseTrendChart";

// Interface for LTTB, extending GlucoseReading to preserve all original data
interface Point extends GlucoseReading {
    x: number; // timestamp
    y: number; // value
}

// Largest-Triangle-Three-Buckets down-sampling algorithm
// Reduces the number of points in a series while preserving its visual shape.
export const downsampleLTTB = (data: Point[], threshold: number): Point[] => {
    if (threshold >= data.length || threshold <= 2) {
        return data;
    }

    const dataLength = data.length;
    const every = (dataLength - 2) / (threshold - 2);
    let a = 0;
    const sampled: Point[] = [data[a]];

    for (let i = 0; i < threshold - 2; i++) {
        let avgX = 0;
        let avgY = 0;
        const avgRangeStart = Math.floor((i + 1) * every) + 1;
        let avgRangeEnd = Math.floor((i + 2) * every) + 1;
        avgRangeEnd = avgRangeEnd < dataLength ? avgRangeEnd : dataLength;

        const avgRangeLength = avgRangeEnd - avgRangeStart;

        if (avgRangeLength > 0) {
            for (let j = avgRangeStart; j < avgRangeEnd; j++) {
                avgX += data[j].x;
                avgY += data[j].y;
            }
            avgX /= avgRangeLength;
            avgY /= avgRangeLength;
        }

        const rangeOffs = Math.floor(i * every) + 1;
        const rangeTo = Math.floor((i + 1) * every) + 1;

        const pointAX = data[a].x;
        const pointAY = data[a].y;

        let maxArea = -1;
        let nextA = -1;

        for (let j = rangeOffs; j < rangeTo; j++) {
            const area = Math.abs((pointAX - avgX) * (data[j].y - pointAY) - (pointAX - data[j].x) * (avgY - pointAY)) * 0.5;
            if (area > maxArea) {
                maxArea = area;
                nextA = j;
            }
        }
        
        if (nextA > -1) {
          sampled.push(data[nextA]);
          a = nextA;
        }
    }

    sampled.push(data[dataLength - 1]);

    return sampled;
};


// 3-point moving average for smoothing visual jitter.
export const movingAverage = (data: GlucoseReading[], windowSize: number): GlucoseReading[] => {
  if (windowSize <= 1 || data.length < windowSize) {
    return data;
  }

  return data.map((_point, i, arr) => {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(arr.length, i + Math.ceil(windowSize / 2));
    const windowSlice = arr.slice(start, end);
    
    const sum = windowSlice.reduce((acc, p) => acc + p.value, 0);
    const avgValue = sum / windowSlice.length;

    return {
      ...arr[i],
      value: Math.round(avgValue),
    };
  });
};
