import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export interface SensorReading {
  timestamp: number;
  sensorType: string;
  value: number;
  model: string;
  event: NostrEvent;
}

/**
 * Validates a sensor reading event (kind 4223)
 */
function validateSensorReadingEvent(event: NostrEvent): boolean {
  if (event.kind !== 4223) return false;

  // Must have the weather tag
  const hasWeatherTag = event.tags.some(([tag, value]) => tag === 't' && value === 'weather');
  if (!hasWeatherTag) return false;

  return true;
}

/**
 * Parse sensor reading event into structured data
 */
function parseSensorReadings(event: NostrEvent): SensorReading[] {
  const readings: SensorReading[] = [];

  // Known sensor types
  const sensorTypes = ['temp', 'humidity', 'pm1', 'pm25', 'pm10', 'air_quality'];

  for (const [tag, value, model] of event.tags) {
    if (sensorTypes.includes(tag) && value) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        readings.push({
          timestamp: event.created_at,
          sensorType: tag,
          value: numValue,
          model: model || 'unknown',
          event,
        });
      }
    }
  }

  return readings;
}

export interface UseSensorReadingsParams {
  pubkey: string;
  sensorType: string;
  sensorModel: string;
  since: number;
  until?: number;
}

/**
 * Hook to fetch sensor readings for a specific station and sensor
 */
export function useSensorReadings({
  pubkey,
  sensorType,
  sensorModel,
  since,
  until,
}: UseSensorReadingsParams) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['sensor-readings', pubkey, sensorType, sensorModel, since, until],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);

      // Query only from relay.samt.st
      const relay = nostr.relay('wss://relay.samt.st');

      const filter: Record<string, unknown> = {
        kinds: [4223],
        authors: [pubkey],
        '#t': ['weather'],
        since,
      };

      if (until) {
        filter.until = until;
      }

      const events = await relay.query([filter], { signal });

      // Filter valid events and parse readings
      const allReadings = events
        .filter(validateSensorReadingEvent)
        .flatMap(parseSensorReadings)
        .filter(reading =>
          reading.sensorType === sensorType &&
          reading.model === sensorModel
        )
        .sort((a, b) => a.timestamp - b.timestamp);

      return allReadings;
    },
    enabled: Boolean(pubkey && sensorType && sensorModel),
    staleTime: 30 * 1000, // 30 seconds
  });
}

/**
 * Hook to fetch multiple sensor readings for comparison
 */
export function useMultipleSensorReadings(
  sensors: Array<{ pubkey: string; sensorType: string; sensorModel: string }>,
  since: number,
  until?: number
) {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['multiple-sensor-readings', JSON.stringify(sensors), since, until],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(10000)]);

      // Query only from relay.samt.st
      const relay = nostr.relay('wss://relay.samt.st');

      // Get unique pubkeys
      const pubkeys = [...new Set(sensors.map(s => s.pubkey))];

      const filter: Record<string, unknown> = {
        kinds: [4223],
        authors: pubkeys,
        '#t': ['weather'],
        since,
      };

      if (until) {
        filter.until = until;
      }

      const events = await relay.query([filter], { signal });

      // Parse all readings
      const allReadings = events
        .filter(validateSensorReadingEvent)
        .flatMap(parseSensorReadings);

      // Group readings by sensor
      const grouped = sensors.map(sensor => ({
        sensor,
        readings: allReadings
          .filter(reading =>
            reading.event.pubkey === sensor.pubkey &&
            reading.sensorType === sensor.sensorType &&
            reading.model === sensor.sensorModel
          )
          .sort((a, b) => a.timestamp - b.timestamp),
      }));

      return grouped;
    },
    enabled: sensors.length > 0,
    staleTime: 30 * 1000, // 30 seconds
    retry: false, // Don't retry on failure
  });
}
