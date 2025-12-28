import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SensorReading } from '@/hooks/useSensorReadings';

interface LegendItem {
  stationName: string;
  stationPubkey: string;
  color: string;
  sensors: Array<{
    type: string;
    key: string;
    strokeDasharray: string;
  }>;
}

interface SensorChartProps {
  title: string;
  description?: string;
  data: Array<{
    sensor: {
      pubkey: string;
      sensorType: string;
      sensorModel: string;
    };
    readings: SensorReading[];
  }>;
  sensorNames: Record<string, string>; // Maps sensor ID to display name
}

// Color palette for different stations
const STATION_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
];

// Line styles for different sensor types
const SENSOR_TYPE_STYLES: Record<string, string> = {
  'pm1': '0',      // solid
  'pm25': '5 5',   // dashed
  'pm10': '2 2',   // dotted
  'temp': '0',     // solid
  'humidity': '5 5', // dashed
  'air_quality': '2 2', // dotted
};

// Get sensor unit based on type
function getSensorUnit(sensorType: string): string {
  const units: Record<string, string> = {
    temp: '°C',
    humidity: '%',
    pm1: 'µg/m³',
    pm25: 'µg/m³',
    pm10: 'µg/m³',
    air_quality: 'raw',
  };
  return units[sensorType] || '';
}

// Format timestamp for X-axis
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Format timestamp for tooltip (more detailed)
function formatTooltipTime(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SensorChart({ title, description, data, sensorNames }: SensorChartProps) {
  // Combine all readings into a single dataset with timestamps
  const allTimestamps = new Set<number>();
  data.forEach(({ readings }) => {
    readings.forEach(reading => {
      allTimestamps.add(reading.timestamp);
    });
  });

  const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

  // Build chart data with forward-fill for missing values
  const chartData = sortedTimestamps.map(timestamp => {
    const dataPoint: Record<string, number | string> = {
      timestamp,
      time: formatTimestamp(timestamp),
    };

    data.forEach(({ sensor, readings }) => {
      const sensorKey = `${sensor.pubkey}-${sensor.sensorType}-${sensor.sensorModel}`;

      // Find exact reading at this timestamp
      const exactReading = readings.find(r => r.timestamp === timestamp);

      if (exactReading) {
        dataPoint[sensorKey] = exactReading.value;
      } else {
        // Find the most recent reading before this timestamp (forward-fill)
        const previousReading = readings
          .filter(r => r.timestamp < timestamp)
          .sort((a, b) => b.timestamp - a.timestamp)[0];

        if (previousReading) {
          dataPoint[sensorKey] = previousReading.value;
        }
      }
    });

    return dataPoint;
  });

  // Group sensors by station for consistent coloring and organized legend
  const legendItems: LegendItem[] = [];
  const stationMap = new Map<string, LegendItem>();

  data.forEach(({ sensor }) => {
    const sensorKey = `${sensor.pubkey}-${sensor.sensorType}-${sensor.sensorModel}`;
    const stationName = sensorNames[sensorKey]?.split(' - ')[0] || 'Unknown';

    if (!stationMap.has(sensor.pubkey)) {
      const colorIndex = stationMap.size;
      stationMap.set(sensor.pubkey, {
        stationName,
        stationPubkey: sensor.pubkey,
        color: STATION_COLORS[colorIndex % STATION_COLORS.length],
        sensors: [],
      });
    }

    const station = stationMap.get(sensor.pubkey)!;
    station.sensors.push({
      type: sensor.sensorType,
      key: sensorKey,
      strokeDasharray: SENSOR_TYPE_STYLES[sensor.sensorType] || '0',
    });
  });

  legendItems.push(...Array.from(stationMap.values()));

  // Custom legend component
  const CustomLegend = () => (
    <div className="flex flex-wrap gap-6 justify-center pt-4 px-4">
      {legendItems.map(item => (
        <div key={item.stationPubkey} className="space-y-1">
          <div className="font-semibold text-xs text-muted-foreground">{item.stationName}</div>
          <div className="flex flex-wrap gap-3">
            {item.sensors.map(sensor => (
              <div key={sensor.key} className="flex items-center gap-1.5">
                <svg width="24" height="2" className="mt-0.5">
                  <line
                    x1="0"
                    y1="1"
                    x2="24"
                    y2="1"
                    stroke={item.color}
                    strokeWidth="2"
                    strokeDasharray={sensor.strokeDasharray}
                  />
                </svg>
                <span className="text-xs">{sensor.type}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-muted-foreground">
            No data available for the selected time range
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get the sensor type and unit (for Y-axis label - uses first sensor)
  const sensorType = data[0]?.sensor.sensorType || '';
  const unit = getSensorUnit(sensorType);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; name: string; color: string; dataKey: string }>;
    label?: number;
  }) => {
    if (!active || !payload || !payload.length || !label) return null;

    // Group payload by sensor type, then sort by station
    const groupedBySensorType = new Map<string, typeof payload>();

    payload.forEach(entry => {
      // Extract sensor type from name (format: "#1 - pm25")
      const sensorType = entry.name.split(' - ')[1];
      if (!groupedBySensorType.has(sensorType)) {
        groupedBySensorType.set(sensorType, []);
      }
      groupedBySensorType.get(sensorType)!.push(entry);
    });

    // Sort each group by station number
    groupedBySensorType.forEach(group => {
      group.sort((a, b) => {
        const aNum = parseInt(a.name.match(/#(\d+)/)?.[1] || '0');
        const bNum = parseInt(b.name.match(/#(\d+)/)?.[1] || '0');
        return aNum - bNum;
      });
    });

    return (
      <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
        <p className="font-semibold mb-2 text-sm">{formatTooltipTime(label)}</p>
        <div className="space-y-2">
          {Array.from(groupedBySensorType.entries()).map(([sensorType, entries]) => {
            // Get unit for this specific sensor type
            const sensorUnit = getSensorUnit(sensorType);

            return (
              <div key={sensorType} className="space-y-1">
                {entries.map((entry, index) => {
                  // Get the line style for this sensor type
                  const strokeDasharray = SENSOR_TYPE_STYLES[sensorType] || '0';

                  return (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <svg width="16" height="2" className="flex-shrink-0">
                        <line
                          x1="0"
                          y1="1"
                          x2="16"
                          y2="1"
                          stroke={entry.color}
                          strokeWidth="2"
                          strokeDasharray={strokeDasharray}
                        />
                      </svg>
                      <span className="font-medium min-w-[4rem]">{entry.name}:</span>
                      <span className="font-semibold">{entry.value.toFixed(2)} {sensorUnit}</span>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="timestamp"
              type="number"
              domain={['dataMin', 'dataMax']}
              scale="time"
              tickFormatter={formatTimestamp}
              tick={{ fontSize: 12 }}
              minTickGap={50}
            />
            <YAxis
              label={{ value: unit, angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            {legendItems.map(item =>
              item.sensors.map(sensor => {
                const displayName = sensorNames[sensor.key] || `${item.stationName} - ${sensor.type}`;
                return (
                  <Line
                    key={sensor.key}
                    type="monotone"
                    dataKey={sensor.key}
                    name={displayName}
                    stroke={item.color}
                    strokeWidth={2}
                    strokeDasharray={sensor.strokeDasharray}
                    dot={false}
                    connectNulls
                  />
                );
              })
            )}
          </LineChart>
        </ResponsiveContainer>

        {/* Custom organized legend */}
        <CustomLegend />
      </CardContent>
    </Card>
  );
}
