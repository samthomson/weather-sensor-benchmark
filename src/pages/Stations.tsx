import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/Header';
import { RefreshCw } from 'lucide-react';
import { useWeatherStations, type WeatherStation } from '@/hooks/useWeatherStations';
import { useLatestStationReadings } from '@/hooks/useLatestStationReadings';
import { useQueryClient } from '@tanstack/react-query';

function StationCard({ station }: { station: WeatherStation }) {
  const { data: latestReadings, isLoading } = useLatestStationReadings(station.pubkey);
  const now = Math.floor(Date.now() / 1000);

  // Get the most recent timestamp from any sensor
  const latestTimestamp = latestReadings && latestReadings.length > 0
    ? Math.max(...latestReadings.map(r => r.timestamp))
    : null;

  // Format time ago
  const formatTimeAgo = (timestamp: number) => {
    const secondsAgo = now - timestamp;
    const minutesAgo = Math.floor(secondsAgo / 60);
    const hoursAgo = Math.floor(minutesAgo / 60);

    if (minutesAgo < 1) return 'just now';
    if (minutesAgo < 60) return `${minutesAgo}m ago`;
    if (hoursAgo < 24) return `${hoursAgo}h ago`;
    return `${Math.floor(hoursAgo / 24)}d ago`;
  };

  return (
    <Card>
      <CardContent className="py-4">
        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-2">{station.name}</h3>
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

        {isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {station.sensorModels.flatMap((model) =>
              model.types.map((type) => {
                const reading = latestReadings?.find(
                  r => r.sensorType === type && r.sensorModel === model.model
                );

                return (
                  <div
                    key={`${model.model}-${type}`}
                    className="border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div className="text-xs text-muted-foreground mb-1">{type}</div>
                    {reading ? (
                      <div className="text-lg font-semibold">
                        {reading.value.toFixed(1)}
                        <span className="text-xs font-normal text-muted-foreground ml-1">
                          {reading.unit}
                        </span>
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground">—</div>
                    )}
                    <div className="text-xs text-muted-foreground mt-1">{model.model}</div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const Stations = () => {
  useSeoMeta({
    title: 'Stations - Weather Stations',
    description: 'View all weather stations and their sensors',
  });

  const queryClient = useQueryClient();
  const { data: stations, isLoading } = useWeatherStations();

  const handleRefresh = () => {
    // Invalidate all station-related queries
    queryClient.invalidateQueries({ queryKey: ['weather-stations'] });
    queryClient.invalidateQueries({ queryKey: ['latest-station-readings'] });
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

        {!isLoading && stations && stations.length > 0 && (
          <div className="grid md:grid-cols-2 gap-4">
            {stations.map((station) => (
              <StationCard key={station.pubkey} station={station} />
            ))}
          </div>
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
