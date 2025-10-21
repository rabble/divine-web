# Keycast Identity Server Integration Guide

**Version:** 1.0
**Last Updated:** 2025-10-17

## Table of Contents

1. [Overview](#overview)
2. [Authentication Flows](#authentication-flows)
3. [Personal Authentication (First-Party Apps)](#personal-authentication-first-party-apps)
4. [OAuth Authentication (Third-Party Apps)](#oauth-authentication-third-party-apps)
5. [API Reference](#api-reference)
6. [Environment Configuration](#environment-configuration)
7. [Security Model](#security-model)
8. [Integration Examples](#integration-examples)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Overview

Keycast provides a custodial Nostr identity and remote signing service, making it easy for users to get started with Nostr without managing their own keys. The identity server offers two authentication approaches:

- **Personal Authentication**: Simple email/password auth with JWT tokens (ideal for first-party apps)
- **OAuth 2.0 Flow**: Industry-standard OAuth with per-application authorization (ideal for third-party apps)

Both flows provide **NIP-46 bunker URLs** for remote signing, keeping private keys secure on the server while allowing clients to request signatures via Nostr relays.

### Key Features

- **Custodial Key Management**: Users get Nostr keys managed by Keycast
- **Remote Signing (NIP-46)**: Sign events without exposing private keys
- **JWT-based Sessions**: Secure 24-hour sessions with automatic login after registration
- **Per-App Authorization**: OAuth flow provides granular per-application access control
- **Email Verification**: Optional email verification flow (emails sent if configured)
- **Password Reset**: Secure password reset flow with time-limited tokens
- **Session Management**: List, monitor, and revoke active bunker sessions
- **Profile Management**: Username management for NIP-05 identifiers
- **Encryption**: All private keys encrypted with GCP KMS or file-based encryption
- **Multi-Tenancy**: Domain-based tenant isolation for running at multiple domains

---

## Authentication Flows

### Which Flow Should I Use?

| Use Case | Flow | Pros | Cons |
|----------|------|------|------|
| **Your own app/client** | Personal Auth | Simpler implementation, fewer steps, single bunker URL | No per-app revocation |
| **Third-party apps** | OAuth | Per-app authorization, user can revoke per app, more secure | More complex, additional steps |
| **nostr-login integration** | OAuth (nostrconnect) | Standard NIP-46 discovery, works with existing nostr-login | Requires popup handling |

---

## Personal Authentication (First-Party Apps)

### Flow Overview

```
┌──────────┐                           ┌──────────┐
│  Client  │                           │  Keycast │
└────┬─────┘                           └────┬─────┘
     │                                      │
     │ 1. POST /api/auth/register          │
     │   { email, password }                │
     │ ─────────────────────────────────────>
     │                                      │
     │ 2. { token, pubkey, user_id }        │
     │ <─────────────────────────────────────
     │                                      │
     │ 3. GET /api/user/bunker              │
     │   Header: Authorization: Bearer {token}
     │ ─────────────────────────────────────>
     │                                      │
     │ 4. { bunker_url }                    │
     │ <─────────────────────────────────────
     │                                      │
     │ 5. Use bunker URL for NIP-46         │
     │    remote signing                    │
     │                                      │
```

### Quick Start

#### 1. Register a New User

```javascript
const API_URL = 'https://oauth.divine.video';

async function register(email, password) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Registration failed');
  }

  // Store token for future requests
  localStorage.setItem('keycast_token', data.token);
  localStorage.setItem('keycast_pubkey', data.pubkey);

  return data; // { token, pubkey, user_id, email }
}
```

#### 2. Login Existing User

```javascript
async function login(email, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Login failed');
  }

  localStorage.setItem('keycast_token', data.token);
  localStorage.setItem('keycast_pubkey', data.pubkey);

  return data; // { token, pubkey }
}
```

#### 3. Get Bunker URL

```javascript
async function getBunkerUrl() {
  const token = localStorage.getItem('keycast_token');

  const response = await fetch(`${API_URL}/api/user/bunker`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get bunker URL');
  }

  return data.bunker_url; // "bunker://pubkey?relay=wss://relay.damus.io&secret=xyz..."
}
```

#### 4. Use Bunker URL for Remote Signing

See [NIP-46 Integration Examples](#nip-46-remote-signing) below.

---

## OAuth Authentication (Third-Party Apps)

### Flow Overview

```
┌──────────┐                           ┌──────────┐
│  Client  │                           │  Keycast │
└────┬─────┘                           └────┬─────┘
     │                                      │
     │ 1. POST /api/auth/register or /login │
     │   { email, password }                │
     │ ─────────────────────────────────────>
     │                                      │
     │ 2. { token, pubkey }                 │
     │ <─────────────────────────────────────
     │                                      │
     │ 3. POST /api/oauth/authorize         │
     │   Header: Authorization: Bearer {token}
     │   { client_id, redirect_uri, approved: true }
     │ ─────────────────────────────────────>
     │                                      │
     │ 4. { code, redirect_uri }            │
     │ <─────────────────────────────────────
     │                                      │
     │ 5. POST /api/oauth/token             │
     │   { code, client_id, redirect_uri }  │
     │ ─────────────────────────────────────>
     │                                      │
     │ 6. { bunker_url }                    │
     │ <─────────────────────────────────────
     │                                      │
     │ 7. Use bunker URL for NIP-46         │
     │    remote signing                    │
     │                                      │
```

### Quick Start

#### 1. Register or Login (Same as Personal Auth)

```javascript
// Use register() or login() from Personal Auth section
const { token, pubkey } = await register(email, password);
```

#### 2. Request OAuth Authorization

```javascript
async function authorizeOAuth(token, clientId, redirectUri) {
  const response = await fetch(`${API_URL}/api/oauth/authorize`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Use JWT token here
    },
    body: JSON.stringify({
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: 'sign_event',
      approved: true
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Authorization failed');
  }

  return data.code; // Authorization code
}
```

#### 3. Exchange Code for Bunker URL

```javascript
async function exchangeCodeForBunker(code, clientId, redirectUri) {
  const response = await fetch(`${API_URL}/api/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      client_id: clientId,
      redirect_uri: redirectUri
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Token exchange failed');
  }

  return data.bunker_url; // "bunker://pubkey?relay=wss://relay.damus.io&secret=xyz..."
}
```

#### Complete OAuth Flow

```javascript
async function completeOAuthFlow(email, password, clientId, redirectUri) {
  // Step 1: Register or login
  const { token } = await register(email, password);

  // Step 2: Get OAuth authorization
  const code = await authorizeOAuth(token, clientId, redirectUri);

  // Step 3: Exchange code for bunker URL
  const bunkerUrl = await exchangeCodeForBunker(code, clientId, redirectUri);

  return bunkerUrl;
}
```

### nostr-login Integration

Keycast supports the standard `nostrconnect://` URI scheme used by nostr-login:

```javascript
// When user clicks "Login with Keycast" via nostr-login
// The nostrconnect:// URI is handled automatically:
// nostrconnect://CLIENT_PUBKEY?relay=RELAY&secret=SECRET&name=APP_NAME

// Keycast shows an authorization page, user approves, and the
// client receives the bunker connection via NIP-46
```

**Endpoint:** `GET /api/oauth/connect/{nostrconnect_uri}`
**Example:** `GET /api/oauth/connect/nostrconnect://abc123...?relay=wss://relay.damus.io&secret=xyz...`

---

## API Reference

### Personal Authentication Endpoints

#### `POST /api/auth/register`

Register a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "user_id": "abc123...",
  "email": "user@example.com",
  "pubkey": "a1b2c3d4e5f6...",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Notes:**
- Password must be at least 8 characters
- Email verification sent if email service configured (optional)
- Returns JWT token for immediate use (24-hour expiration)
- Creates personal Nostr keypair encrypted with KMS
- Automatically creates OAuth authorization for `keycast-login` client

---

#### `POST /api/auth/login`

Login with existing credentials.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "pubkey": "a1b2c3d4e5f6..."
}
```

**Error (401 Unauthorized):**
```json
{
  "error": "Invalid email or password. Please check your credentials and try again."
}
```

---

#### `GET /api/user/bunker`

Get NIP-46 bunker URL for authenticated user.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "bunker_url": "bunker://a1b2c3d4e5f6...?relay=wss://relay.damus.io&secret=xyz123..."
}
```

**Error (401 Unauthorized):**
```json
{
  "error": "Authentication required. Please provide a valid token."
}
```

---

#### `POST /api/auth/verify-email`

Verify email address with token from verification email.

**Request:**
```json
{
  "token": "verification_token_from_email"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Email verified successfully! You can now use all features."
}
```

---

#### `POST /api/auth/forgot-password`

Request password reset email.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "If an account exists with that email, a password reset link has been sent."
}
```

**Notes:**
- Always returns success for security (doesn't reveal if email exists)
- Reset token expires in 1 hour

---

#### `POST /api/auth/reset-password`

Reset password using token from reset email.

**Request:**
```json
{
  "token": "reset_token_from_email",
  "new_password": "newSecurePassword123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Password reset successfully! You can now log in with your new password."
}
```

---

### OAuth Endpoints

#### `POST /api/oauth/authorize`

User approves or denies OAuth authorization for an application.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "client_id": "my-nostr-app",
  "redirect_uri": "https://myapp.com/callback",
  "scope": "sign_event",
  "approved": true
}
```

**Response (200 OK):**
```json
{
  "code": "authorization_code_here",
  "redirect_uri": "https://myapp.com/callback"
}
```

**Notes:**
- Authorization code expires in 10 minutes
- Code is single-use only
- If `approved: false`, returns error redirect

---

#### `POST /api/oauth/token`

Exchange authorization code for bunker URL.

**Request:**
```json
{
  "code": "authorization_code_from_approve",
  "client_id": "my-nostr-app",
  "redirect_uri": "https://myapp.com/callback"
}
```

**Response (200 OK):**
```json
{
  "bunker_url": "bunker://a1b2c3d4e5f6...?relay=wss://relay.damus.io&secret=xyz123..."
}
```

**Error (401 Unauthorized):**
```json
{
  "error": "Service temporarily unavailable. Please try again in a few minutes."
}
```

**Notes:**
- Code is deleted after successful exchange (single-use)
- `redirect_uri` must match exactly
- Creates new OAuth authorization with unique connection secret per app

---

### Session Management Endpoints

#### `GET /api/user/sessions`

List all active bunker sessions for authenticated user.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "sessions": [
    {
      "application_name": "My Nostr App",
      "application_id": 123,
      "bunker_pubkey": "abc123...",
      "secret": "xyz789...",
      "client_pubkey": "def456...",
      "created_at": "2025-01-15T10:30:00Z",
      "last_activity": "2025-01-15T12:45:00Z",
      "activity_count": 42
    }
  ]
}
```

---

#### `GET /api/user/sessions/{secret}/activity`

Get activity log for a specific bunker session.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "activities": [
    {
      "event_kind": 1,
      "event_content": "Hello Nostr!",
      "event_id": "abc123...",
      "created_at": "2025-01-15T12:45:00Z"
    }
  ]
}
```

---

#### `POST /api/user/sessions/revoke`

Revoke a bunker session.

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "secret": "connection_secret_to_revoke"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Session revoked successfully"
}
```

---

### Profile Management Endpoints

#### `GET /api/user/profile`

Get user profile (currently only returns username for NIP-05).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Response (200 OK):**
```json
{
  "username": "alice"
}
```

**Notes:**
- Only username is stored server-side for NIP-05
- Client should fetch full profile (kind 0) from Nostr relays via bunker

---

#### `PUT /api/user/profile`

Update username (for NIP-05 identifier).

**Headers:**
```
Authorization: Bearer {jwt_token}
```

**Request:**
```json
{
  "username": "alice"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Username saved. Client should publish kind 0 event to relays via bunker."
}
```

**Notes:**
- Username must be alphanumeric with dashes/underscores only
- Username must be unique within tenant
- Client should publish full profile to Nostr relays

---

## Environment Configuration

### Required Environment Variables

```bash
# JWT Authentication (REQUIRED)
JWT_SECRET=your-secure-random-secret-here

# Database (defaults to ./database/keycast.db)
DATABASE_PATH=./database/keycast.db

# Encryption (choose one)
# Option 1: File-based encryption (development)
MASTER_KEY_PATH=/path/to/master.key

# Option 2: Google Cloud KMS (production)
USE_GCP_KMS=true
GCP_PROJECT_ID=your-gcp-project-id
GCP_KMS_LOCATION=global
GCP_KMS_KEY_RING=keycast-keys
GCP_KMS_KEY_NAME=master-key

# Server Configuration
PORT=3000
NODE_ENV=production  # or development
RUST_ENV=production  # or development

# Email Service (optional - for email verification and password reset)
SENDGRID_API_KEY=your-sendgrid-api-key
FROM_EMAIL=noreply@yourdomain.com
FROM_NAME=Keycast
BASE_URL=https://yourdomain.com
```

### Security Recommendations

1. **JWT_SECRET**:
   - Generate with: `openssl rand -base64 32`
   - Store in Google Secret Manager (production)
   - Never commit to source control

2. **Encryption Keys**:
   - **Development**: Use file-based encryption with master.key
   - **Production**: Use Google Cloud KMS for encryption at rest

3. **CORS**:
   - API currently allows all origins for embeddable auth
   - Consider restricting in production to known domains

4. **Rate Limiting**:
   - Consider implementing rate limiting on auth endpoints
   - Protect against brute force attacks

---

## Security Model

### Key Storage and Encryption

- **User Private Keys**: Encrypted at rest with GCP KMS or file-based encryption
- **Encryption Algorithm**: AES-256-GCM via GCP Cloud KMS
- **Key Rotation**: Supported via GCP KMS key versions
- **Bunker Secrets**: Unique per OAuth authorization, 48-64 character alphanumeric

### Authentication Security

- **Password Hashing**: bcrypt with DEFAULT_COST (currently 12)
- **JWT Expiration**: 24 hours
- **Authorization Codes**: 10-minute expiration, single-use
- **Email Verification Tokens**: 24-hour expiration
- **Password Reset Tokens**: 1-hour expiration

### Transport Security

- **HTTPS Required**: All production deployments must use HTTPS
- **Secure Cookies**: Use secure, httpOnly cookies for JWT tokens in production
- **CORS**: Currently allows all origins; restrict in production

### Per-Application Security (OAuth)

- **Authorization Isolation**: Each OAuth app gets unique bunker URL
- **Revocation**: Users can revoke per-app access
- **Activity Tracking**: All signing activity logged per session

### Threat Model

**What Keycast Protects Against:**
- ✅ Client-side key theft (keys never leave server)
- ✅ Man-in-the-middle attacks (via HTTPS + NIP-46 encryption)
- ✅ Unauthorized app access (OAuth authorization flow)
- ✅ Password attacks (bcrypt hashing)

**What Keycast Does NOT Protect Against:**
- ❌ Server compromise (custodial model - server has keys)
- ❌ Keycast admin access (admins can access encrypted keys)
- ❌ Law enforcement with legal warrant
- ❌ Supply chain attacks on dependencies

**User Responsibility:**
- Users trust Keycast to securely manage their keys
- Similar to Bluesky's custodial model
- Not suitable for high-security use cases requiring self-custody

---

## Integration Examples

### NIP-46 Remote Signing

Once you have a bunker URL, use it for remote signing:

#### Using nostr-tools

```javascript
import { SimplePool, finalizeEvent, getPublicKey } from 'nostr-tools';
import { Relay } from 'nostr-tools/relay';

async function signEventViaBunker(bunkerUrl, unsignedEvent) {
  // Parse bunker URL
  const match = bunkerUrl.match(/^bunker:\/\/([0-9a-f]{64})\?relay=(.+)&secret=(.+)$/);
  if (!match) throw new Error('Invalid bunker URL');

  const [, bunkerPubkey, relayUrl, secret] = match;

  // Connect to relay
  const relay = await Relay.connect(relayUrl);

  // Create NIP-46 signing request
  const requestId = crypto.randomUUID();
  const nip46Request = {
    id: requestId,
    method: 'sign_event',
    params: [unsignedEvent]
  };

  // Wrap request in kind 24133 event
  const requestEvent = {
    kind: 24133,
    created_at: Math.floor(Date.now() / 1000),
    tags: [['p', bunkerPubkey]],
    content: JSON.stringify(nip46Request),
    pubkey: unsignedEvent.pubkey
  };

  // Sign the request (using connection secret as signing key)
  // Note: Actual implementation would use NIP-04/NIP-44 encryption
  const signedRequest = finalizeEvent(requestEvent, hexToBytes(secret));

  // Publish signing request
  await relay.publish(signedRequest);

  // Wait for response
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      sub.close();
      reject(new Error('Bunker signing timeout'));
    }, 30000);

    const sub = relay.subscribe([
      {
        kinds: [24133],
        authors: [bunkerPubkey],
        '#p': [unsignedEvent.pubkey],
        since: Math.floor(Date.now() / 1000)
      }
    ], {
      onevent(event) {
        try {
          const response = JSON.parse(event.content);
          if (response.id === requestId && response.result) {
            clearTimeout(timeout);
            sub.close();
            resolve(response.result); // Signed event
          }
        } catch (e) {
          console.error('Error parsing response:', e);
        }
      }
    });
  });
}

