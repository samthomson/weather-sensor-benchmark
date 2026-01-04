import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';

export interface LatestSensorData {
  pubkey: string;
  sensorType: string;
  sensorModel: string;
  value: number;
  timestamp: number;
  unit: string;
}

/**
 * Hook to fetch the latest readings for all stations in one query
 */
export function useAllLatestReadings(pubkeys: string[]) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['all-latest-readings', pubkeys.join(',')],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);

      if (pubkeys.length === 0) return [];

      // Query only from relay.samt.st
      const relay = nostr.relay('wss://relay.samt.st');

      const now = Math.floor(Date.now() / 1000);
      const since = now - (24 * 60 * 60); // Last 24 hours

      // Query each station separately to ensure we get data from all stations
      // (prevents one high-frequency station from filling the limit)
      const allEvents = await Promise.all(
        pubkeys.map(pubkey =>
          relay.query(
            [{
              kinds: [4223],
              authors: [pubkey],
              '#t': ['weather'],
              since,
              limit: 100, // Get recent events per station
            }],
            { signal }
          )
        )
      );

      const events = allEvents.flat();

      console.log(`Fetched ${events.length} events total from ${pubkeys.length} stations (${pubkeys.length} queries)`);

      // Parse all sensor readings from events, grouped by station
      const allReadings: LatestSensorData[] = [];
      const seenKeys = new Set<string>();

      // Process events in reverse chronological order to get latest values
      const sortedEvents = events.sort((a, b) => b.created_at - a.created_at);

      for (const event of sortedEvents) {
        // Get all tags that have 3 elements [tag, value, model] and the value is numeric
        // Skip standard Nostr tags like 't', 'a', 'e', 'p', 'd'
        const standardTags = ['t', 'a', 'e', 'p', 'd', 'alt', 'content-warning', 'subject', 'client'];

        const sensorTags = event.tags.filter(([tag, value, model]) =>
          !standardTags.includes(tag) && // Not a standard Nostr tag
          value !== undefined && // Has a value
          model !== undefined && // Has a model
          !isNaN(parseFloat(value)) // Value is numeric
        );

        for (const [sensorType, value, model] of sensorTags) {
          const key = `${event.pubkey}-${sensorType}-${model}`;

          // Only store if we haven't seen this exact sensor yet (keeps the latest)
          if (!seenKeys.has(key)) {
            const numValue = parseFloat(value);
            allReadings.push({
              pubkey: event.pubkey,
              sensorType,
              sensorModel: model,
              value: numValue,
              timestamp: event.created_at,
              unit: getUnit(sensorType),
            });
            seenKeys.add(key);
          }
        }
      }

      return allReadings;
    },
    enabled: pubkeys.length > 0,
    staleTime: 30 * 1000, // 30 seconds
  });
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
