import { useSeoMeta } from '@unhead/react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';

const Index = () => {
  useSeoMeta({
    title: 'Weather Stations',
    description: 'Weather station monitoring and sensor benchmarking',
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto space-y-4">
          <h2 className="text-3xl font-bold text-center mb-8">Weather Stations</h2>

          <Link to="/stations">
            <div className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <h3 className="font-semibold">Stations</h3>
              <p className="text-sm text-muted-foreground">View all weather stations and sensors</p>
            </div>
          </Link>

          <Link to="/benchmark">
            <div className="p-4 border rounded-lg hover:bg-accent transition-colors cursor-pointer">
              <h3 className="font-semibold">Benchmark</h3>
              <p className="text-sm text-muted-foreground">Compare sensor performance across stations</p>
            </div>
          </Link>
        </div>
      </main>

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