// Usage
const unsignedEvent = {
  kind: 1,
  created_at: Math.floor(Date.now() / 1000),
  tags: [],
  content: 'Hello Nostr!',
  pubkey: userPubkey
};

const signedEvent = await signEventViaBunker(bunkerUrl, unsignedEvent);
```

#### Using NDK

```javascript
import NDK from '@nostr-dev-kit/ndk';

async function setupNDKWithBunker(bunkerUrl) {
  const ndk = new NDK({
    explicitRelayUrls: ['wss://relay.damus.io']
  });

  await ndk.connect();

  // NDK automatically handles NIP-46 bunker URLs
  // Parse and use bunker URL for signing
  const remoteSigner = ndk.createRemoteSigner(bunkerUrl);
  ndk.signer = remoteSigner;

  return ndk;
}

// Usage
const ndk = await setupNDKWithBunker(bunkerUrl);

const event = new NDKEvent(ndk);
event.kind = 1;
event.content = 'Hello from NDK with Keycast!';

await event.publish(); // Automatically signs via bunker
```

### Complete Web App Example

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Nostr App with Keycast</title>
  <script src="https://cdn.jsdelivr.net/npm/nostr-tools@2/lib/nostr.bundle.js"></script>
</head>
<body>
  <div id="auth">
    <h2>Login to Keycast</h2>
    <input type="email" id="email" placeholder="Email">
    <input type="password" id="password" placeholder="Password">
    <button onclick="login()">Login</button>
    <button onclick="register()">Register</button>
  </div>

  <div id="app" style="display: none;">
    <h2>Post to Nostr</h2>
    <textarea id="content" placeholder="What's on your mind?"></textarea>
    <button onclick="post()">Post</button>
    <div id="status"></div>
  </div>

  <script>
    const API_URL = 'https://oauth.divine.video';
    let token = null;
    let bunkerUrl = null;

    async function register() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        token = data.token;
        await loadBunkerUrl();
        showApp();
      } else {
        alert(data.error);
      }
    }

    async function login() {
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (res.ok) {
        token = data.token;
        await loadBunkerUrl();
        showApp();
      } else {
        alert(data.error);
      }
    }

    async function loadBunkerUrl() {
      const res = await fetch(`${API_URL}/api/user/bunker`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (res.ok) {
        bunkerUrl = data.bunker_url;
      }
    }

    function showApp() {
      document.getElementById('auth').style.display = 'none';
      document.getElementById('app').style.display = 'block';
    }

    async function post() {
      const content = document.getElementById('content').value;
      const status = document.getElementById('status');

      status.textContent = 'Signing via bunker...';

      // Use bunkerUrl with NIP-46 to sign and publish event
      // (Implementation depends on your Nostr library)

      status.textContent = 'Posted!';
    }
  </script>
</body>
</html>
```

