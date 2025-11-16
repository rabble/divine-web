import { Home, Compass, Search, User, Plus } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';
import { nip19 } from 'nostr-tools';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useCurrentUser();

  const getUserProfilePath = () => {
    if (!user?.pubkey) return '/';
    const npub = nip19.npubEncode(user.pubkey);
    return `/${npub}`;
  };

  const isActive = (path: string) => location.pathname === path;
  const isHomePage = location.pathname === '/';

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-primary/10 bg-background/95 backdrop-blur-md shadow-lg pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Home - Shows Home/Explore tabs */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full flex-1 rounded-none",
            isHomePage && "text-primary bg-primary/10"
          )}
        >
          <Home className="h-5 w-5" />
          <span className="text-xs">Home</span>
        </Button>

        {/* Explore - Redirects to home page with explore tab */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/discovery')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full flex-1 rounded-none",
            isActive('/discovery') && "text-primary bg-primary/10"
          )}
        >
          <Compass className="h-5 w-5" />
          <span className="text-xs">Discover</span>
        </Button>

        {/* Post - Only show if logged in */}
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/post')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-full flex-1 rounded-none",
              isActive('/post') && "text-primary bg-primary/10"
            )}
          >
            <Plus className="h-5 w-5" />
            <span className="text-xs">Post</span>
          </Button>
        )}

        {/* Search */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/search')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full flex-1 rounded-none",
            isActive('/search') && "text-primary bg-primary/10"
          )}
        >
          <Search className="h-5 w-5" />
          <span className="text-xs">Search</span>
        </Button>

        {/* Profile */}
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(getUserProfilePath())}
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-full flex-1 rounded-none",
              isActive(getUserProfilePath()) && "text-primary bg-primary/10"
            )}
          >
            <User className="h-5 w-5" />
            <span className="text-xs">Profile</span>
          </Button>
        )}
      </div>
    </nav>
  );
}

export default BottomNav;
