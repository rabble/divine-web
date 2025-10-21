# Nostrify NIP-46 Bunker Support Analysis

## Summary

**Nostrify has FULL built-in support for NIP-46 bunker URLs for remote signing.** The implementation is comprehensive and production-ready.

---

## 1. NIP-46/Bunker Support Status

### YES - Nostrify has native NIP-46 support

Evidence:
- `BunkerURI` class for parsing `bunker://` URLs
- `NConnectSigner` class implementing NIP-46 remote signer protocol
- Full integration in login flow with `NLogin.fromBunker()` method
- Already integrated in Divine Web's authentication system

---

## 2. Signer Interfaces Nostrify Accepts

Nostrify accepts any object implementing the **`NostrSigner`** interface (from NIP-07):

```typescript
interface NostrSigner {
  /** Returns a public key as hex. */
  getPublicKey(): Promise<string>;
  
  /** Takes an event template, adds `id`, `pubkey` and `sig` and returns it. */
  signEvent(event: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>): Promise<NostrEvent>;
  
  /** Returns a record of relay URLs to relay policies. */
  getRelays?(): Promise<Record<string, { read: boolean; write: boolean }>>;
  
  /** @deprecated NIP-04 crypto methods. Use `nip44` instead. */
  nip04?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
  
  /** NIP-44 crypto methods. */
  nip44?: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
}
```

---

## 3. How Current Login Works (Signer Object Flow)

### Login Type: Extension (NIP-07)

```typescript
// File: src/hooks/useLoginActions.ts (line 21-24)
async extension(): Promise<void> {
  const login = await NLogin.fromExtension();
  addLogin(login);
}
```

**Details:**
- Reads from `window.nostr` (browser extension)
- Uses `NBrowserSigner` class internally
- Returns NIP-07 compatible signer

```typescript
// File: node_modules/@nostrify/react/login/NUser.ts (line 43-48)
static fromExtensionLogin(login: NLoginExtension): NUser {
  return new NUser(
    login.type,
    login.pubkey,
    new NBrowserSigner(),  // NIP-07 browser extension wrapper
  );
}
```

### Login Type: Secret Key (nsec)

```typescript
// File: src/hooks/useLoginActions.ts (line 12-14)
nsec(nsec: string): void {
  const login = NLogin.fromNsec(nsec);
  addLogin(login);
}
```

**Details:**
- Decodes bech32 `nsec1...` format
- Uses `NSecSigner` class internally
- Event signing is synchronous, wrapped in async

```typescript
// File: node_modules/@nostrify/react/login/NUser.ts (line 17-24)
static fromNsecLogin(login: NLoginNsec): NUser {
  const sk = nip19.decode(login.data.nsec) as { type: 'nsec'; data: Uint8Array };
  return new NUser(
    login.type,
    login.pubkey,
    new NSecSigner(sk.data),  // Direct secret key signer
  );
}
```

### Login Type: Bunker (NIP-46) ✓

```typescript
// File: src/hooks/useLoginActions.ts (line 16-19)
async bunker(uri: string): Promise<void> {
  const login = await NLogin.fromBunker(uri, nostr);
  addLogin(login);
}
```

**Details:**
- Accepts `bunker://` URI format
- Uses `NConnectSigner` for NIP-46 remote signing
- Requires an NPool instance for relay communication
- Creates a client keypair to authenticate with the remote signer

```typescript
// File: node_modules/@nostrify/react/login/NUser.ts (line 27-40)
static fromBunkerLogin(login: NLoginBunker, pool: NPool): NUser {
  const clientSk = nip19.decode(login.data.clientNsec) as { 
    type: 'nsec'; 
    data: Uint8Array 
  };
  const clientSigner = new NSecSigner(clientSk.data);

  return new NUser(
    login.type,
    login.pubkey,
    new NConnectSigner({
      relay: pool.group(login.data.relays),  // Relay group for communication
      pubkey: login.pubkey,                   // Remote signer's pubkey
      signer: clientSigner,                   // Client's keypair
      timeout: 60_000,                        // 60 second timeout
    }),
  );
}
```