---

## Troubleshooting

### Common Issues

#### "JWT_SECRET not set" Warning

**Symptom:** Warning in logs about insecure JWT secret
**Solution:** Set `JWT_SECRET` environment variable:
```bash
export JWT_SECRET=$(openssl rand -base64 32)
```

#### "Service temporarily unavailable"

**Symptom:** Generic error message
**Causes:**
- Database connection failure
- KMS encryption/decryption failure
- Email service unavailable (non-critical, should not block auth)

**Check:**
- Database file permissions and path
- GCP credentials and KMS configuration
- Server logs for detailed error messages

#### "Invalid or expired token"

**Symptom:** 401 error when accessing protected endpoints
**Solutions:**
- Token may have expired (24-hour lifetime)
- User should re-login to get new token
- Check `Authorization` header format: `Bearer {token}`

#### "Email already registered"

**Symptom:** 409 Conflict on registration
**Solution:** User should use `/api/auth/login` instead

#### Bunker Signing Timeout

**Symptom:** NIP-46 signing request times out
**Causes:**
- Signer daemon not running
- Relay connection issues
- Bunker URL not properly formatted

**Check:**
- Signer daemon logs: `docker logs keycast-signer`
- Relay connectivity: Can you connect to `wss://relay.damus.io`?
- Bunker URL format: `bunker://{64-hex}?relay={url}&secret={secret}`

