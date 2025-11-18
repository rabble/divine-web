import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function PressPage() {
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Load MailerLite script
    const script = document.createElement('script');
    script.src = 'https://groot.mailerlite.com/js/w/webforms.min.js?v176e10baa5e7ed80d35ae235be3d5024';
    script.async = true;
    document.body.appendChild(script);

    // Load tracking script
    const trackingScript = document.createElement('script');
    trackingScript.innerHTML = 'fetch("https://assets.mailerlite.com/jsonp/922604/forms/171273553854858427/takel")';
    document.body.appendChild(trackingScript);

    // Add success handler function to window
    (window as any).ml_webform_success_33427086 = function() {
      setShowSuccess(true);
    };

    return () => {
      document.body.removeChild(script);
      document.body.removeChild(trackingScript);
      delete (window as any).ml_webform_success_33427086;
    };
  }, []);

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
          {showSuccess ? (
            <div className="py-8 text-center">
              <h4 className="text-green-600 dark:text-green-400 text-xl font-semibold mb-2">We've received your inquiry.</h4>
              <p className="text-muted-foreground">Someone from our media team will be in touch shortly.</p>
            </div>
          ) : (
            <div id="mlb2-33427086" className="ml-form-embedContainer ml-subscribe-form ml-subscribe-form-33427086">
              <div className="ml-form-align-center">
                <div className="ml-form-embedWrapper embedForm">
                  <div className="ml-form-embedBody ml-form-embedBodyDefault row-form">
                    <div className="ml-form-embedContent mb-4">
                      <h4 className="text-lg font-semibold">Media Contact</h4>
                      <p className="text-muted-foreground">Share your contact information and deadline below.</p>
                    </div>

                    <form className="ml-block-form space-y-4" action="https://assets.mailerlite.com/jsonp/922604/forms/171273553854858427/subscribe" data-code="" method="post">
                      <div className="ml-form-formContent space-y-4">
                        <div className="ml-form-fieldRow">
                          <div className="ml-field-group ml-field-email ml-validate-email ml-validate-required">
                            <input
                              aria-label="email"
                              aria-required="true"
                              type="email"
                              className="form-control w-full px-3 py-2 border border-input rounded-md bg-background"
                              name="fields[email]"
                              placeholder="Email"
                              autoComplete="email"
                            />
                          </div>
                        </div>

                        <div className="ml-form-fieldRow">
                          <div className="ml-field-group ml-field-name">
                            <input
                              aria-label="name"
                              type="text"
                              className="form-control w-full px-3 py-2 border border-input rounded-md bg-background"
                              name="fields[name]"
                              placeholder="Name"
                              autoComplete="given-name"
                            />
                          </div>
                        </div>

                        <div className="ml-form-fieldRow">
                          <div className="ml-field-group ml-field-last_name">
                            <input
                              aria-label="last_name"
                              type="text"
                              className="form-control w-full px-3 py-2 border border-input rounded-md bg-background"
                              name="fields[last_name]"
                              placeholder="Last name"
                              autoComplete="family-name"
                            />
                          </div>
                        </div>

                        <div className="ml-form-fieldRow ml-last-item">
                          <div className="ml-field-group ml-field-message ml-validate-required">
                            <textarea
                              className="form-control w-full px-3 py-2 border border-input rounded-md bg-background"
                              name="fields[message]"
                              aria-label="message"
                              aria-required="true"
                              maxLength={255}
                              placeholder="Share your deadline and request."
                              rows={4}
                            />
                          </div>
                        </div>
                      </div>

                      <input type="hidden" name="ml-submit" value="1" />
                      <input type="hidden" name="anticsrf" value="true" />

                      <div className="ml-form-embedSubmit">
                        <button type="submit" className="primary w-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium">
                          Submit
                        </button>
                        <button disabled style={{ display: 'none' }} type="button" className="loading">
                          <div className="ml-form-embedSubmitLoad"></div>
                          <span className="sr-only">Loading...</span>
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="mt-8 p-6 bg-muted/50 rounded-lg">
        <h2 className="text-xl font-semibold mb-3">Media Resources</h2>
        <p className="text-muted-foreground mb-4">
          For general information about diVine, please visit our{' '}
          <a href="/about" className="text-primary hover:underline">
            About page
          </a>
          {' '}and{' '}
          <a href="/media-resources" className="text-primary hover:underline">
            Media Resources
          </a>
          .
        </p>
        <p className="text-muted-foreground mb-4">
          Looking for our press releases?{' '}
          <a href="/news/vine-revisited" className="text-primary hover:underline">
            Read our launch announcement
          </a>
          .
        </p>
        <p className="text-muted-foreground">
          See where we've been featured:{' '}
          <a href="/news" className="text-primary hover:underline">
            In the News
          </a>
          .
        </p>
      </div>
    </div>
  );
}

export default PressPage;
