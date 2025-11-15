import { Link } from 'react-router-dom';

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-primary/10 py-12 bg-muted/30">
      <div className="container">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {/* About Divine */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-primary">
              About Divine
            </h3>
            <nav className="flex flex-col gap-2.5">
              <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                About
              </Link>
              <Link to="/faq" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                FAQ
              </Link>
              <Link to="/authenticity" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Our Mission
              </Link>
              <Link to="/open-source" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Open Source
              </Link>
            </nav>
          </div>

          {/* Authenticity */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-primary">
              Authenticity
            </h3>
            <nav className="flex flex-col gap-2.5">
              <Link to="/human-created" className="text-sm text-foreground font-semibold hover:text-primary transition-colors inline-flex items-center gap-1.5">
                <span className="text-primary">⭐</span>
                Made by Humans
              </Link>
              <Link to="/proofmode" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                ProofMode
              </Link>
            </nav>
          </div>

          {/* Legal & Safety */}
          <div className="space-y-4">
            <h3 className="text-xs font-medium uppercase tracking-wider text-primary">
              Legal & Safety
            </h3>
            <nav className="flex flex-col gap-2.5">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                EULA/T&C
              </Link>
              <Link to="/safety" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Safety
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;

