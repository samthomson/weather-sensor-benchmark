import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus } from 'lucide-react';
import type { WeatherStation } from '@/hooks/useWeatherStations';

interface AddSensorDialogProps {
  stations: WeatherStation[];
  onAdd: (sensor: {
    stationPubkey: string;
    stationName: string;
    sensorType: string;
    sensorModel: string;
  }) => void;
}

export function AddSensorDialog({ stations, onAdd }: AddSensorDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [selectedSensor, setSelectedSensor] = useState<string>('');

  const station = stations.find(s => s.pubkey === selectedStation);
  const availableSensors = station?.sensors || [];

  const handleAdd = () => {
    if (!selectedStation || !selectedSensor || !station) return;

    const [sensorType, sensorModel] = selectedSensor.split('|');
    
    onAdd({
      stationPubkey: selectedStation,
      stationName: station.name,
      sensorType,
      sensorModel,
    });

    // Reset form
    setSelectedStation('');
    setSelectedSensor('');
    setOpen(false);
  };

  const isValid = selectedStation && selectedSensor;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Sensor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Sensor to Comparison</DialogTitle>
          <DialogDescription>
            Select a weather station and one of its sensors to add to this comparison.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="station">Weather Station</Label>
            <Select value={selectedStation} onValueChange={(value) => {
              setSelectedStation(value);
              setSelectedSensor(''); // Reset sensor selection when station changes
            }}>
              <SelectTrigger id="station">
                <SelectValue placeholder="Select a station" />
              </SelectTrigger>
              <SelectContent>
                {stations.map((station) => (
                  <SelectItem key={station.pubkey} value={station.pubkey}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedStation && (
            <div className="grid gap-2">
              <Label htmlFor="sensor">Sensor</Label>
              <Select value={selectedSensor} onValueChange={setSelectedSensor}>
                <SelectTrigger id="sensor">
                  <SelectValue placeholder="Select a sensor" />
                </SelectTrigger>
                <SelectContent>
                  {availableSensors.map((sensor) => {
                    const value = `${sensor.type}|${sensor.model}`;
                    const label = `${sensor.type} (${sensor.model})`;
                    return (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd} disabled={!isValid}>
            Add Sensor
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
