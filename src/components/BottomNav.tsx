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

  const navItems = [
    {
      icon: Hash,
      label: 'Hashtags',
      path: '/hashtags',
      requiresAuth: false,
      isPrimary: false,
    },
    {
      icon: Search,
      label: 'Search',
      path: '/search',
      requiresAuth: false,
      isPrimary: false,
    },
    {
      icon: Video,
      label: 'Upload',
      path: '/upload',
      requiresAuth: true,
      isPrimary: true,
    },
    {
      icon: List,
      label: 'Lists',
      path: '/lists',
      requiresAuth: true,
      isPrimary: false,
    },
    {
      icon: User,
      label: 'Profile',
      path: getUserProfilePath(),
      requiresAuth: true,
      isPrimary: false,
    },
  ];

  // Filter items based on auth status
  const visibleItems = navItems.filter(item => !item.requiresAuth || user);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-primary/10 bg-background/95 backdrop-blur-md shadow-lg">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Button
              key={item.path}
              variant={item.isPrimary ? "default" : "ghost"}
              size="sm"
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 h-full flex-1 rounded-none",
                !item.isPrimary && isActive && "text-primary bg-primary/10",
                item.isPrimary && "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{item.label}</span>
            </Button>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
