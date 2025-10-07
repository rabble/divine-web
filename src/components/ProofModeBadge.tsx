// ABOUTME: Badge component for displaying ProofMode verification status
// ABOUTME: Shows different icons and colors based on verification level

import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProofModeLevel } from '@/types/video';

interface ProofModeBadgeProps {
  level: ProofModeLevel;
  className?: string;
}

export function ProofModeBadge({ level, className }: ProofModeBadgeProps) {
  const config = getProofModeConfig(level);

  if (!config) return null;

  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1 text-xs font-medium',
        config.className,
        className
      )}
      title={config.tooltip}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
}

function getProofModeConfig(level: ProofModeLevel) {
  switch (level) {
    case 'verified_mobile':
      return {
        icon: ShieldCheck,
        label: 'Verified',
        className: 'border-green-600 text-green-600 bg-green-50 dark:bg-green-950/20',
        tooltip: 'Full hardware attestation - captured on secure mobile device'
      };
    case 'verified_web':
      return {
        icon: Shield,
        label: 'Verified',
        className: 'border-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-950/20',
        tooltip: 'Software verification - valid signature but no hardware attestation'
      };
    case 'basic_proof':
      return {
        icon: ShieldAlert,
        label: 'Signed',
        className: 'border-yellow-600 text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20',
        tooltip: 'Basic proof - valid signature, integrity verified'
      };
    case 'unverified':
    default:
      return null;
  }
}
