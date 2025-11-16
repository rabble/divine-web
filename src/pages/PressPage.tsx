import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/useToast';

export function PressPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      const response = await fetch('https://formspree.io/f/xzzykawd', {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        setSubmitted(true);
        toast({
          title: 'Success!',
          description: 'Your press inquiry has been submitted. We\'ll get back to you soon.',
        });
        form.reset();
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to submit the form. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Press Inquiries</h1>
        <p className="text-lg text-muted-foreground">
          We welcome press and media inquiries about diVine. Please fill out the form below and we'll get back to you as soon as possible.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Contact Form</CardTitle>
          <CardDescription>
            Please provide your contact information and details about your inquiry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="py-8 text-center">
              <div className="text-green-600 dark:text-green-400 text-xl font-semibold mb-2">
                Thank you for your inquiry!
              </div>
              <p className="text-muted-foreground mb-6">
                We've received your message and will respond shortly.
              </p>
              <Button onClick={() => setSubmitted(false)}>
                Submit Another Inquiry
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  required
                  placeholder="Your full name"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  required
                  placeholder="your.email@example.com"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization">Organization</Label>
                <Input
                  id="organization"
                  name="organization"
                  type="text"
                  placeholder="Your media outlet or organization"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">Deadline (if applicable)</Label>
                <Input
                  id="deadline"
                  name="deadline"
                  type="date"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  name="message"
                  required
                  placeholder="Please describe your inquiry, the nature of your story, and any specific questions you have..."
                  rows={8}
                  disabled={isSubmitting}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Media Resources</h2>
        <p className="text-muted-foreground mb-4">
          For general information about diVine, please visit our{' '}
          <a href="/about" className="text-primary hover:underline">
            About page
          </a>{' '}
          and{' '}
          <a href="/news" className="text-primary hover:underline">
            News section
          </a>
          .
        </p>
        <p className="text-muted-foreground">
          Looking for our press releases?{' '}
          <a href="/news/vine-revisited" className="text-primary hover:underline">
            Read our launch announcement
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default PressPage;
