// ABOUTME: Badge for original user-created content (non-repost, non-Vine)
// ABOUTME: Matches Flutter app's OriginalContentBadge styling and behavior

import { CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface OriginalContentBadgeProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export function OriginalContentBadge({ className, size = 'small' }: OriginalContentBadgeProps) {
  const sizeConfig = getSizeConfig(size);

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1 font-medium border-cyan-600 text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20',
        sizeConfig.className,
        className
      )}
      title="Original content created by this user"
    >
      <CheckCircle className={sizeConfig.iconSize} />
      <span>Original</span>
    </Badge>
  );
}

function getSizeConfig(size: 'small' | 'medium' | 'large') {
  switch (size) {
    case 'small':
      return {
        className: 'text-[10px] px-1.5 py-0.5',
        iconSize: 'h-2.5 w-2.5',
      };
    case 'medium':
      return {
        className: 'text-[11px] px-2 py-1',
        iconSize: 'h-3 w-3',
      };
    case 'large':
      return {
        className: 'text-xs px-2.5 py-1.5',
        iconSize: 'h-3.5 w-3.5',
      };
  }
}
