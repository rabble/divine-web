// ABOUTME: Minimal MailerLite email signup form for footer
// ABOUTME: Streamlined inline form with no fluff

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function MailerLiteSignupFooter() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('fields[email]', email);
    formData.append('ml-submit', '1');
    formData.append('anticsrf', 'true');

    try {
      await fetch('https://assets.mailerlite.com/jsonp/922604/forms/171053339050510058/subscribe', {
        method: 'POST',
        body: formData,
        mode: 'no-cors',
      });

      setIsSuccess(true);
      setEmail('');
    } catch (error) {
      console.error('Error submitting form:', error);
      setIsSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="text-sm text-foreground">
        ✓ Thanks for subscribing!
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
      <Input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        disabled={isSubmitting}
        className="flex-1 h-9 text-sm"
      />
      <Button
        type="submit"
        disabled={isSubmitting}
        size="sm"
        className="h-9 px-4"
      >
        {isSubmitting ? 'Subscribing...' : 'Subscribe'}
      </Button>
    </form>
  );
}
