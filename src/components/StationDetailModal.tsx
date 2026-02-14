import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle } from 'lucide-react';
import type { WeatherStation } from '@/hooks/useWeatherStations';
import type { LatestSensorData } from '@/hooks/useAllLatestReadings';

interface StationDetailModalProps {
  station: WeatherStation | null;
  readings: LatestSensorData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StationDetailModal({ station, readings, open, onOpenChange }: StationDetailModalProps) {
  if (!station) return null;

  // Format timestamp
  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Get all sensor readings for this station
  const stationReadings = readings.filter(r => r.pubkey === station.pubkey);

  // Group readings by sensor model
  const readingsByModel = new Map<string, LatestSensorData[]>();
  stationReadings.forEach(reading => {
    if (!readingsByModel.has(reading.sensorModel)) {
      readingsByModel.set(reading.sensorModel, []);
    }
    readingsByModel.get(reading.sensorModel)!.push(reading);
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{station.name}</DialogTitle>
          {station.description && (
            <p className="text-sm text-muted-foreground pt-2">{station.description}</p>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Metadata */}
          <div className="flex gap-2 text-xs">
            {station.power && <span className="px-2 py-1 bg-muted rounded">{station.power}</span>}
            {station.connectivity && <span className="px-2 py-1 bg-muted rounded">{station.connectivity}</span>}
            {station.geohash && <span className="px-2 py-1 bg-muted rounded">{station.geohash}</span>}
          </div>

          {/* Sensor Models and their statuses */}
          {station.sensorModels.map((model) => {
            const modelReadings = readingsByModel.get(model.model) || [];

            return (
              <div key={model.model} className="space-y-3">
                <h3 className="font-semibold text-lg">{model.model}</h3>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sensor Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Latest Value</TableHead>
                      <TableHead className="text-right">Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {model.types.map((type) => {
                      const reading = modelReadings.find(r => r.sensorType === type);
                      const status = model.statuses[type];

                      return (
                        <TableRow key={type}>
                          <TableCell className="font-medium">{type}</TableCell>
                          <TableCell>
                            {status === 'ok' ? (
                              <Badge variant="outline" className="gap-1 text-green-700 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-800 dark:bg-green-950">
                                <CheckCircle className="h-3 w-3" />
                                OK
                              </Badge>
                            ) : status === '418' ? (
                              <Badge variant="outline" className="gap-1 text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950">
                                <AlertCircle className="h-3 w-3" />
                                Error
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">
                                Unknown
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {reading ? (
                              <span className="font-medium">
                                {reading.value.toFixed(1)} {reading.unit}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {reading ? formatTime(reading.timestamp) : '—'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
