import { useState, useEffect, useCallback } from 'react';
import {
  loadComparisons,
  addComparison,
  updateComparison,
  deleteComparison,
  addSensorToComparison,
  removeSensorFromComparison,
  type Comparison,
  type SensorSelection,
} from '@/lib/comparisonStore';

/**
 * Hook to manage comparisons with React state
 */
export function useComparisons() {
  const [comparisons, setComparisons] = useState<Comparison[]>([]);

  // Load comparisons on mount
  useEffect(() => {
    setComparisons(loadComparisons());
  }, []);

  // Refresh comparisons from storage
  const refresh = useCallback(() => {
    setComparisons(loadComparisons());
  }, []);

  // Create a new comparison
  const create = useCallback((name: string) => {
    const newComparison = addComparison(name);
    refresh();
    return newComparison;
  }, [refresh]);

  // Update a comparison
  const update = useCallback((id: string, updates: Partial<Comparison>) => {
    updateComparison(id, updates);
    refresh();
  }, [refresh]);

  // Delete a comparison
  const remove = useCallback((id: string) => {
    deleteComparison(id);
    refresh();
  }, [refresh]);

  // Add sensor to comparison
  const addSensor = useCallback((
    comparisonId: string,
    sensor: Omit<SensorSelection, 'id'>
  ) => {
    addSensorToComparison(comparisonId, sensor);
    refresh();
  }, [refresh]);

  // Remove sensor from comparison
  const removeSensor = useCallback((comparisonId: string, sensorId: string) => {
    removeSensorFromComparison(comparisonId, sensorId);
    refresh();
  }, [refresh]);

  return {
    comparisons,
    create,
    update,
    remove,
    addSensor,
    removeSensor,
    refresh,
  };
}
