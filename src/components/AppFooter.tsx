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
              <div className="text-sm font-medium text-foreground">Stay Updated</div>
              <MailerLiteSignupFooter />
            </div>

            {/* Right side - Navigation Links */}
            <div className="flex flex-col gap-3 text-xs text-muted-foreground">
              {/* Featured Links */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <Link
                  to="/human-created"
                  className="font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Made with Love
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
              <div className="flex flex-wrap items-center gap-2">
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
                <Link to="/news" className="hover:text-foreground transition-colors">
                  News
                </Link>
                <span>•</span>
                <Link to="/media-resources" className="hover:text-foreground transition-colors">
                  Media Resources
                </Link>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link to="/support" className="hover:text-foreground transition-colors">
                  Help
                </Link>
                <span>•</span>
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
                <Link to="/open-source" className="hover:text-foreground transition-colors">
                  Open Source
                </Link>
                <span>•</span>
                <a
                  href="https://opencollective.com/aos-collective/contribute/divine-keepers-95646"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground transition-colors"
                >
                  Donate
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;

