import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export interface LatestSensorData {
  sensorType: string;
  sensorModel: string;
  value: number;
  timestamp: number;
  unit: string;
}

/**
 * Hook to fetch the latest readings for all sensors on a station
 */
export function useLatestStationReadings(pubkey: string) {
  const { nostr } = useNostr();
  
  return useQuery({
    queryKey: ['latest-station-readings', pubkey],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(5000)]);
      
      // Query only from relay.samt.st
      const relay = nostr.relay('wss://relay.samt.st');
      
      const now = Math.floor(Date.now() / 1000);
      const since = now - (24 * 60 * 60); // Last 24 hours
      
      const events = await relay.query(
        [{
          kinds: [4223],
          authors: [pubkey],
          '#t': ['weather'],
          since,
          limit: 100, // Get recent events
        }],
        { signal }
      );
      
      // Parse all sensor readings from events
      const sensorMap = new Map<string, LatestSensorData>();
      
      // Process events in reverse chronological order to get latest values
      const sortedEvents = events.sort((a, b) => b.created_at - a.created_at);
      
      for (const event of sortedEvents) {
        const sensorTags = event.tags.filter(([tag]) => 
          ['temp', 'humidity', 'pm1', 'pm25', 'pm10', 'air_quality', 'pressure'].includes(tag)
        );
        
        for (const [sensorType, value, model] of sensorTags) {
          const key = `${sensorType}-${model}`;
          
          // Only store if we haven't seen this sensor yet (keeps the latest)
          if (!sensorMap.has(key) && value) {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
              sensorMap.set(key, {
                sensorType,
                sensorModel: model || 'unknown',
                value: numValue,
                timestamp: event.created_at,
                unit: getUnit(sensorType),
              });
            }
          }
        }
      }
      
      return Array.from(sensorMap.values());
    },
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
