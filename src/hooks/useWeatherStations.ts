import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export interface WeatherStation {
  pubkey: string;
  name: string;
  geohash?: string;
  power?: string;
  connectivity?: string;
  sensors: Array<{
    type: string;
    model: string;
  }>;
  event: NostrEvent;
}

/**
 * Validates a weather station metadata event (kind 16158)
 */
function validateWeatherStationEvent(event: NostrEvent): boolean {
  if (event.kind !== 16158) return false;
  
  // Must have at least one sensor tag
  const sensorTags = event.tags.filter(([name]) => name === 'sensor');
  if (sensorTags.length === 0) return false;
  
  return true;
}

/**
 * Parse weather station metadata event into structured data
 */
function parseWeatherStation(event: NostrEvent): WeatherStation {
  const name = event.tags.find(([tag]) => tag === 'name')?.[1] || 'Unknown Station';
  const geohash = event.tags.find(([tag]) => tag === 'g')?.[1];
  const power = event.tags.find(([tag]) => tag === 'power')?.[1];
  const connectivity = event.tags.find(([tag]) => tag === 'connectivity')?.[1];
  
  const sensors = event.tags
    .filter(([tag]) => tag === 'sensor')
    .map(([, type, model]) => ({
      type: type || 'unknown',
      model: model || 'unknown',
    }));
  
  return {
    pubkey: event.pubkey,
    name,
    geohash,
    power,
    connectivity,
    sensors,
    event,
  };
}

/**
 * Hook to fetch all weather stations (kind 16158)
 */
export function useWeatherStations() {
  const { nostr } = useNostr();
  
  return useQuery({
    queryKey: ['weather-stations'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      // Query only from relay.samt.st
      const relay = nostr.relay('wss://relay.samt.st');
      
      const events = await relay.query(
        [{ kinds: [16158], limit: 100 }],
        { signal }
      );
      
      // Filter and parse valid station events
      return events
        .filter(validateWeatherStationEvent)
        .map(parseWeatherStation);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
