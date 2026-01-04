import { useSeoMeta } from '@unhead/react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/Header';
import { useWeatherStations } from '@/hooks/useWeatherStations';
import { useSensorReadings } from '@/hooks/useSensorReadings';

function LatestReading({ pubkey, sensorType, sensorModel }: { pubkey: string; sensorType: string; sensorModel: string }) {
  const now = Math.floor(Date.now() / 1000);
  const since = now - (60 * 60); // Last hour

  const { data: readings } = useSensorReadings({
    pubkey,
    sensorType,
    sensorModel,
    since,
  });

  const latest = readings?.[readings.length - 1];

  if (!latest) {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  // Get unit for this sensor type
  const units: Record<string, string> = {
    temp: '°C',
    humidity: '%',
    pm1: 'µg/m³',
    pm25: 'µg/m³',
    pm10: 'µg/m³',
    air_quality: 'raw',
  };
  const unit = units[sensorType] || '';

  // Format time ago
  const secondsAgo = now - latest.timestamp;
  const minutesAgo = Math.floor(secondsAgo / 60);
  const timeAgo = minutesAgo < 1 ? 'just now' : `${minutesAgo}m ago`;

  return (
    <span className="text-xs">
      <span className="font-medium">{latest.value.toFixed(1)}{unit}</span>
      <span className="text-muted-foreground ml-2">{timeAgo}</span>
    </span>
  );
}

const Stations = () => {
  useSeoMeta({
    title: 'Stations - Weather Stations',
    description: 'View all weather stations and their sensors',
  });

  const { data: stations, isLoading } = useWeatherStations();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">Weather Stations</h2>
          <p className="text-muted-foreground">
            Overview of all active stations and their sensors
          </p>
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
              <Card key={station.pubkey}>
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

                  <div className="grid gap-2">
                    {station.sensorModels.flatMap((model) =>
                      model.types.map((type) => (
                        <div key={`${model.model}-${type}`} className="flex items-center justify-between py-2 border-t first:border-0">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-sm">{model.model}</span>
                            <span className="text-xs text-muted-foreground">{type}</span>
                          </div>
                          <LatestReading
                            pubkey={station.pubkey}
                            sensorType={type}
                            sensorModel={model.model}
                          />
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
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
