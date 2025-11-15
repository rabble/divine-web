import { Hash, List, Search, Video, User } from 'lucide-react';
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

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-primary/10 bg-background/95 backdrop-blur-md shadow-lg pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Hashtags */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/hashtags')}
          className={cn(
            "flex flex-col items-center justify-center gap-1 h-full flex-1 rounded-none",
            isActive('/hashtags') && "text-primary bg-primary/10"
          )}
        >
          <Hash className="h-5 w-5" />
          <span className="text-xs">Hashtags</span>
        </Button>

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

        {/* DISABLED: Upload - TikTok style center button
        {user && (
          <button
            onClick={() => navigate('/upload')}
            className="flex items-center justify-center bg-primary text-primary-foreground hover:bg-primary/90 rounded-full w-12 h-12 mx-2 transition-colors shadow-lg"
          >
            <Video className="h-6 w-6" />
          </button>
        )}
        */}

        {/* Lists */}
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/lists')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 h-full flex-1 rounded-none",
              isActive('/lists') && "text-primary bg-primary/10"
            )}
          >
            <List className="h-5 w-5" />
            <span className="text-xs">Lists</span>
          </Button>
        )}

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
