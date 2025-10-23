// ABOUTME: Login form for existing Keycast users (email/password authentication)
// ABOUTME: Integrates with Keycast identity server and NIP-46 bunker for remote signing

import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { loginUser, getBunkerUrl } from '@/lib/keycast';
import { useLoginActions } from '@/hooks/useLoginActions';
import { useKeycastSession } from '@/hooks/useKeycastSession';
import { toast } from '@/hooks/useToast';

interface KeycastLoginFormProps {
  onSuccess: () => void;
}

export function KeycastLoginForm({ onSuccess }: KeycastLoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useLoginActions();
  const { saveSession, saveBunkerUrl } = useKeycastSession();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 LOGIN handleSubmit CALLED');
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Login with Keycast to get JWT and pubkey
      console.log('Step 1: Logging in with Keycast...');
      const { token, pubkey } = await loginUser(email, password);
      console.log('Login successful, pubkey:', pubkey);

      // Step 2: Save session
      console.log('Step 2: Saving session...');
      saveSession(token, email, rememberMe);

      // Step 3: Get bunker URL
      console.log('Step 3: Getting bunker URL...');
      const bunkerUrl = await getBunkerUrl(token);
      console.log('Bunker URL received:', bunkerUrl.substring(0, 50) + '...');

      // Step 3.5: Save bunker URL for persistent reconnection
      saveBunkerUrl(bunkerUrl);

      // Step 4: Start bunker connection in background
      console.log('Step 4: Connecting to bunker in background...');
      console.log('User pubkey:', pubkey);
      console.log('Bunker URL:', bunkerUrl.substring(0, 50) + '...');

      // Show success toast immediately
      toast({
        title: 'Login Successful!',
        description: 'Connecting to signing service...',
      });

      // Start bunker connection asynchronously - don't wait for it
      console.log('🔄 Starting bunker connection...');
      const bunkerStart = Date.now();

      // Set a 60-second timeout to detect if bunker hangs
      const bunkerTimeout = setTimeout(() => {
        const bunkerTime = Date.now() - bunkerStart;
        console.warn(`⏱️ Bunker connection still pending after ${bunkerTime}ms - may be hanging`);

        // Show warning toast if connection is taking too long
        toast({
          title: 'Connection Slow',
          description: 'Signing service is taking longer than expected. You can still browse content.',
          variant: 'destructive',
        });
      }, 60000);

      login.bunker(bunkerUrl).then(() => {
        clearTimeout(bunkerTimeout);
        const bunkerTime = Date.now() - bunkerStart;
        console.log(`✅ Bunker connection completed successfully in ${bunkerTime}ms!`);
        console.log('🎉 You can now sign events!');

        // Show success toast
        toast({
          title: 'Signing Service Connected!',
          description: 'You can now post and interact with content.',
        });

        // Force a re-render to update the UI
        window.location.reload();
      }).catch((err) => {
        clearTimeout(bunkerTimeout);
        const bunkerTime = Date.now() - bunkerStart;
        console.error(`❌ Bunker connection failed after ${bunkerTime}ms:`, err);
        console.error('Error details:', err);
        console.warn('⚠️ Signing will not work until bunker connects');

        // Show warning toast
        toast({
          title: 'Signing Service Failed',
          description: 'You can browse content, but signing may not work. Try refreshing the page.',
          variant: 'destructive',
        });
      });

      console.log('✅ Login started! Proceeding to app...');

      // Success! Don't wait for bunker to complete
      onSuccess();
    } catch (err) {
      console.error('Keycast login failed:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack : undefined,
      });
      setError(
        err instanceof Error
          ? err.message
          : 'Login failed. Please check your credentials and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <label htmlFor="keycast-email" className="text-sm font-medium">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="keycast-email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError(null);
            }}
            className="pl-10 rounded-lg"
            placeholder="your@email.com"
            autoComplete="email"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="keycast-password" className="text-sm font-medium">
          Password
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="keycast-password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            className="pl-10 rounded-lg"
            placeholder="Your password"
            autoComplete="current-password"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="remember-me"
          checked={rememberMe}
          onCheckedChange={(checked) => setRememberMe(checked === true)}
          disabled={isLoading}
        />
        <label
          htmlFor="remember-me"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          Remember me for 1 week
        </label>
      </div>

      <Button
        type="submit"
        className="w-full rounded-full py-3"
        disabled={isLoading || !email.trim() || !password.trim()}
      >
        {isLoading ? 'Logging in...' : 'Log In with Email'}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your Nostr keys are securely managed by Keycast
      </p>
    </form>
  );
}