#### CORS Errors

**Symptom:** Browser blocks requests with CORS error
**Note:** API is configured to allow all origins for embeddable auth
**Check:** Ensure you're using HTTPS in production

---

## Best Practices

### For Client Developers

1. **Store JWT Securely**
   - Use httpOnly, secure cookies in web apps
   - Use secure storage (Keychain/Keystore) in mobile apps
   - Never expose tokens in URLs or localStorage

2. **Handle Token Expiration**
   - Implement automatic re-login on 401 errors
   - Refresh tokens proactively before expiration
   - Show user-friendly re-authentication prompts

3. **Bunker URL Security**
   - Never log or display bunker URLs in clear text
   - Treat bunker URLs like passwords
   - Store encrypted on client side

4. **Error Handling**
   - Parse error messages from API responses
   - Show user-friendly error messages
   - Log detailed errors for debugging

5. **User Experience**
   - Show loading states during auth flows
   - Provide clear feedback on success/failure
   - Handle network timeouts gracefully

### For Server Operators

1. **Environment Security**
   - Use Google Secret Manager for `JWT_SECRET` in production
   - Enable GCP KMS for production encryption
   - Never commit secrets to version control

2. **Database Backups**
   - Regular automated backups of SQLite database
   - Test restore procedures
   - Consider PostgreSQL for high-scale deployments

