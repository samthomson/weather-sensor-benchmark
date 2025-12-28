import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2 } from 'lucide-react';
import { AddSensorDialog } from './AddSensorDialog';
import { SensorChart } from './SensorChart';
import { SensorDataTable } from './SensorDataTable';
import { useMultipleSensorReadings } from '@/hooks/useSensorReadings';
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
  console.log('ComparisonView rendering with comparison:', comparison);

  const [timeRange, setTimeRange] = useState<'1h' | '24h'>('24h');

  // Calculate time range
  const now = Math.floor(Date.now() / 1000);
  const since = now - TIME_RANGES[timeRange].seconds;

  // Prepare sensor list for query - expand each sensor model into all its types
  const sensors = comparison.sensors.flatMap(s =>
    (s.sensorTypes || []).map(type => ({
      pubkey: s.stationPubkey,
      sensorType: type,
      sensorModel: s.sensorModel,
    }))
  );

  // Fetch data for all sensors
  const { data, isLoading, error } = useMultipleSensorReadings(sensors, since, now);

  // Create sensor name mapping
  const sensorNames: Record<string, string> = {};
  comparison.sensors.forEach(sensor => {
    (sensor.sensorTypes || []).forEach(type => {
      const key = `${sensor.stationPubkey}-${type}-${sensor.sensorModel}`;
      sensorNames[key] = `${sensor.stationName} - ${type} (${sensor.sensorModel})`;
    });
  });

  // Get existing sensor keys for filtering in the AddSensorDialog
  const existingSensors = comparison.sensors.map(s => ({
    stationPubkey: s.stationPubkey,
    sensorModel: s.sensorModel,
  }));

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
            <div className="flex flex-wrap gap-2">
              {comparison.sensors.map(sensor => (
                <Badge key={sensor.id} variant="secondary" className="px-3 py-1.5">
                  {sensor.stationName} - {sensor.sensorModel} ({(sensor.sensorTypes || []).join(', ')})
                  <button
                    onClick={() => onRemoveSensor(sensor.id)}
                    className="ml-2 hover:text-destructive"
                  >
                    ×
                  </button>
                </Badge>
              ))}
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
                {(() => {
                  console.log('ComparisonView data check:', data);
                  console.log('Readings counts:', data.map(d => d.readings.length));
                  const allEmpty = data.every(d => d.readings.length === 0);
                  console.log('All empty?', allEmpty);
                  return allEmpty;
                })() ? (
                  <Card className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20">
                    <CardContent className="py-8">
                      <p className="text-center text-amber-800 dark:text-amber-200">
                        No sensor data found for the selected time range. The sensors may not have published data recently.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Tabs defaultValue="chart" className="w-full">
                    <TabsList className="w-full grid grid-cols-2">
                      <TabsTrigger value="chart">Chart View</TabsTrigger>
                      <TabsTrigger value="table">Table View</TabsTrigger>
                    </TabsList>
                    <TabsContent value="chart" className="mt-4">
                      <SensorChart
                        title={`${comparison.name} - ${TIME_RANGES[timeRange].label}`}
                        description={TIME_RANGES[timeRange].description}
                        data={data}
                        sensorNames={sensorNames}
                      />
                    </TabsContent>
                    <TabsContent value="table" className="mt-4">
                      <SensorDataTable
                        title={`${comparison.name} - Statistics`}
                        description={TIME_RANGES[timeRange].description}
                        data={data}
                        sensorNames={sensorNames}
                      />
                    </TabsContent>
                  </Tabs>
                )}
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
