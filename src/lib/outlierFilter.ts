import type { SensorReading } from '@/hooks/useSensorReadings';

export interface OutlierInfo {
  timestamp: number;
  value: number;
  previousValue: number;
  percentChange: number;
  sensorType: string;
  sensorModel: string;
  stationName: string;
}

export interface FilteredReadings {
  validReadings: SensorReading[];
  outliers: OutlierInfo[];
}

/**
 * Filter outlier readings that deviate more than 300% from the previous value
 * @param readings - Array of sensor readings (should be sorted by timestamp)
 * @param stationName - Name of the station for outlier tracking
 * @returns Object containing valid readings and detected outliers
 */
export function filterOutliers(
  readings: SensorReading[],
  stationName: string
): FilteredReadings {
  if (readings.length === 0) {
    return { validReadings: [], outliers: [] };
  }

  const validReadings: SensorReading[] = [];
  const outliers: OutlierInfo[] = [];

  // First reading is always valid (no previous value to compare)
  validReadings.push(readings[0]);

  for (let i = 1; i < readings.length; i++) {
    const current = readings[i];
    const previous = readings[i - 1];

    // Calculate percentage change
    const percentChange = Math.abs((current.value - previous.value) / previous.value) * 100;

    // If change is more than 300%, mark as outlier
    if (percentChange > 300) {
      outliers.push({
        timestamp: current.timestamp,
        value: current.value,
        previousValue: previous.value,
        percentChange,
        sensorType: current.sensorType,
        sensorModel: current.model,
        stationName,
      });
    } else {
      validReadings.push(current);
    }
  }

  return { validReadings, outliers };
}

/**
 * Filter outliers from multiple sensor reading arrays
 */
export function filterMultipleSensorOutliers(
  data: Array<{
    sensor: { pubkey: string; sensorType: string; sensorModel: string };
    readings: SensorReading[];
  }>,
  stationNames: Record<string, string>
): {
  filteredData: Array<{
    sensor: { pubkey: string; sensorType: string; sensorModel: string };
    readings: SensorReading[];
  }>;
  allOutliers: OutlierInfo[];
} {
  const filteredData = [];
  const allOutliers: OutlierInfo[] = [];

  for (const item of data) {
    const sensorKey = `${item.sensor.pubkey}-${item.sensor.sensorType}-${item.sensor.sensorModel}`;
    const stationName = stationNames[sensorKey] || 'Unknown';

    const { validReadings, outliers } = filterOutliers(item.readings, stationName);

    filteredData.push({
      sensor: item.sensor,
      readings: validReadings,
    });

    allOutliers.push(...outliers);
  }

  return { filteredData, allOutliers };
}
