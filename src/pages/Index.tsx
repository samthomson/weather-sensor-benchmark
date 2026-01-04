import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, ArrowRight } from 'lucide-react';
import { Header } from '@/components/Header';

const Index = () => {
  useSeoMeta({
    title: 'Weather Sensor Benchmark',
    description: 'Compare weather sensors across multiple weather stations',
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <BarChart3 className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Weather Sensor Benchmark
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Compare and analyze weather sensor performance across multiple stations in real-time
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Multi-Station Support</CardTitle>
                <CardDescription>
                  Track and compare data from multiple weather stations simultaneously
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Real-Time Data</CardTitle>
                <CardDescription>
                  Automatically fetches latest sensor readings from Nostr relays
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dual Time Ranges</CardTitle>
                <CardDescription>
                  View data from the last hour or last 24 hours with appropriate sampling
                </CardDescription>
              </CardHeader>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Outlier Detection</CardTitle>
                <CardDescription>
                  Automatically filters invalid readings that spike by more than 300%
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link to="/benchmark">
              <Button size="lg" className="gap-2">
                Start Benchmarking
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Info Section */}
          <Card className="mt-12 border-muted">
            <CardHeader>
              <CardTitle className="text-base">How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                This application queries the Nostr relay <code className="text-xs bg-muted px-1 py-0.5 rounded">wss://relay.samt.st</code> for weather station metadata and sensor readings.
              </p>
              <p>
                Create comparisons to benchmark specific sensors across different weather stations. Each comparison supports multiple sensor models with chart and table views.
              </p>
              <p>
                Supported sensor types: <code className="text-xs bg-muted px-1 py-0.5 rounded">temp</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">humidity</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">pm1</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">pm25</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">pm10</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">air_quality</code>
              </p>
            </CardContent>
          </Card>
        </div>
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

export default Index;
