import { Hash, List, Search, MoreVertical, Info, Code2, Shield, Github, Heart, ShieldCheck, Scale, HelpCircle, ShieldAlert, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function AppHeader() {
  const navigate = useNavigate();
  const { user } = useCurrentUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background/80 backdrop-blur-md shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="text-2xl font-logo text-primary"
            onClick={() => navigate('/discovery')}
            aria-label="Go to discovery"
          >
            Divine
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Public navigation - available to all users */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/hashtags')}
            className="flex items-center gap-2"
          >
            <Hash className="h-4 w-4" />
            <span className="hidden sm:inline">Hashtags</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/search')}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Search</span>
          </Button>

          {/* Protected navigation - requires login */}
          {user && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/lists')}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Lists</span>
              </Button>
            </>
          )}
          {/* More menu with info links */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="data-[state=open]:!bg-primary/10 data-[state=open]:!text-primary hover:!bg-primary/10 hover:!text-primary"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* About Divine Section */}
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">About Divine</DropdownMenuLabel>

              <DropdownMenuItem
                onClick={() => navigate('/about')}
                className="cursor-pointer hover:!bg-primary/5 focus:!bg-primary/10 focus:!text-primary"
              >
                <Info className="mr-2 h-4 w-4" />
                <span>About</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/authenticity')}
                className="cursor-pointer hover:!bg-primary/5 focus:!bg-primary/10 focus:!text-primary"
              >
                <Heart className="mr-2 h-4 w-4" />
                <span>Our Mission</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/faq')}
                className="cursor-pointer hover:!bg-primary/5 focus:!bg-primary/10 focus:!text-primary"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>FAQ</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Trust & Safety Section */}
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Trust & Safety</DropdownMenuLabel>

              <DropdownMenuItem
                onClick={() => navigate('/proofmode')}
                className="cursor-pointer hover:!bg-primary/5 focus:!bg-primary/10 focus:!text-primary"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>ProofMode</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/human-created')}
                className="cursor-pointer hover:!bg-primary/5 focus:!bg-primary/10 focus:!text-primary"
              >
                <Users className="mr-2 h-4 w-4" />
                <span>Made by Humans</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/safety')}
                className="cursor-pointer hover:!bg-primary/5 focus:!bg-primary/10 focus:!text-primary"
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                <span>Safety Standards</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Technical Section */}
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Technical</DropdownMenuLabel>

              <DropdownMenuItem
                onClick={() => navigate('/open-source')}
                className="cursor-pointer hover:!bg-primary/5 focus:!bg-primary/10 focus:!text-primary"
              >
                <Code2 className="mr-2 h-4 w-4" />
                <span>Open Source</span>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <a
                  href="https://github.com/rabble/nostrvine"
                  rel="noopener noreferrer"
                  className="flex items-center cursor-pointer hover:!bg-primary/5 focus:!bg-primary/10 focus:!text-primary"
                >
                  <Github className="mr-2 h-4 w-4" />
                  <span>GitHub Repository</span>
                  <svg
                    className="ml-auto h-3 w-3 opacity-50"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Legal Section */}
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Legal</DropdownMenuLabel>

              <DropdownMenuItem
                onClick={() => navigate('/terms')}
                className="cursor-pointer hover:!bg-primary/5 focus:!bg-primary/10 focus:!text-primary"
              >
                <Scale className="mr-2 h-4 w-4" />
                <span>Terms & Conditions</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/privacy')}
                className="cursor-pointer hover:!bg-primary/5 focus:!bg-primary/10 focus:!text-primary"
              >
                <Shield className="mr-2 h-4 w-4" />
                <span>Privacy Policy</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/dmca')}
                className="cursor-pointer hover:!bg-primary/5 focus:!bg-primary/10 focus:!text-primary"
              >
                <Scale className="mr-2 h-4 w-4" />
                <span>Copyright & DMCA</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <LoginArea className="max-w-60" />
        </div>
      </div>
    </header>
  );
}

export default AppHeader;

