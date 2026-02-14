import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { WeatherStation } from '@/hooks/useWeatherStations';
import type { LatestSensorData } from '@/hooks/useAllLatestReadings';

interface StationDetailModalProps {
  station: WeatherStation | null;
  readings: LatestSensorData[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getUnit(sensorType: string): string {
  const units: Record<string, string> = {
    temp: '°C',
    humidity: '%',
    pm1: 'µg/m³',
    pm25: 'µg/m³',
    pm10: 'µg/m³',
    air_quality: 'raw',
    pressure: 'hPa',
    light: 'lux',
    rain: 'raw',
  };
  return units[sensorType] || '';
}

export function StationDetailModal({ station, readings, open, onOpenChange }: StationDetailModalProps) {
  const { nostr } = useNostr();

  // Fetch recent readings for this station
  const { data: recentReadings = [] } = useQuery({
    queryKey: ['station-recent-readings', station?.pubkey],
    queryFn: async (c) => {
      if (!station) return [];
      
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      const relay = nostr.relay('wss://relay.samt.st');
      
      const now = Math.floor(Date.now() / 1000);
      const since = now - (24 * 60 * 60);
      
      const events = await relay.query(
        [{
          kinds: [4223],
          authors: [station.pubkey],
          '#t': ['weather'],
          since,
          limit: 30,
        }],
        { signal }
      );
      
      return events.sort((a, b) => b.created_at - a.created_at);
    },
    enabled: open && station !== null,
    staleTime: 30 * 1000,
  });

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
      <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">{station.name}</DialogTitle>
          {station.description && (
            <p className="text-sm text-muted-foreground pt-2">{station.description}</p>
          )}
        </DialogHeader>

        {/* Metadata */}
        <div className="flex gap-2 text-xs">
          {station.power && <span className="px-2 py-1 bg-muted rounded">{station.power}</span>}
          {station.connectivity && <span className="px-2 py-1 bg-muted rounded">{station.connectivity}</span>}
          {station.geohash && <span className="px-2 py-1 bg-muted rounded">{station.geohash}</span>}
        </div>

        <Tabs defaultValue="latest" className="w-full flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="latest">Latest</TabsTrigger>
            <TabsTrigger value="recent">Recent</TabsTrigger>
          </TabsList>

          <TabsContent value="latest" className="space-y-6 mt-4 flex-1 overflow-y-auto">
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
                                  <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:bg-amber-950">
                                    418
                                  </Badge>
                                ) : (
                                  <span className="text-xs text-muted-foreground">—</span>
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
            </TabsContent>

            <TabsContent value="recent" className="mt-4 flex-1 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Timestamp</TableHead>
                    <TableHead>Sensor Readings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReadings.map((event, index) => {
                    // Extract all sensor readings from this event
                    const standardTags = ['t', 'a', 'e', 'p', 'd', 'alt', 'content-warning', 'subject', 'client'];
                    const sensorData = event.tags
                      .filter(([tag, value, model]) => 
                        !standardTags.includes(tag) && 
                        value !== undefined && 
                        model !== undefined &&
                        !isNaN(parseFloat(value))
                      );

                    return (
                      <TableRow key={`${event.id}-${index}`}>
                        <TableCell className="text-sm font-medium align-top">
                          {formatTime(event.created_at)}
                        </TableCell>
                        <TableCell>
                          {sensorData.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {sensorData.map(([tag, value], i) => {
                                const numValue = parseFloat(value);
                                const unit = getUnit(tag);
                                return (
                                  <span key={i} className="text-xs px-2 py-1 bg-muted rounded">
                                    <span className="font-medium">{tag}:</span>{' '}
                                    <span className="font-semibold">{numValue.toFixed(1)}</span>
                                    {unit && <span className="text-muted-foreground ml-0.5">{unit}</span>}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">No sensor data</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {recentReadings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-8">
                        No recent readings available
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
