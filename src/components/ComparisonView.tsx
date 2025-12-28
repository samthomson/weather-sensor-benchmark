import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2 } from 'lucide-react';
import { AddSensorDialog } from './AddSensorDialog';
import { SensorChart } from './SensorChart';
import { SensorDataTable } from './SensorDataTable';
import { OutliersList } from './OutliersList';
import { useMultipleSensorReadings } from '@/hooks/useSensorReadings';
import { filterMultipleSensorOutliers } from '@/lib/outlierFilter';
import { Skeleton } from '@/components/ui/skeleton';
import type { Comparison, SensorSelection } from '@/lib/comparisonStore';
import type { WeatherStation } from '@/hooks/useWeatherStations';

interface ComparisonViewProps {
  comparison: Comparison;
  stations: WeatherStation[];
  onAddSensor: (sensor: Omit<SensorSelection, 'id'>) => void;
  onRemoveSensor: (sensorId: string) => void;
  onDelete: () => void;
}

// Time range options
const TIME_RANGES = {
  '1h': {
    label: 'Last Hour',
    seconds: 60 * 60,
    description: '1-minute intervals',
  },
  '24h': {
    label: 'Last 24 Hours',
    seconds: 24 * 60 * 60,
    description: '15-minute intervals',
  },
};

export function ComparisonView({
  comparison,
  stations,
  onAddSensor,
  onRemoveSensor,
  onDelete,
}: ComparisonViewProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '24h'>('24h');

  // Calculate time range - memoize to prevent constant re-queries
  const { since, until } = useMemo(() => {
    const now = Math.floor(Date.now() / 1000);
    return {
      since: now - TIME_RANGES[timeRange].seconds,
      until: now,
    };
  }, [timeRange]); // Only recalculate when timeRange changes

  // Prepare sensor list for query - expand each sensor model into all its types
  const sensors = comparison.sensors.flatMap(s =>
    (s.sensorTypes || []).map(type => ({
      pubkey: s.stationPubkey,
      sensorType: type,
      sensorModel: s.sensorModel,
    }))
  );

  // Fetch data for all sensors
  const { data, isLoading, error } = useMultipleSensorReadings(sensors, since, until);

  // Create sensor name mapping - use numbered format for compact display
  const sensorNames: Record<string, string> = {};
  comparison.sensors.forEach((sensor, index) => {
    (sensor.sensorTypes || []).forEach(type => {
      const key = `${sensor.stationPubkey}-${type}-${sensor.sensorModel}`;
      // Format: "#1 - pm25" (much more compact)
      sensorNames[key] = `#${index + 1} - ${type}`;
    });
  });

  // Get existing sensor keys for filtering in the AddSensorDialog
  const existingSensors = comparison.sensors.map(s => ({
    stationPubkey: s.stationPubkey,
    sensorModel: s.sensorModel,
  }));

  // Filter outliers from the data
  const { filteredData, allOutliers } = useMemo(() => {
    if (!data) return { filteredData: [], allOutliers: [] };
    return filterMultipleSensorOutliers(data, sensorNames);
  }, [data, sensorNames]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{comparison.name}</CardTitle>
            <CardDescription>
              {comparison.sensors.length} sensor{comparison.sensors.length !== 1 ? 's' : ''} selected
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sensor List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Selected Sensor Models</h3>
            <AddSensorDialog
              stations={stations}
              onAdd={onAddSensor}
              existingSensors={existingSensors}
            />
          </div>

          {comparison.sensors.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground text-sm">
                  No sensor models selected. Click "Add Sensor" to get started.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-wrap gap-3">
              {comparison.sensors.map((sensor, index) => {
                // Color schemes for stations
                const colorSchemes = [
                  { border: 'border-blue-300 dark:border-blue-700', bg: 'bg-blue-600', text: 'text-blue-700 dark:text-blue-300' },
                  { border: 'border-red-300 dark:border-red-700', bg: 'bg-red-600', text: 'text-red-700 dark:text-red-300' },
                  { border: 'border-green-300 dark:border-green-700', bg: 'bg-green-600', text: 'text-green-700 dark:text-green-300' },
                  { border: 'border-amber-300 dark:border-amber-700', bg: 'bg-amber-600', text: 'text-amber-700 dark:text-amber-300' },
                  { border: 'border-purple-300 dark:border-purple-700', bg: 'bg-purple-600', text: 'text-purple-700 dark:text-purple-300' },
                  { border: 'border-pink-300 dark:border-pink-700', bg: 'bg-pink-600', text: 'text-pink-700 dark:text-pink-300' },
                ];
                const colors = colorSchemes[index % colorSchemes.length];

                return (
                  <div
                    key={sensor.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${colors.border} bg-background/50`}
                  >
                    <span className={`font-semibold text-sm ${colors.text}`}>#{index + 1}</span>
                    <span className="text-sm">{sensor.stationName}</span>
                    <Badge className={`${colors.bg} text-white px-2 py-0.5 text-xs`}>
                      {sensor.sensorModel} ({(sensor.sensorTypes || []).join(', ')})
                    </Badge>
                    <button
                      onClick={() => onRemoveSensor(sensor.id)}
                      className="ml-1 hover:opacity-70 text-muted-foreground hover:text-destructive"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Data Visualization */}
        {comparison.sensors.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Data Comparison</h3>
              <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as '1h' | '24h')}>
                <TabsList>
                  <TabsTrigger value="1h">{TIME_RANGES['1h'].label}</TabsTrigger>
                  <TabsTrigger value="24h">{TIME_RANGES['24h'].label}</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {isLoading && (
              <div className="space-y-4">
                <Skeleton className="h-[400px] w-full" />
                <Skeleton className="h-[200px] w-full" />
              </div>
            )}

            {error && (
              <Card className="border-destructive">
                <CardContent className="py-8">
                  <p className="text-center text-destructive">
                    Error loading sensor data. Please try again.
                  </p>
                </CardContent>
              </Card>
            )}

            {data && !isLoading && !error && (
              <>
                {filteredData.every(d => d.readings.length === 0) ? (
                  <Card className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20">
                    <CardContent className="py-8">
                      <p className="text-center text-amber-800 dark:text-amber-200">
                        No sensor data found for the selected time range. The sensors may not have published data recently.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <Tabs defaultValue="chart" className="w-full">
                      <TabsList className="w-full grid grid-cols-2">
                        <TabsTrigger value="chart">Chart View</TabsTrigger>
                        <TabsTrigger value="table">Table View</TabsTrigger>
                      </TabsList>
                      <TabsContent value="chart" className="mt-4">
                        <SensorChart
                          title={`${comparison.name} - ${TIME_RANGES[timeRange].label}`}
                          description={TIME_RANGES[timeRange].description}
                          data={filteredData}
                          sensorNames={sensorNames}
                        />
                      </TabsContent>
                      <TabsContent value="table" className="mt-4">
                        <SensorDataTable
                          title={`${comparison.name} - Statistics`}
                          description={TIME_RANGES[timeRange].description}
                          data={filteredData}
                          sensorNames={sensorNames}
                        />
                      </TabsContent>
                    </Tabs>

                    {/* Show outliers if any were detected */}
                    <OutliersList outliers={allOutliers} />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
