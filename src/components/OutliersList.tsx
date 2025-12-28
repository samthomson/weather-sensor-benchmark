import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle } from 'lucide-react';
import type { OutlierInfo } from '@/lib/outlierFilter';

interface OutliersListProps {
  outliers: OutlierInfo[];
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

// Format timestamp for display
function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function OutliersList({ outliers }: OutliersListProps) {
  if (outliers.length === 0) {
    return null;
  }

  // Sort outliers by timestamp (newest first)
  const sortedOutliers = [...outliers].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <Card className="border-amber-200 dark:border-amber-900 bg-amber-50/50 dark:bg-amber-950/10">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
          <CardTitle className="text-base">Outliers Removed</CardTitle>
        </div>
        <CardDescription>
          {outliers.length} invalid reading{outliers.length !== 1 ? 's' : ''} detected and filtered out (values that changed by more than 300%)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sensor</TableHead>
              <TableHead>Time</TableHead>
              <TableHead className="text-right">Invalid Value</TableHead>
              <TableHead className="text-right">Previous Value</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOutliers.map((outlier, index) => {
              const unit = getSensorUnit(outlier.sensorType);
              return (
                <TableRow key={`${outlier.timestamp}-${outlier.sensorType}-${index}`}>
                  <TableCell className="font-medium">
                    {outlier.stationName}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatTimestamp(outlier.timestamp)}
                  </TableCell>
                  <TableCell className="text-right text-amber-900 dark:text-amber-100 font-semibold">
                    {outlier.value.toFixed(2)} {unit}
                  </TableCell>
                  <TableCell className="text-right">
                    {outlier.previousValue.toFixed(2)} {unit}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-amber-900 dark:text-amber-100">
                    {outlier.percentChange.toFixed(0)}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
