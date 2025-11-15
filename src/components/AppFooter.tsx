import { Link } from 'react-router-dom';

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-primary/10 py-6 bg-muted/30">
      <div className="container">
        <div className="flex flex-col items-center gap-4 text-center max-w-3xl mx-auto">
          {/* Featured Authenticity Section */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
            <Link
              to="/human-created"
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <span className="text-base">⭐</span>
              Made by Humans
            </Link>
            <span className="text-muted-foreground">•</span>
            <Link
              to="/proofmode"
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              <span className="text-base">🔒</span>
              ProofMode
            </Link>
          </div>

          {/* Compact Navigation Links */}
          <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link to="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <span>•</span>
              <Link to="/faq" className="hover:text-foreground transition-colors">
                FAQ
              </Link>
              <span>•</span>
              <Link to="/authenticity" className="hover:text-foreground transition-colors">
                Our Mission
              </Link>
              <span>•</span>
              <Link to="/open-source" className="hover:text-foreground transition-colors">
                Open Source
              </Link>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-foreground transition-colors">
                EULA/T&C
              </Link>
              <span>•</span>
              <Link to="/safety" className="hover:text-foreground transition-colors">
                Safety
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;

