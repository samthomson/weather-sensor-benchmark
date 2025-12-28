import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { SensorReading } from '@/hooks/useSensorReadings';

interface SensorDataTableProps {
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
  sensorNames: Record<string, string>;
}

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

// Calculate statistics for a set of readings
function calculateStats(readings: SensorReading[]) {
  if (readings.length === 0) {
    return {
      count: 0,
      min: 0,
      max: 0,
      avg: 0,
      latest: 0,
    };
  }

  const values = readings.map(r => r.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
  const latest = readings[readings.length - 1]?.value || 0;

  return {
    count: readings.length,
    min,
    max,
    avg,
    latest,
  };
}

export function SensorDataTable({ title, description, data, sensorNames }: SensorDataTableProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-muted-foreground">
            No data available
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sensor</TableHead>
              <TableHead className="text-right">Data Points</TableHead>
              <TableHead className="text-right">Min {unit}</TableHead>
              <TableHead className="text-right">Max {unit}</TableHead>
              <TableHead className="text-right">Avg {unit}</TableHead>
              <TableHead className="text-right">Latest {unit}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map(({ sensor, readings }) => {
              const sensorKey = `${sensor.pubkey}-${sensor.sensorType}-${sensor.sensorModel}`;
              const displayName = sensorNames[sensorKey] || 'Unknown Sensor';
              const stats = calculateStats(readings);

              return (
                <TableRow key={sensorKey}>
                  <TableCell className="font-medium">{displayName}</TableCell>
                  <TableCell className="text-right">{stats.count}</TableCell>
                  <TableCell className="text-right">{stats.min.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{stats.max.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{stats.avg.toFixed(2)}</TableCell>
                  <TableCell className="text-right font-semibold">{stats.latest.toFixed(2)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
