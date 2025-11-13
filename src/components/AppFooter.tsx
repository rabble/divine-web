import { Link } from 'react-router-dom';

export function AppFooter() {
  return (
    <footer className="mt-auto border-t py-8">
      <div className="container">
        <div className="flex flex-col items-center gap-6">
          {/* Navigation Links */}
          <nav className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link to="/about" className="hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/faq" className="hover:text-foreground transition-colors">
              FAQ
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
            <Link to="/terms" className="hover:text-foreground transition-colors">
              EULA/T&C
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy
            </Link>
            <Link to="/safety" className="hover:text-foreground transition-colors">
              Safety
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;

