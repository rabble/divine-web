import { Link } from 'react-router-dom';
import { MailerLiteSignupFooter } from './MailerLiteSignupFooter';

export function AppFooter() {
  return (
    <footer className="mt-auto border-t border-primary/10 py-6 pb-[calc(1.5rem+4rem+env(safe-area-inset-bottom))] md:pb-6 bg-muted/30">
      <div className="container">
        <div className="max-w-5xl mx-auto">
          {/* Main Footer Content - Side by side on desktop */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
            {/* Left side - Email signup */}
            <div className="flex flex-col gap-4 lg:max-w-md">
              <div className="text-sm font-medium">Stay Updated</div>
              <MailerLiteSignupFooter />
            </div>

            {/* Right side - Navigation Links */}
            <div className="flex flex-col gap-3 text-xs text-muted-foreground lg:text-right">
              {/* Featured Links */}
              <div className="flex flex-wrap items-center lg:justify-end gap-3 text-sm">
                <Link
                  to="/human-created"
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Made by Humans
                </Link>
                <span className="text-muted-foreground">•</span>
                <Link
                  to="/proofmode"
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  ProofMode
                </Link>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-wrap items-center lg:justify-end gap-2">
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
              <div className="flex flex-wrap items-center lg:justify-end gap-2">
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
                <span>•</span>
                <Link to="/support" className="hover:text-foreground transition-colors">
                  Support
                </Link>
                <span>•</span>
                <Link to="/media-resources" className="hover:text-foreground transition-colors">
                  Press
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;

