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
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-lg">{station.name}</h3>
            <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
              {station.power && <span>Power: {station.power}</span>}
              {station.connectivity && <span>Connectivity: {station.connectivity}</span>}
              {station.geohash && <span>Location: {station.geohash}</span>}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        )}

        {!isLoading && (
          <div className="grid gap-2">
            {station.sensorModels.flatMap((model) =>
              model.types.map((type) => {
                const reading = latestReadings?.find(
                  r => r.sensorType === type && r.sensorModel === model.model
                );

                return (
                  <div key={`${model.model}-${type}`} className="flex items-center justify-between py-2 border-t first:border-0">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-sm">{model.model}</span>
                      <span className="text-xs text-muted-foreground">{type}</span>
                    </div>
                    {reading ? (
                      <span className="text-xs">
                        <span className="font-medium">{reading.value.toFixed(1)}{reading.unit}</span>
                        <span className="text-muted-foreground ml-2">{formatTimeAgo(reading.timestamp)}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No data</span>
                    )}
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
          <div className="space-y-4">
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
