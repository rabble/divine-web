// ABOUTME: Badge component for certifying content is human-created, not AI-generated
// ABOUTME: Inspired by no-ai-icon.com - displays for migrated Vines and user-claimed content

import { Link } from 'react-router-dom';
import { Brain } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface NoAIBadgeProps {
  className?: string;
  tooltip?: string;
}

export function NoAIBadge({
  className,
  tooltip = 'Human-created content - Click to learn more'
}: NoAIBadgeProps) {
  return (
    <Link to="/human-created" className="inline-block">
      <Badge
        variant="outline"
        className={cn(
          'flex items-center gap-1 text-xs font-medium cursor-pointer transition-colors',
          'border-purple-600 text-purple-600 bg-purple-50 dark:bg-purple-950/20',
          'hover:bg-purple-100 dark:hover:bg-purple-900/30',
          className
        )}
        title={tooltip}
      >
        <Brain className="h-3 w-3" />
        <span>Human-Made</span>
      </Badge>
    </Link>
  );
}