---

## 4. Signer Implementations in Nostrify

### A. `NBrowserSigner` (NIP-07 Extension)

```typescript
// File: node_modules/@jsr/nostrify__nostrify/_dist/NBrowserSigner.d.ts
export declare class NBrowserSigner implements NostrSigner {
  getPublicKey(): Promise<string>;
  signEvent(event: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>): Promise<NostrEvent>;
  getRelays?(): Promise<Record<string, { read: boolean; write: boolean }>>;
  get nip04(): NostrSigner['nip04'];
  get nip44(): NostrSigner['nip44'];
}
```

**Purpose:** Proxies to browser extension `window.nostr` object
**Used by:** Alby, nos2x, and other browser extensions

### B. `NSecSigner` (Secret Key)

```typescript
// File: node_modules/@jsr/nostrify__nostrify/_dist/NSecSigner.d.ts
export declare class NSecSigner implements NostrSigner {
  constructor(secretKey: Uint8Array);
  getPublicKey(): Promise<string>;
  signEvent(event: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>): Promise<NostrEvent>;
  readonly nip04: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
  readonly nip44: {
    encrypt(pubkey: string, plaintext: string): Promise<string>;
    decrypt(pubkey: string, ciphertext: string): Promise<string>;
  };
}
```

**Purpose:** Direct secret key signing with NIP-04/NIP-44 encryption

### C. `NConnectSigner` (NIP-46 Remote Signer) ✓

```typescript
// File: node_modules/@jsr/nostrify__nostrify/_dist/NConnectSigner.d.ts
export interface NConnectSignerOpts {
  relay: NRelay;                    // Relay for communication
  pubkey: string;                   // Remote signer's pubkey
  signer: NostrSigner;              // Client's local signer
  timeout?: number;                 // Request timeout (default: 60000ms)
  encryption?: 'nip04' | 'nip44';   // Encryption method (default: nip44)
}

export declare class NConnectSigner implements NostrSigner {
  getPublicKey(): Promise<string>;
  signEvent(event: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>): Promise<NostrEvent>;
  getRelays?(): Promise<Record<string, { read: boolean; write: boolean }>>;
  readonly nip04: { encrypt(...): Promise<string>; decrypt(...): Promise<string> };
  readonly nip44: { encrypt(...): Promise<string>; decrypt(...): Promise<string> };
  
  // NIP-46 specific methods:
  connect(secret?: string): Promise<string>;  // Send initial connection request
  ping(): Promise<string>;                    // Test connection
}
```

**Purpose:** NIP-46 remote signer protocol over Nostr relays
**Features:**
- Client generates its own keypair
- Establishes NIP-46 "connect" handshake
- All signing requests go through relay
- Supports optional `secret` parameter for initial auth
- Timeout management for requests

---

## 5. BunkerURI Parser

The `BunkerURI` class parses `bunker://` URLs according to NIP-46:

```typescript
// File: node_modules/@jsr/nostrify__nostrify/BunkerURI.ts
export class BunkerURI {
  pubkey: string;        // Remote signer pubkey (hostname)
  relays: string[];      // Relay URLs (query params)
  secret?: string;       // Optional secret (query param)

  constructor(uri: string) {
    const url = new URL(uri);
    const params = new URLSearchParams(url.search);
    
    const pubkey = url.hostname || url.pathname.slice(2);  // Handle hostname or path
    const relays = params.getAll('relay');
    const secret = params.get('secret') ?? undefined;
    
    // ...validation
  }
  
  toString(): string {
    // Returns: bunker://{pubkey}?relay={relay1}&relay={relay2}&secret={secret}
  }
}
```

**Format Examples:**
```
bunker://remote-signer-pubkey?relay=wss://relay1.com&relay=wss://relay2.com&secret=abc123
bunker://abc123def456?relay=wss://nostr.band
```

---

## 6. Login Flow Integration in Divine Web

### Current Implementation:

