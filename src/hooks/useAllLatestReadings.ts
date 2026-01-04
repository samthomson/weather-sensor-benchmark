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
      
      // Single query for ALL stations
      const events = await relay.query(
        [{
          kinds: [4223],
          authors: pubkeys,
          '#t': ['weather'],
          since,
          limit: 500, // Should be enough for latest readings from all stations
        }],
        { signal }
      );
      
      console.log(`Fetched ${events.length} events for ${pubkeys.length} stations`);
      
      // Parse all sensor readings from events, grouped by station
      const allReadings: LatestSensorData[] = [];
      const seenKeys = new Set<string>();
      
      // Process events in reverse chronological order to get latest values
      const sortedEvents = events.sort((a, b) => b.created_at - a.created_at);
      
      for (const event of sortedEvents) {
        const sensorTags = event.tags.filter(([tag]) => 
          ['temp', 'humidity', 'pm1', 'pm25', 'pm10', 'air_quality', 'pressure'].includes(tag)
        );
        
        for (const [sensorType, value, model] of sensorTags) {
          const key = `${event.pubkey}-${sensorType}-${model}`;
          
          // Only store if we haven't seen this exact sensor yet (keeps the latest)
          if (!seenKeys.has(key) && value) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              allReadings.push({
                pubkey: event.pubkey,
                sensorType,
                sensorModel: model || 'unknown',
                value: numValue,
                timestamp: event.created_at,
                unit: getUnit(sensorType),
              });
              seenKeys.add(key);
            }
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
  };
  return units[sensorType] || '';
}
