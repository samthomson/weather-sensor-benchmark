import { useState } from 'react';
import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Zap, BarChart3, Database } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Header } from '@/components/Header';
import { useWeatherStations } from '@/hooks/useWeatherStations';
import { useComparisons } from '@/hooks/useComparisons';
import { ComparisonView } from '@/components/ComparisonView';

const Benchmark = () => {
  useSeoMeta({
    title: 'Benchmark - Weather Stations',
    description: 'Compare weather sensors across multiple weather stations',
  });

  const [newComparisonName, setNewComparisonName] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: stations, isLoading: stationsLoading } = useWeatherStations();
  const { comparisons, create, addSensor, removeSensor, remove } = useComparisons();

  const handleCreateComparison = () => {
    if (!newComparisonName.trim()) return;
    create(newComparisonName.trim());
    setNewComparisonName('');
    setDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="h-4 w-4" />
                Weather Stations
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stationsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-semibold">{stations?.length || 0}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Zap className="h-4 w-4" />
                Total Sensors
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stationsLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-semibold">
                  {stations?.reduce((sum, s) => sum + (s.sensorModels?.length || 0), 0) || 0}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="h-4 w-4" />
                Active Comparisons
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-semibold">{comparisons.length}</p>
            </CardContent>
          </Card>
        </div>

        {/* Comparisons Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Sensor Comparisons</h2>
              <p className="text-muted-foreground">
                Create comparisons to benchmark sensors across different weather stations
              </p>
            </div>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Comparison
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Comparison</DialogTitle>
                  <DialogDescription>
                    Give your comparison a descriptive name to identify it later.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Comparison Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Temperature Sensors Comparison"
                      value={newComparisonName}
                      onChange={(e) => setNewComparisonName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleCreateComparison();
                        }
                      }}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateComparison} disabled={!newComparisonName.trim()}>
                    Create Comparison
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Loading State */}
          {stationsLoading && (
            <div className="space-y-4">
              <Skeleton className="h-[400px] w-full" />
              <Skeleton className="h-[400px] w-full" />
            </div>
          )}

          {/* Empty State */}
          {!stationsLoading && comparisons.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="py-16 px-8 text-center">
                <div className="max-w-md mx-auto space-y-4">
                  <h3 className="text-xl font-semibold">No Comparisons Yet</h3>
                  <p className="text-muted-foreground">
                    Create your first comparison to start benchmarking weather sensors across different stations.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Comparisons List */}
          {!stationsLoading && comparisons.length > 0 && (
            <div className="space-y-6">
              {comparisons.map((comparison) => (
                <ComparisonView
                  key={comparison.id}
                  comparison={comparison}
                  stations={stations || []}
                  onAddSensor={(sensor) => addSensor(comparison.id, sensor)}
                  onRemoveSensor={(sensorId) => removeSensor(comparison.id, sensorId)}
                  onUpdateName={(newName) => update(comparison.id, { name: newName })}
                  onDelete={() => remove(comparison.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* No Stations Warning */}
        {!stationsLoading && stations && stations.length === 0 && (
          <Card className="border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 mt-6">
            <CardContent className="py-8 px-8 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
                  No Weather Stations Found
                </h3>
                <p className="text-amber-800 dark:text-amber-200">
                  No weather stations are currently publishing data to the relay. Make sure your weather stations are online and publishing to wss://relay.samt.st
                </p>
              </div>
            </CardContent>
          </Card>
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

export default Benchmark;
