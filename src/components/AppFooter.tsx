import { Link } from 'react-router-dom';
import { Smartphone } from 'lucide-react';

export function AppFooter() {
  return (
    <footer className="mt-auto border-t py-8">
      <div className="container">
        <div className="flex flex-col items-center gap-6">
          {/* iOS TestFlight */}
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
            <Smartphone className="h-4 w-4 text-primary" />
            <a
              href="https://testflight.apple.com/join/phQERxAb"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Get iOS Beta
            </a>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/human-created" className="hover:text-foreground transition-colors font-semibold">
              Made by Humans
            </Link>
            <Link to="/authenticity" className="hover:text-foreground transition-colors">
              Our Mission
            </Link>
            <Link to="/proofmode" className="hover:text-foreground transition-colors">
              ProofMode
            </Link>
            <Link to="/open-source" className="hover:text-foreground transition-colors">
              Open Source
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <a
              href="https://github.com/rabble/nostrvine"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;

