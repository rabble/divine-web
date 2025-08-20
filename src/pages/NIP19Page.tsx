import { nip19 } from 'nostr-tools';
import { useParams, Navigate } from 'react-router-dom';
import NotFound from './NotFound';
import ProfilePage from './ProfilePage';

export function NIP19Page() {
  const { nip19: identifier } = useParams<{ nip19: string }>();

  if (!identifier) {
    return <NotFound />;
  }

  let decoded;
  try {
    decoded = nip19.decode(identifier);
  } catch {
    return <NotFound />;
  }

  const { type, data } = decoded;

  switch (type) {
    case 'npub':
      // Navigate to the profile route with npub parameter
      return <Navigate to={`/profile/${identifier}`} replace />;
      
    case 'nprofile':
      // nprofile contains pubkey and optional relay hints
      // Redirect to the npub version for consistency
      const npub = nip19.npubEncode(data.pubkey);
      return <Navigate to={`/profile/${npub}`} replace />;

    case 'note':
      // AI agent should implement note view here
      return <div>Note placeholder</div>;

    case 'nevent':
      // AI agent should implement event view here
      return <div>Event placeholder</div>;

    case 'naddr':
      // AI agent should implement addressable event view here
      return <div>Addressable event placeholder</div>;

    default:
      return <NotFound />;
  }
} 