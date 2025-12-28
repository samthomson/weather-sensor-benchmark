import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { SensorReading } from '@/hooks/useSensorReadings';

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

// Color palette for different sensors
const COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#14b8a6', // teal
  '#f97316', // orange
];

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

// Format timestamp for display
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleTimeString('en-US', { 
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

  // Build chart data
  const chartData = sortedTimestamps.map(timestamp => {
    const dataPoint: Record<string, number | string> = {
      timestamp,
      time: formatTimestamp(timestamp),
    };

    data.forEach(({ sensor, readings }) => {
      const sensorKey = `${sensor.pubkey}-${sensor.sensorType}-${sensor.sensorModel}`;
      const reading = readings.find(r => r.timestamp === timestamp);
      if (reading) {
        dataPoint[sensorKey] = reading.value;
      }
    });

    return dataPoint;
  });

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

  // Get the sensor type and unit (assumes all sensors are the same type)
  const sensorType = data[0]?.sensor.sensorType || '';
  const unit = getSensorUnit(sensorType);

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
              dataKey="time" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis 
              label={{ value: unit, angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
              }}
            />
            <Legend />
            {data.map(({ sensor }, index) => {
              const sensorKey = `${sensor.pubkey}-${sensor.sensorType}-${sensor.sensorModel}`;
              const displayName = sensorNames[sensorKey] || `Sensor ${index + 1}`;
              const color = COLORS[index % COLORS.length];

              return (
                <Line
                  key={sensorKey}
                  type="monotone"
                  dataKey={sensorKey}
                  name={displayName}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
