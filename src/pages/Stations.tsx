import { useState, useEffect } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/Header';
import { RefreshCw } from 'lucide-react';
import { useWeatherStations, type WeatherStation } from '@/hooks/useWeatherStations';
import { useAllLatestReadings, type LatestSensorData } from '@/hooks/useAllLatestReadings';
import { useQueryClient } from '@tanstack/react-query';

function StationCard({ station, allReadings }: { station: WeatherStation; allReadings: LatestSensorData[] }) {
  // Force re-render every minute to update relative timestamps
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Filter readings for this specific station
  const stationReadings = allReadings.filter(r => r.pubkey === station.pubkey);

  // Get the most recent timestamp from any sensor
  const latestTimestamp = stationReadings.length > 0
    ? Math.max(...stationReadings.map(r => r.timestamp))
    : null;

  // Format time ago - calculate now fresh each time
  const formatTimeAgo = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const secondsAgo = now - timestamp;
    const minutesAgo = Math.floor(secondsAgo / 60);
    const hoursAgo = Math.floor(minutesAgo / 60);

    if (minutesAgo < 1) return 'just now';
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    if (hoursAgo < 24) return `${hoursAgo}h ago`;
    return `${Math.floor(hoursAgo / 24)}d ago`;
  };

  const hasData = stationReadings.length > 0;

  return (
    <Card className={!hasData ? 'opacity-60' : ''}>
      <CardContent className="py-4">
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-lg">{station.name}</h3>
            {!hasData && (
              <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200 rounded">
                No readings
              </span>
            )}
          </div>
          {station.description && (
            <p className="text-sm text-muted-foreground mb-2">{station.description}</p>
          )}
          <div className="flex items-center justify-between">
            <div className="flex gap-2 text-xs text-muted-foreground">
              {station.power && <span className="px-2 py-1 bg-muted rounded">{station.power}</span>}
              {station.connectivity && <span className="px-2 py-1 bg-muted rounded">{station.connectivity}</span>}
              {station.geohash && <span className="px-2 py-1 bg-muted rounded">{station.geohash}</span>}
            </div>
            {latestTimestamp && (
              <span className="text-xs text-muted-foreground">
                {new Date(latestTimestamp * 1000).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                <span className="text-muted-foreground/70">({formatTimeAgo(latestTimestamp)})</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          {station.sensorModels.map((model) => (
            <div
              key={model.model}
              className="border-2 rounded-lg p-2 bg-muted/30"
            >
              <div className="text-xs font-medium text-muted-foreground mb-2 px-1">
                {model.model}
              </div>
              <div className="flex gap-2">
                {model.types.map((type) => {
                  const reading = stationReadings.find(
                    r => r.sensorType === type && r.sensorModel === model.model
                  );

                  return (
                    <div
                      key={type}
                      className="border border-dashed border-muted-foreground/20 rounded p-2 bg-background min-w-[80px] hover:bg-accent/50 transition-colors"
                    >
                      <div className="text-xs text-muted-foreground mb-1">{type}</div>
                      {reading ? (
                        <div className="text-base font-semibold">
                          {reading.value.toFixed(1)}
                          <span className="text-xs font-normal text-muted-foreground ml-1">
                            {reading.unit}
                          </span>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

const Stations = () => {
  useSeoMeta({
    title: 'Stations - Weather Stations',
    description: 'View all weather stations and their sensors',
  });

  const [hideInactive, setHideInactive] = useState(true);
  const queryClient = useQueryClient();
  const { data: stations, isLoading: stationsLoading } = useWeatherStations();

  // Get all station pubkeys
  const pubkeys = stations?.map(s => s.pubkey) || [];

  // Fetch all readings in a single query
  const { data: allReadings = [], isLoading: readingsLoading } = useAllLatestReadings(pubkeys);

  const isLoading = stationsLoading || readingsLoading;

  // Filter stations based on hideInactive setting
  const filteredStations = stations?.filter(station => {
    if (!hideInactive) return true;
    const hasReadings = allReadings.some(r => r.pubkey === station.pubkey);
    return hasReadings;
  }) || [];

  const handleRefresh = () => {
    // Invalidate all station-related queries
    queryClient.invalidateQueries({ queryKey: ['weather-stations'] });
    queryClient.invalidateQueries({ queryKey: ['all-latest-readings'] });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">Weather Stations</h2>
            <p className="text-muted-foreground">
              Overview of all active stations and their sensors
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="hide-inactive"
                checked={hideInactive}
                onCheckedChange={(checked) => setHideInactive(checked as boolean)}
              />
              <Label
                htmlFor="hide-inactive"
                className="text-sm font-normal cursor-pointer"
              >
                Hide stations with no readings
              </Label>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {!isLoading && stations && stations.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                No weather stations found. Make sure your stations are publishing to wss://relay.samt.st
              </p>
            </CardContent>
          </Card>
        )}

        {!isLoading && filteredStations.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredStations.map((station) => (
              <StationCard key={station.pubkey} station={station} allReadings={allReadings} />
            ))}
          </div>
        )}

        {!isLoading && stations && stations.length > 0 && filteredStations.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">
                All stations are hidden. Uncheck "Hide stations with no readings" to see them.
              </p>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-12 py-6">
        <div className="container mx-auto px-4 text-center">
          <a
            href="https://shakespeare.diy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Vibed with Shakespeare
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Stations;
