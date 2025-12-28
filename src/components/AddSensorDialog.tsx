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
    sensorModel: string;
    sensorTypes: string[];
  }) => void;
  existingSensors: Array<{ stationPubkey: string; sensorModel: string }>;
}

export function AddSensorDialog({ stations, onAdd, existingSensors }: AddSensorDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedStation, setSelectedStation] = useState<string>('');
  const [selectedSensor, setSelectedSensor] = useState<string>('');

  const station = stations.find(s => s.pubkey === selectedStation);

  // Filter out sensors that are already added
  const availableSensors = station?.sensorModels.filter(model => {
    return !existingSensors.some(
      existing => existing.stationPubkey === selectedStation && existing.sensorModel === model.model
    );
  }) || [];

  const handleAdd = () => {
    if (!selectedStation || !selectedSensor || !station) return;

    const sensorModel = station.sensorModels.find(m => m.model === selectedSensor);
    if (!sensorModel) return;

    onAdd({
      stationPubkey: selectedStation,
      stationName: station.name,
      sensorModel: selectedSensor,
      sensorTypes: sensorModel.types,
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
            Select a weather station and one of its sensor models. All sensor readings from that model will be included.
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
              <Label htmlFor="sensor">Sensor Model</Label>
              <Select value={selectedSensor} onValueChange={setSelectedSensor}>
                <SelectTrigger id="sensor">
                  <SelectValue placeholder="Select a sensor model" />
                </SelectTrigger>
                <SelectContent>
                  {availableSensors.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                      All sensors from this station have been added
                    </div>
                  ) : (
                    availableSensors.map((sensorModel) => {
                      const label = `${sensorModel.model} (${sensorModel.types.join(', ')})`;
                      return (
                        <SelectItem key={sensorModel.model} value={sensorModel.model}>
                          {label}
                        </SelectItem>
                      );
                    })
                  )}
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