**File:** `src/components/auth/LoginDialog.tsx`

```typescript
// Lines 206-209: UI Tab for Bunker
<TabsTrigger value="bunker" className="flex items-center gap-2">
  <Cloud className="w-4 h-4" />
  <span>Bunker</span>
</TabsTrigger>

// Lines 303-335: Bunker Input Form
<TabsContent value='bunker' className='space-y-3 bg-muted'>
  <div className='space-y-2'>
    <label htmlFor='bunkerUri'>Bunker URI</label>
    <Input
      id='bunkerUri'
      value={bunkerUri}
      onChange={(e) => setBunkerUri(e.target.value)}
      placeholder='bunker://'
      autoComplete="off"
    />
    {errors.bunker && (
      <p className="text-sm text-red-500">{errors.bunker}</p>
    )}
  </div>
  
  <Button
    className='w-full rounded-full py-4'
    onClick={handleBunkerLogin}
    disabled={isLoading || !bunkerUri.trim()}
  >
    {isLoading ? 'Connecting...' : 'Login with Bunker'}
  </Button>
</TabsContent>
```

### Validation:

```typescript
// Lines 25-26: Basic format validation
const validateBunkerUri = (uri: string) => {
  return uri.startsWith('bunker://');
};

// Lines 114-141: Login handler
const handleBunkerLogin = async () => {
  if (!bunkerUri.trim()) {
    setErrors(prev => ({ ...prev, bunker: 'Please enter a bunker URI' }));
    return;
  }
  
  if (!validateBunkerUri(bunkerUri)) {
    setErrors(prev => ({ ...prev, bunker: 'Invalid bunker URI format. Must start with bunker://' }));
    return;
  }
  
  setIsLoading(true);
  setErrors(prev => ({ ...prev, bunker: undefined }));
  
  try {
    await login.bunker(bunkerUri);  // Uses useLoginActions hook
    onLogin();
    onClose();
    setBunkerUri('');
  } catch {
    setErrors(prev => ({
      ...prev,
      bunker: 'Failed to connect to bunker. Please check the URI.'
    }));
  } finally {
    setIsLoading(false);
  }
};
```

### User Retrieval:

```typescript
// File: src/hooks/useCurrentUser.ts (lines 11-22)
const loginToUser = useCallback((login: NLoginType): NUser => {
  switch (login.type) {
    case 'nsec':
      return NUser.fromNsecLogin(login);
    case 'bunker':  // ✓ NIP-46 bunker support
      return NUser.fromBunkerLogin(login, nostr);
    case 'extension':
      return NUser.fromExtensionLogin(login);
    default:
      throw new Error(`Unsupported login type: ${login.type}`);
  }
}, [nostr]);
```

---

## 7. NIP-46 Login Data Structure

When a bunker login succeeds, it's stored as:

```typescript
// File: node_modules/@nostrify/react/login/NLogin.ts (lines 12-17)
export type NLoginBunker = NLoginBase<'bunker', {
  bunkerPubkey: string;          // Remote signer's pubkey
  clientNsec: `nsec1${string}`;  // Client's generated keypair (for authentication)
  relays: string[];              // Relay URLs from bunker URI
}>;

// Base structure (lines 27-34)
interface NLoginBase<T extends string, D> {
  id: string;                    // Unique identifier
  type: T;                        // Login type ('bunker')
  pubkey: string;                // User's pubkey (from remote signer)
  createdAt: string;             // ISO timestamp
  data: D;                        // Type-specific data
}
```

**Example:**
```json
{
  "id": "bunker:abc123def456",
  "type": "bunker",
  "pubkey": "abc123def456...",
  "createdAt": "2025-10-20T12:34:56.789Z",
  "data": {
    "bunkerPubkey": "abc123def456...",
    "clientNsec": "nsec1xyz789...",
    "relays": ["wss://relay1.com", "wss://relay2.com"]
  }
}
```

---

## 8. How Encryption Works with Signers

All signer implementations support **NIP-44** encryption (NIP-04 is deprecated):

