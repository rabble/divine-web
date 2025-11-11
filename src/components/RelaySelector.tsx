// ABOUTME: Component for selecting and switching between Nostr relays
// ABOUTME: Provides a dropdown UI to change the active relay connection

import { useAppContext } from '@/hooks/useAppContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface RelaySelectorProps {
  className?: string;
}

export function RelaySelector({ className }: RelaySelectorProps) {
  const { config, updateConfig, presetRelays } = useAppContext();

  const handleRelayChange = (newRelayUrl: string) => {
    updateConfig((currentConfig) => ({
      ...currentConfig,
      relayUrl: newRelayUrl,
    }));
  };

  // Use preset relays if available, otherwise provide defaults
  const relays = presetRelays || [
    { name: 'Divine Video', url: 'wss://relay.divine.video' },
    { name: 'Nostr.Band', url: 'wss://relay.nostr.band' },
    { name: 'Damus', url: 'wss://relay.damus.io' },
    { name: 'Primal', url: 'wss://relay.primal.net' },
  ];

  return (
    <Select value={config.relayUrl} onValueChange={handleRelayChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder="Select relay" />
      </SelectTrigger>
      <SelectContent>
        {relays.map(({ name, url }) => (
          <SelectItem key={url} value={url}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
