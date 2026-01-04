import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <BarChart3 className="h-6 w-6" />
            <div>
              <h1 className="text-2xl font-bold">
                Weather Sensor Benchmark
              </h1>
              <p className="text-sm text-muted-foreground">
                Compare sensors across multiple weather stations
              </p>
            </div>
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              to="/benchmark" 
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Benchmark
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