```typescript
// All NostrSigner implementations provide:
signer.nip44: {
  encrypt(pubkey: string, plaintext: string): Promise<string>;
  decrypt(pubkey: string, ciphertext: string): Promise<string>;
}

// Examples:
const user = useCurrentUser();
const encrypted = await user.signer.nip44.encrypt(user.pubkey, "hello world");
const decrypted = await user.signer.nip44.decrypt(user.pubkey, encrypted);
```

For **NConnectSigner** (bunker), encryption is specified in options:

```typescript
new NConnectSigner({
  relay: pool.group(relays),
  pubkey: remoteSignerPubkey,
  signer: clientSigner,
  timeout: 60_000,
  encryption?: 'nip04' | 'nip44';  // Default: nip44
})
```

---

## 9. Existing Bunker/Remote Signer References in Divine Web

### Currently Integrated:

1. **Login UI Tab** - Already has Bunker tab in LoginDialog
2. **Login Handler** - `useLoginActions.bunker()` method
3. **User Conversion** - `NUser.fromBunkerLogin()` in useCurrentUser
4. **Validation** - `validateBunkerUri()` function
5. **Error Handling** - Specific bunker error messages

### Example Flow:

```
User enters bunker:// URI
         ↓
validateBunkerUri() validates format
         ↓
login.bunker(uri) calls useLoginActions.bunker()
         ↓
NLogin.fromBunker(uri, nostr) parses URI and creates login
         ↓
BunkerURI class extracts: pubkey, relays, secret
         ↓
NConnectSigner connects via NPool to specified relays
         ↓
Client authenticates using clientNsec keypair
         ↓
Login stored in NostrLoginProvider context
         ↓
useCurrentUser() converts to NUser with NConnectSigner
         ↓
All events signed via NIP-46 protocol over relays
```

---

## 10. Code Examples

### Example 1: Using a Bunker Login

```typescript
import { useCurrentUser } from '@/hooks/useCurrentUser';

function MyComponent() {
  const { user, users } = useCurrentUser();
  
  if (!user) return <div>Not logged in</div>;
  
  // User object contains the signer
  // For bunker login, this is NConnectSigner
  const pubkey = await user.signer.getPublicKey();
  
  // Sign an event (works the same for all signer types)
  const event = await user.signer.signEvent({
    kind: 1,
    content: "Hello from bunker!",
    tags: [],
    created_at: Math.floor(Date.now() / 1000),
  });
  
  return <div>Logged in as {pubkey}</div>;
}
```

### Example 2: Publishing an Event with Any Signer

```typescript
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';

function PostComponent() {
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  
  if (!user) return null;
  
  // Works with extension, bunker, or nsec signer
  const handlePost = () => {
    createEvent({
      kind: 1,
      content: "Works with any signer type!",
      tags: [],
    });
  };
  
  return <button onClick={handlePost}>Post</button>;
}
```

### Example 3: Encryption with Signer

```typescript
const { user } = useCurrentUser();

// Encrypt (works with all signer types, including bunker)
const encrypted = await user.signer.nip44.encrypt(
  recipientPubkey,
  "secret message"
);

// Decrypt
const decrypted = await user.signer.nip44.decrypt(
  senderPubkey,
  encrypted
);
```

---

## Key Takeaways for Rabble

1. **✓ NIP-46 is fully supported** - Nostrify has production-ready bunker support
2. **✓ Already integrated in Divine Web** - The login UI already has a Bunker tab and handler
3. **✓ Works seamlessly** - NConnectSigner implements the NostrSigner interface, so it works everywhere NIP-07 extension signers work
4. **✓ Security-first design** - Client generates its own keypair for authentication; remote signer never has client's keys
5. **✓ Standard NIP-07 interface** - All signers (extension, nsec, bunker) implement the same interface, making code interoperable
6. **No breaking changes** - Adding bunker support requires no refactoring of existing code using signers

The infrastructure is already there - you can start accepting bunker:// URIs right now. The login system is designed to handle multiple signer types transparently.

