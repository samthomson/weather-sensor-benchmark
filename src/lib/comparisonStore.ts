/**
 * Comparison storage and management
 */

export interface SensorSelection {
  id: string; // unique ID for this selection
  stationPubkey: string;
  stationName: string;
  sensorType: string;
  sensorModel: string;
}

export interface Comparison {
  id: string;
  name: string;
  sensors: SensorSelection[];
  createdAt: number;
}

const STORAGE_KEY = 'weather-comparisons';

/**
 * Load comparisons from localStorage
 */
export function loadComparisons(): Comparison[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

/**
 * Save comparisons to localStorage
 */
export function saveComparisons(comparisons: Comparison[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisons));
}

/**
 * Add a new comparison
 */
export function addComparison(name: string): Comparison {
  const comparisons = loadComparisons();
  const newComparison: Comparison = {
    id: crypto.randomUUID(),
    name,
    sensors: [],
    createdAt: Date.now(),
  };
  comparisons.push(newComparison);
  saveComparisons(comparisons);
  return newComparison;
}

/**
 * Update a comparison
 */
export function updateComparison(id: string, updates: Partial<Comparison>): void {
  const comparisons = loadComparisons();
  const index = comparisons.findIndex(c => c.id === id);
  if (index !== -1) {
    comparisons[index] = { ...comparisons[index], ...updates };
    saveComparisons(comparisons);
  }
}

/**
 * Delete a comparison
 */
export function deleteComparison(id: string): void {
  const comparisons = loadComparisons();
  const filtered = comparisons.filter(c => c.id !== id);
  saveComparisons(filtered);
}

/**
 * Add a sensor to a comparison
 */
export function addSensorToComparison(
  comparisonId: string,
  sensor: Omit<SensorSelection, 'id'>
): void {
  const comparisons = loadComparisons();
  const comparison = comparisons.find(c => c.id === comparisonId);
  if (comparison) {
    const newSensor: SensorSelection = {
      ...sensor,
      id: crypto.randomUUID(),
    };
    comparison.sensors.push(newSensor);
    saveComparisons(comparisons);
  }
}

/**
 * Remove a sensor from a comparison
 */
export function removeSensorFromComparison(comparisonId: string, sensorId: string): void {
  const comparisons = loadComparisons();
  const comparison = comparisons.find(c => c.id === comparisonId);
  if (comparison) {
    comparison.sensors = comparison.sensors.filter(s => s.id !== sensorId);
    saveComparisons(comparisons);
  }
}
