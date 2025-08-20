// ABOUTME: Privacy policy page explaining data collection and user rights
// ABOUTME: Based on OpenVine's privacy commitments and Nostr protocol principles

import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Lock, Users, Database, UserCheck, AlertCircle } from 'lucide-react';

export function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
      
      <div className="space-y-8">
        {/* Key Commitments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Key Commitments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Divine Web is committed to:</p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-primary rounded-full mt-1.5" />
                <span>Creating a social app with less abuse by design</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-primary rounded-full mt-1.5" />
                <span>Minimizing centralized data collection</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-primary rounded-full mt-1.5" />
                <span>Empowering user control</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-primary rounded-full mt-1.5" />
                <span>Enabling user ownership of identity</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Core Principles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Distributed Social Network
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-sm">Built on Nostr protocol</span>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-sm">Content stored across multiple relays</span>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-sm">Users can choose their own relays</span>
            </div>
            <div className="flex items-start gap-2">
              <Lock className="h-4 w-4 text-muted-foreground mt-0.5" />
              <span className="text-sm">No single company controls the entire network</span>
            </div>
          </CardContent>
        </Card>

        {/* Data Collection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              Data Collection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3">Information Collected</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Display Name</li>
                <li>• Public Identifier (cryptographic key)</li>
                <li>• Profile information</li>
                <li>• Public video content</li>
                <li>• Followers/Following lists</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3">What We Don't Collect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Extensive personal data</li>
                <li>• Information designed to generate revenue from user data</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Key Restrictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Key Restrictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
                <p className="text-sm font-medium">User Limitations</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <li>• Not designed for children under 16</li>
                  <li>• Public content by default</li>
                  <li>• Users can delete their own content</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Sharing */}
        <Card>
          <CardHeader>
            <CardTitle>Data Sharing Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">Divine Web may share data:</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• As part of distributed network operation</li>
              <li>• With necessary third-party services</li>
              <li>• When legally required</li>
              <li>• Potential ownership changes</li>
            </ul>
          </CardContent>
        </Card>

        {/* User Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" />
              User Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full mt-1.5" />
                <span>Edit profile information</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full mt-1.5" />
                <span>Delete content</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full mt-1.5" />
                <span>Portable identity across Nostr-compatible platforms</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full mt-1.5" />
                <span>Option to completely delete account</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Important Note */}
        <Card className="border-yellow-500/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-500" />
              Important Note
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Users should understand content shared publicly may be copied by others, 
              even after deletion. This is inherent to decentralized networks.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              For privacy-related questions, email:{' '}
              <a 
                href="mailto:rabble@openvine.co" 
                className="text-primary hover:underline"
              >
                rabble@openvine.co
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Links */}
        <div className="flex flex-wrap gap-4 justify-center pt-8 border-t">
          <Link to="/about" className="text-primary hover:underline">
            About
          </Link>
          <Link to="/open-source" className="text-primary hover:underline">
            Open Source
          </Link>
          <Link to="/" className="text-primary hover:underline">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPage;