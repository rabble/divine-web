import { Hash, List, Search, Video } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { cn } from '@/lib/utils';

export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useCurrentUser();

  const navItems = [
    {
      icon: Hash,
      label: 'Hashtags',
      path: '/hashtags',
      requiresAuth: false,
    },
    {
      icon: Search,
      label: 'Search',
      path: '/search',
      requiresAuth: false,
    },
    {
      icon: Video,
      label: 'Upload',
      path: '/upload',
      requiresAuth: true,
    },
    {
      icon: List,
      label: 'Lists',
      path: '/lists',
      requiresAuth: true,
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
              variant="ghost"
              size="sm"
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 h-full flex-1 rounded-none",
                isActive && "text-primary bg-primary/10"
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
