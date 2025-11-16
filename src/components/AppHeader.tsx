import { Home, Compass, Search, MoreVertical, Info, Code2, Shield, Github, Heart, ShieldCheck, Scale, HelpCircle, ShieldAlert, Users, Headphones } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LoginArea } from '@/components/auth/LoginArea';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
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
  const location = useLocation();
  const { user } = useCurrentUser();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-background/80 backdrop-blur-md shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="flex items-center gap-2 text-2xl font-logo text-primary"
            onClick={() => navigate('/')}
            aria-label="Go to home"
          >
            <img
              src="/divine_icon_transparent.png"
              alt="diVine logo"
              className="w-8 h-8"
            />
            diVine
          </button>
        </div>
        <div className="flex items-center gap-2">
          {/* Main navigation - hidden on mobile, shown in bottom nav */}
          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className={cn(
                "hidden md:flex items-center gap-2",
                isActive('/') && "bg-primary/10 text-primary"
              )}
            >
              <Home className="h-4 w-4" />
              <span className="hidden lg:inline">Home</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/discovery')}
            className={cn(
              "hidden md:flex items-center gap-2",
              isActive('/discovery') && "bg-primary/10 text-primary"
            )}
          >
            <Compass className="h-4 w-4" />
            <span className="hidden lg:inline">Discover</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/search')}
            className={cn(
              "hidden md:flex items-center gap-2",
              isActive('/search') && "bg-primary/10 text-primary"
            )}
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Search</span>
          </Button>
          {/* More menu with info links */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
              >
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {/* About diVine Section */}
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">About diVine</DropdownMenuLabel>

              <DropdownMenuItem
                onClick={() => navigate('/about')}
                className="cursor-pointer hover:!bg-transparent hover:outline hover:outline-1 hover:outline-primary/30 focus:!bg-transparent focus:outline focus:outline-1 focus:outline-primary"
              >
                <Info className="mr-2 h-4 w-4" />
                <span>About</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/authenticity')}
                className="cursor-pointer hover:!bg-transparent hover:outline hover:outline-1 hover:outline-primary/30 focus:!bg-transparent focus:outline focus:outline-1 focus:outline-primary"
              >
                <Heart className="mr-2 h-4 w-4" />
                <span>Our Mission</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/faq')}
                className="cursor-pointer hover:!bg-transparent hover:outline hover:outline-1 hover:outline-primary/30 focus:!bg-transparent focus:outline focus:outline-1 focus:outline-primary"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                <span>FAQ</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/support')}
                className="cursor-pointer hover:!bg-transparent hover:outline hover:outline-1 hover:outline-primary/30 focus:!bg-transparent focus:outline focus:outline-1 focus:outline-primary"
              >
                <Headphones className="mr-2 h-4 w-4" />
                <span>Support</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Trust & Safety Section */}
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Trust & Safety</DropdownMenuLabel>

              {user && (
                <DropdownMenuItem
                  onClick={() => navigate('/settings/moderation')}
                  className="cursor-pointer hover:!bg-transparent hover:outline hover:outline-1 hover:outline-primary/30 focus:!bg-transparent focus:outline focus:outline-1 focus:outline-primary"
                >
                  <ShieldAlert className="mr-2 h-4 w-4" />
                  <span>Moderation Settings</span>
                </DropdownMenuItem>
              )}

              <DropdownMenuItem
                onClick={() => navigate('/proofmode')}
                className="cursor-pointer hover:!bg-transparent hover:outline hover:outline-1 hover:outline-primary/30 focus:!bg-transparent focus:outline focus:outline-1 focus:outline-primary"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                <span>ProofMode</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/human-created')}
                className="cursor-pointer hover:!bg-transparent hover:outline hover:outline-1 hover:outline-primary/30 focus:!bg-transparent focus:outline focus:outline-1 focus:outline-primary"
              >
                <Users className="mr-2 h-4 w-4" />
                <span>Made by Humans</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/safety')}
                className="cursor-pointer hover:!bg-transparent hover:outline hover:outline-1 hover:outline-primary/30 focus:!bg-transparent focus:outline focus:outline-1 focus:outline-primary"
              >
                <ShieldAlert className="mr-2 h-4 w-4" />
                <span>Safety Standards</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              {/* Technical Section */}
              <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">Technical</DropdownMenuLabel>

              <DropdownMenuItem
                onClick={() => navigate('/open-source')}
                className="cursor-pointer hover:!bg-transparent hover:outline hover:outline-1 hover:outline-primary/30 focus:!bg-transparent focus:outline focus:outline-1 focus:outline-primary"
              >
                <Code2 className="mr-2 h-4 w-4" />
                <span>Open Source</span>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <a
                  href="https://github.com/rabble/nostrvine"
                  rel="noopener noreferrer"
                  className="flex items-center cursor-pointer hover:!bg-transparent hover:outline hover:outline-1 hover:outline-primary/30 focus:!bg-transparent focus:outline focus:outline-1 focus:outline-primary"
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
                className="cursor-pointer hover:!bg-transparent hover:outline hover:outline-1 hover:outline-primary/30 focus:!bg-transparent focus:outline focus:outline-1 focus:outline-primary"
              >
                <Scale className="mr-2 h-4 w-4" />
                <span>Terms & Conditions</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/privacy')}
                className="cursor-pointer hover:!bg-transparent hover:outline hover:outline-1 hover:outline-primary/30 focus:!bg-transparent focus:outline focus:outline-1 focus:outline-primary"
              >
                <Shield className="mr-2 h-4 w-4" />
                <span>Privacy Policy</span>
              </DropdownMenuItem>

              <DropdownMenuItem
                onClick={() => navigate('/dmca')}
                className="cursor-pointer hover:!bg-transparent hover:outline hover:outline-1 hover:outline-primary/30 focus:!bg-transparent focus:outline focus:outline-1 focus:outline-primary"
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

