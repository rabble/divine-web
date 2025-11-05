import { Hash, List, Search, MoreVertical, Info, Code2, Shield, Github, Smartphone, Heart, ShieldCheck, Scale, HelpCircle, ShieldAlert } from 'lucide-react';
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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            className="text-2xl font-logo text-primary"
            onClick={() => navigate('/')}
            aria-label="Go to home"
          >
            diVine
          </button>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <>
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
                onClick={() => navigate('/lists')}
                className="flex items-center gap-2"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Lists</span>
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
            </>
          )}
          {/* More menu with info links */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">More options</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Get the App</DropdownMenuLabel>
              <DropdownMenuItem asChild>
                <a
                  href="https://testflight.apple.com/join/phQERxAb"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Smartphone className="h-4 w-4" />
                  iOS TestFlight Beta
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="https://play.google.com/apps/test/co.openvine.app/61"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Smartphone className="h-4 w-4" />
                  Android Beta
                </a>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuLabel>Information</DropdownMenuLabel>

              <DropdownMenuItem onClick={() => navigate('/about')} className="cursor-pointer">
                <Info className="mr-2 h-4 w-4" />
                About
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate('/faq')} className="cursor-pointer">
                <HelpCircle className="mr-2 h-4 w-4" />
                FAQ
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate('/authenticity')} className="cursor-pointer">
                <Heart className="mr-2 h-4 w-4" />
                Our Mission
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate('/proofmode')} className="cursor-pointer">
                <ShieldCheck className="mr-2 h-4 w-4" />
                ProofMode
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate('/open-source')} className="cursor-pointer">
                <Code2 className="mr-2 h-4 w-4" />
                Open Source
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate('/terms')} className="cursor-pointer">
                <Scale className="mr-2 h-4 w-4" />
                EULA/T&C
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate('/privacy')} className="cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                Privacy Policy
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate('/safety')} className="cursor-pointer">
                <ShieldAlert className="mr-2 h-4 w-4" />
                Safety Standards
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => navigate('/dmca')} className="cursor-pointer">
                <Scale className="mr-2 h-4 w-4" />
                Copyright & DMCA
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <a
                  href="https://github.com/rabble/nostrvine"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Github className="h-4 w-4" />
                  GitHub Repository
                </a>
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