3. **Monitoring**
   - Monitor auth endpoint error rates
   - Alert on KMS encryption failures
   - Track JWT validation failures (possible attacks)

4. **Rate Limiting**
   - Implement rate limiting on auth endpoints
   - Block repeated failed login attempts
   - Use CAPTCHA for high-risk actions

5. **Logging**
   - Log all authentication attempts (success and failure)
   - Redact sensitive data (passwords, tokens, secrets)
   - Monitor for suspicious patterns

### Testing

1. **Unit Tests**
   - Test all auth flows with mock data
   - Test error conditions (invalid credentials, expired tokens)
   - Test token validation logic

2. **Integration Tests**
   - Test complete flows end-to-end
   - Use test database separate from production
   - Clean up test data after runs

3. **Security Testing**
   - Test JWT validation with invalid tokens
   - Test authorization code expiration
   - Test password reset token expiration
   - Verify encryption/decryption with KMS

---

## Additional Resources

- **NIP-46 Specification:** https://github.com/nostr-protocol/nips/blob/master/46.md
- **OAuth 2.0 RFC:** https://datatracker.ietf.org/doc/html/rfc6749
- **Keycast Documentation:** `/docs` endpoint on your Keycast instance
- **Example Clients:** `examples/` directory in Keycast repository

---

## Support

For issues, questions, or contributions:

- **GitHub Issues:** https://github.com/rabble/keycast/issues
- **Documentation:** https://oauth.divine.video/docs
- **Examples:** https://oauth.divine.video/examples/

---

## Changelog

### Version 1.0 (2025-01-15)
- Initial release with Personal Auth and OAuth flows
- JWT-based authentication
- Email verification and password reset
- Session management
- Profile management
- NIP-46 bunker URL generation
- Multi-tenancy support
- GCP KMS encryption
