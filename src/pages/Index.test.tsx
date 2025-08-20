import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestApp } from '@/test/TestApp';
import Index from './Index';

describe('Index Page', () => {
  it('should render the MKStack footer link', () => {
    render(
      <TestApp>
        <Index />
      </TestApp>
    );

    // Check that the MKStack link is present
    const mkstackLink = screen.getByRole('link', { name: 'Vibed with MKStack' });
    expect(mkstackLink).toBeInTheDocument();
  });

  it('should have correct MKStack link attributes', () => {
    render(
      <TestApp>
        <Index />
      </TestApp>
    );

    const mkstackLink = screen.getByRole('link', { name: 'Vibed with MKStack' });
    
    // Check the href attribute
    expect(mkstackLink).toHaveAttribute('href', 'https://soapbox.pub/mkstack');
    
    // Check that it opens in a new tab
    expect(mkstackLink).toHaveAttribute('target', '_blank');
    
    // Check security attributes
    expect(mkstackLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('should have appropriate styling for the MKStack link', () => {
    render(
      <TestApp>
        <Index />
      </TestApp>
    );

    const mkstackLink = screen.getByRole('link', { name: 'Vibed with MKStack' });
    
    // Check that it has hover styling classes
    expect(mkstackLink).toHaveClass('hover:text-foreground', 'transition-colors');
  });

  it('should render the footer in the correct location', () => {
    render(
      <TestApp>
        <Index />
      </TestApp>
    );

    // Check that the footer element exists
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
    
    // Check that it has the expected classes for styling
    expect(footer).toHaveClass('mt-auto', 'border-t', 'py-8');
  });
});