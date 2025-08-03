// NOTE: This file is stable and usually should not be modified.
// It is important that all functionality in this file is preserved, and should only be modified if explicitly requested.

import React, { useState, useEffect, useRef } from 'react';
import { Download, Key, UserPlus, FileText, Shield, User, Sparkles, LogIn, Lock, CheckCircle, Copy, Upload, Globe, FileSignature, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from '@/components/ui/card';
import { toast } from '@/hooks/useToast';
import { useLoginActions } from '@/hooks/useLoginActions';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useUploadFile } from '@/hooks/useUploadFile';
import { generateSecretKey, nip19 } from 'nostr-tools';
import { cn } from '@/lib/utils';

interface SignupDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const sanitizeFilename = (filename: string) => {
  return filename.replace(/[^a-z0-9_.-]/gi, '_');
}

const SignupDialog: React.FC<SignupDialogProps> = ({ isOpen, onClose, onComplete }) => {
  const [step, setStep] = useState<'welcome' | 'generate' | 'download' | 'profile' | 'done'>('welcome');
  const [isLoading, setIsLoading] = useState(false);
  const [nsec, setNsec] = useState('');
  const [showSparkles, setShowSparkles] = useState(false);
  const [keySecured, setKeySecured] = useState<'none' | 'copied' | 'downloaded'>('none');
  const [profileData, setProfileData] = useState({
    name: '',
    about: '',
    picture: ''
  });
  const login = useLoginActions();
  const { mutateAsync: publishEvent, isPending: isPublishing } = useNostrPublish();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadFile();
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Generate a proper nsec key using nostr-tools
  const generateKey = () => {
    setIsLoading(true);
    setShowSparkles(true);

    // Add a dramatic pause for the key generation effect
    setTimeout(() => {
      try {
        // Generate a new secret key
        const sk = generateSecretKey();

        // Convert to nsec format
        setNsec(nip19.nsecEncode(sk));
        setStep('download');

        toast({
          title: 'Your Secret Key is Ready!',
          description: 'A new secret key has been generated for you.',
        });
      } catch {
        toast({
          title: 'Error',
          description: 'Failed to generate key. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
        setShowSparkles(false);
      }
    }, 2000);
  };

  const downloadKey = () => {
    try {
      // Create a blob with the key text
      const blob = new Blob([nsec], { type: 'text/plain; charset=utf-8' });
      const url = globalThis.URL.createObjectURL(blob);

      // Sanitize filename
      const filename = sanitizeFilename('secret-key.txt');

      // Create a temporary link element and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();

      // Clean up immediately
      globalThis.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      // Mark as secured
      setKeySecured('downloaded');

      toast({
        title: 'Secret Key Saved!',
        description: 'Your key has been safely stored.',
      });
    } catch {
      toast({
        title: 'Download failed',
        description: 'Could not download the key file. Please copy it manually.',
        variant: 'destructive',
      });
    }
  };

  const copyKey = () => {
    navigator.clipboard.writeText(nsec);
    setKeySecured('copied');
    toast({
      title: 'Copied to clipboard!',
      description: 'Key copied to clipboard.',
    });
  };

  const finishKeySetup = () => {
    try {
      login.nsec(nsec);
      setStep('profile');
    } catch {
      toast({
        title: 'Login Failed',
        description: 'Failed to login with the generated key. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset file input
    e.target.value = '';

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file for your avatar.',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Avatar image must be smaller than 5MB.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const tags = await uploadFile(file);
      // Get the URL from the first tag
      const url = tags[0]?.[1];
      if (url) {
        setProfileData(prev => ({ ...prev, picture: url }));
        toast({
          title: 'Avatar uploaded!',
          description: 'Your avatar has been uploaded successfully.',
        });
      }
    } catch {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload avatar. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const finishSignup = async (skipProfile = false) => {
    // Mark signup completion time for fallback welcome modal
    localStorage.setItem('signup_completed', Date.now().toString());

    try {
      // Publish profile if user provided information
      if (!skipProfile && (profileData.name || profileData.about || profileData.picture)) {
        const metadata: Record<string, string> = {};
        if (profileData.name) metadata.name = profileData.name;
        if (profileData.about) metadata.about = profileData.about;
        if (profileData.picture) metadata.picture = profileData.picture;

        await publishEvent({
          kind: 0,
          content: JSON.stringify(metadata),
        });

        toast({
          title: 'Profile Created!',
          description: 'Your profile has been set up.',
        });
      }

      // Close signup and show welcome modal
      onClose();
      if (onComplete) {
        // Add a longer delay to ensure login state has fully propagated
        setTimeout(() => {
          onComplete();
        }, 600);
      } else {
        // Fallback for when used without onComplete
        setStep('done');
        setTimeout(() => {
          onClose();
          toast({
            title: 'Welcome!',
            description: 'Your account is ready.',
          });
        }, 3000);
      }
    } catch {
      toast({
        title: 'Profile Setup Failed',
        description: 'Your account was created but profile setup failed. You can update it later.',
        variant: 'destructive',
      });

      // Still proceed to completion even if profile failed
      onClose();
      if (onComplete) {
        // Add a longer delay to ensure login state has fully propagated
        setTimeout(() => {
          onComplete();
        }, 600);
      } else {
        // Fallback for when used without onComplete
        setStep('done');
        setTimeout(() => {
          onClose();
          toast({
            title: 'Welcome!',
            description: 'Your account is ready.',
          });
        }, 3000);
      }
    }
  };

  const getTitle = () => {
    if (step === 'welcome') return (
      <span className="flex items-center justify-center gap-2">
        <UserPlus className="w-5 h-5 text-primary" />
        Create Your Account
      </span>
    );
    if (step === 'generate') return (
      <span className="flex items-center justify-center gap-2">
        <Wand2 className="w-5 h-5 text-primary" />
        Generating Your Key
      </span>
    );
    if (step === 'download') return (
      <span className="flex items-center justify-center gap-2">
        <Lock className="w-5 h-5 text-primary" />
        Secret Key
      </span>
    );
    if (step === 'profile') return (
      <span className="flex items-center justify-center gap-2">
        <FileSignature className="w-5 h-5 text-primary" />
        Create Your Profile
      </span>
    );
    return (
      <span className="flex items-center justify-center gap-2">
        <User className="w-5 h-5 text-primary" />
        Welcome!
      </span>
    );
  };

  const getDescription = () => {
    if (step === 'welcome') return 'Ready to join the Nostr network?';
    if (step === 'generate') return 'Creating your secret key to access Nostr.';

    if (step === 'profile') return 'Tell others about yourself.';
    return 'Your account is ready!';
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setStep('welcome');
      setIsLoading(false);
      setNsec('');
      setShowSparkles(false);
      setKeySecured('none');
      setProfileData({ name: '', about: '', picture: '' });
    }
  }, [isOpen]);

  // Add sparkle animation effect
  useEffect(() => {
    if (showSparkles) {
      const interval = setInterval(() => {
        // This will trigger re-renders for sparkle animation
      }, 100);
      return () => clearInterval(interval);
    }
  }, [showSparkles]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={cn("max-w-[95vw] sm:max-w-md max-h-[90vh] max-h-[90dvh] p-0 overflow-hidden rounded-2xl flex flex-col")}
      >
        <DialogHeader className={cn('px-6 pt-6 pb-1 relative flex-shrink-0')}>
          <DialogTitle className={cn('font-semibold text-center text-lg')}>
            {getTitle()}
          </DialogTitle>
          <DialogDescription className={cn(`text-muted-foreground text-center ${step === 'download' && 'hidden'}`)}>
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        <div className='px-6 pt-2 pb-4 space-y-4 overflow-y-scroll flex-1'>
          {/* Welcome Step - New engaging introduction */}
          {step === 'welcome' && (
            <div className='text-center space-y-4'>
              {/* Hero illustration */}
              <div className='relative p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50'>
                <div className='flex justify-center items-center space-x-4 mb-3'>
                  <div className='relative'>
                    <UserPlus className='w-12 h-12 text-blue-600' />
                    <Sparkles className='w-4 h-4 text-yellow-500 absolute -top-1 -right-1 animate-pulse' />
                  </div>
                  <Globe className='w-16 h-16 text-blue-700 animate-spin-slow' />
                  <div className='relative'>
                    <FileText className='w-12 h-12 text-blue-600' />
                    <Sparkles className='w-4 h-4 text-yellow-500 absolute -top-1 -left-1 animate-pulse' style={{animationDelay: '0.3s'}} />
                  </div>
                </div>

                {/* Benefits */}
                <div className='grid grid-cols-1 gap-2 text-sm'>
                  <div className='flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300'>
                    <Shield className='w-4 h-4' />
                    Decentralized and censorship-resistant
                  </div>
                  <div className='flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300'>
                    <User className='w-4 h-4' />
                    You are in control of your data
                  </div>
                  <div className='flex items-center justify-center gap-2 text-blue-700 dark:text-blue-300'>
                    <Globe className='w-4 h-4' />
                    Join a global network
                  </div>
                </div>
              </div>

              <div className='space-y-3'>
                <p className='text-muted-foreground px-5'>
                  Join the Nostr network and take control of your social media experience.
                  Your journey begins by generating a secret key.
                </p>

                <Button
                  className='w-full rounded-full py-6 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-105 shadow-lg'
                  onClick={() => setStep('generate')}
                >
                  <LogIn className='w-5 h-5 mr-2' />
                  Get Started
                </Button>

                <p className='text-xs text-muted-foreground'>
                  Free forever • Decentralized • Your data, your control
                </p>
              </div>
            </div>
          )}

          {/* Generate Step - Enhanced with animations */}
          {step === 'generate' && (
            <div className='text-center space-y-4'>
              <div className='relative p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-purple-100 dark:from-blue-950/50 dark:to-purple-950/50 overflow-hidden'>
                {/* Animated background elements */}
                {showSparkles && (
                  <div className='absolute inset-0'>
                    {[...Array(12)].map((_, i) => (
                      <Sparkles
                        key={i}
                        className={`absolute w-4 h-4 text-yellow-400 animate-ping`}
                        style={{
                          left: `${Math.random() * 80 + 10}%`,
                          top: `${Math.random() * 80 + 10}%`,
                          animationDelay: `${Math.random() * 2}s`
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className='relative z-10'>
                  {isLoading ? (
                    <div className='space-y-3'>
                      <div className='relative'>
                        <Key className='w-20 h-20 text-primary mx-auto animate-pulse' />
                        <div className='absolute inset-0 flex items-center justify-center'>
                          <div className='w-24 h-24 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin'></div>
                        </div>
                      </div>
                      <div className='space-y-2'>
                        <p className='text-lg font-semibold text-primary flex items-center justify-center gap-2'>
                          <Sparkles className='w-5 h-5' />
                          Generating your secret key...
                        </p>
                        <p className='text-sm text-muted-foreground'>
                          Creating your secure key
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className='space-y-3'>
                      <Key className='w-20 h-20 text-primary mx-auto' />
                      <div className='space-y-2'>
                        <p className='text-lg font-semibold'>
                          Ready to generate your secret key?
                        </p>
                        <p className='text-sm text-muted-foreground px-5'>
                          This key will be your password to access applications within the Nostr network.
                        </p>

                      </div>
                    </div>
                  )}
                </div>
              </div>

              {!isLoading && (
                <Button
                  className='w-full rounded-full py-6 text-lg font-semibold bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transform transition-all duration-200 hover:scale-105 shadow-lg'
                  onClick={generateKey}
                  disabled={isLoading}
                >
                  <Sparkles className='w-5 h-5 mr-2' />
                  Generate My Secret Key
                </Button>
              )}
            </div>
          )}

          {/* Download Step - Whimsical and magical */}
          {step === 'download' && (
            <div className='text-center space-y-4'>
              {/* Key reveal */}
              <div className='relative p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 overflow-hidden'>
                {/* Sparkles */}
                <div className='absolute inset-0 pointer-events-none'>
                  <Sparkles className='absolute top-3 left-4 w-3 h-3 text-yellow-400 animate-pulse' style={{animationDelay: '0s'}} />
                  <Sparkles className='absolute top-6 right-6 w-3 h-3 text-yellow-500 animate-pulse' style={{animationDelay: '0.5s'}} />
                  <Sparkles className='absolute bottom-4 left-6 w-3 h-3 text-yellow-400 animate-pulse' style={{animationDelay: '1s'}} />
                  <Sparkles className='absolute bottom-3 right-4 w-3 h-3 text-yellow-500 animate-pulse' style={{animationDelay: '1.5s'}} />
                </div>

                <div className='relative z-10 flex justify-center items-center mb-3'>
                  <div className='relative'>
                    <div className='w-16 h-16 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full flex items-center justify-center shadow-lg animate-pulse'>
                      <Key className='w-8 h-8 text-indigo-800' />
                    </div>
                    <div className='absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center animate-bounce'>
                      <Sparkles className='w-3 h-3 text-white' />
                    </div>
                  </div>
                </div>

                <div className='relative z-10 space-y-2'>
                  <p className='text-base font-semibold'>
                    Your secret key has been generated!
                  </p>

                  {/* Warning */}
                  <div className='relative mx-auto max-w-sm'>
                    <div className='p-3 bg-gradient-to-r from-amber-100 via-yellow-50 to-amber-100 dark:from-amber-950/40 dark:via-yellow-950/20 dark:to-amber-950/40 rounded-lg border-2 border-amber-300 dark:border-amber-700 shadow-md'>
                      <div className='flex items-center gap-2 mb-1'>
                        <FileText className='w-3 h-3 text-amber-700' />
                        <span className='text-xs font-bold text-amber-800 dark:text-amber-200'>
                          Important Warning
                        </span>
                      </div>
                      <p className='text-xs text-red-700 dark:text-amber-300 italic'>
                        This key is your primary and only means of accessing your account. Store it safely and securely.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key vault */}


              {/* Security options */}
              <div className='space-y-3'>


                <div className='grid grid-cols-1 gap-2'>
                  {/* Download Option */}
                   <Card className={`cursor-pointer transition-all duration-200 ${
                    keySecured === 'downloaded'
                       ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20'
                       : 'hover:bg-primary/5 hover:border-primary/20'
                   }`}>
                    <CardContent className='p-3'>
                      <Button
                        variant="ghost"
                        className='w-full h-auto p-0 justify-start hover:bg-transparent'
                        onClick={downloadKey}
                      >
                        <div className='flex items-center gap-3 w-full'>
                          <div className={`p-1.5 rounded-lg ${
                            keySecured === 'downloaded'
                               ? 'bg-green-100 dark:bg-green-900'
                               : 'bg-primary/10'
                           }`}>
                            {keySecured === 'downloaded' ? (
                               <CheckCircle className='w-4 h-4 text-green-600' />
                             ) : (
                               <Download className='w-4 h-4 text-primary' />
                             )}
                          </div>
                          <div className='flex-1 text-left'>
                             <div className='font-medium text-sm'>
                               Download as File
                             </div>
                             <div className='text-xs text-muted-foreground'>
                               Save as secret-key.txt file
                             </div>
                          </div>
                          {keySecured === 'downloaded' && (
                             <div className='text-xs font-medium text-green-600'>
                               ✓ Downloaded
                             </div>
                           )}
                        </div>
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Copy Option */}
                   <Card className={`cursor-pointer transition-all duration-200 ${
                    keySecured === 'copied'
                       ? 'ring-2 ring-green-500 bg-green-50 dark:bg-green-950/20'
                       : 'hover:bg-primary/5 hover:border-primary/20'
                   }`}>
                    <CardContent className='p-3'>
                      <Button
                        variant="ghost"
                        className='w-full h-auto p-0 justify-start hover:bg-transparent'
                        onClick={copyKey}
                      >
                        <div className='flex items-center gap-3 w-full'>
                          <div className={`p-1.5 rounded-lg ${
                            keySecured === 'copied'
                               ? 'bg-green-100 dark:bg-green-900'
                               : 'bg-primary/10'
                           }`}>
                            {keySecured === 'copied' ? (
                               <CheckCircle className='w-4 h-4 text-green-600' />
                             ) : (
                               <Copy className='w-4 h-4 text-primary' />
                             )}
                          </div>
                          <div className='flex-1 text-left'>
                             <div className='font-medium text-sm'>
                               Copy to Clipboard
                             </div>
                             <div className='text-xs text-muted-foreground'>
                               Save to password manager
                            </div>
                            <div className='text-[.7rem] text-muted-foreground'>
                              {nsec.slice(0,16)}...
                            </div>
                          </div>
                          {keySecured === 'copied' && (
                             <div className='text-xs font-medium text-green-600'>
                               ✓ Copied
                             </div>
                           )}
                        </div>
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Continue button */}
                <Button
                  className={`w-full rounded-full py-4 text-base font-semibold transform transition-all duration-200 shadow-lg ${
                    keySecured !== 'none'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 dark:from-blue-950/50 dark:to-purple-950/50 hover:scale-105'
                      : 'bg-gradient-to-r from-blue-600/60 to-indigo-600/60 text-muted cursor-not-allowed'
                  }`}
                  onClick={finishKeySetup}
                  disabled={keySecured === 'none'}
                >
                  <LogIn className='w-4 h-4 mr-2 flex-shrink-0' />
                  <span className="text-center leading-tight">
                    {keySecured === 'none' ? (
                      <>
                        Please secure your key first
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">My Key is Safe - Continue</span>
                        <span className="sm:hidden">Key Secured - Continue</span>
                      </>
                    )}
                  </span>
                </Button>
              </div>
            </div>
          )}

          {/* Profile Step - Optional profile setup */}
          {step === 'profile' && (
            <div className='text-center space-y-4'>
              {/* Profile setup illustration */}
              <div className='relative p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950/50 dark:to-indigo-950/50 overflow-hidden'>
                {/* Sparkles */}
                <div className='absolute inset-0 pointer-events-none'>
                  <Sparkles className='absolute top-3 left-4 w-3 h-3 text-yellow-400 animate-pulse' style={{animationDelay: '0s'}} />
                  <Sparkles className='absolute top-6 right-6 w-3 h-3 text-yellow-500 animate-pulse' style={{animationDelay: '0.5s'}} />
                  <Sparkles className='absolute bottom-4 left-6 w-3 h-3 text-yellow-400 animate-pulse' style={{animationDelay: '1s'}} />
                </div>

                <div className='relative z-10 flex justify-center items-center mb-3'>
                  <div className='relative'>
                    <div className='w-16 h-16 bg-gradient-to-br from-blue-200 to-indigo-300 rounded-full flex items-center justify-center shadow-lg'>
                      <User className='w-8 h-8 text-blue-800' />
                    </div>
                    <div className='absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center animate-bounce'>
                      <Sparkles className='w-3 h-3 text-white' />
                    </div>
                  </div>
                </div>

                <div className='relative z-10 space-y-2'>
                  <p className='text-base font-semibold'>
                    Almost there! Let's set up your profile
                  </p>

                  <p className='text-sm text-muted-foreground'>
                    Your profile is your identity on Nostr.
                  </p>
                </div>
              </div>

              {/* Publishing status indicator */}
              {isPublishing && (
                <div className='relative p-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800'>
                  <div className='flex items-center justify-center gap-3'>
                    <div className='w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin' />
                    <span className='text-sm font-medium text-blue-700 dark:text-blue-300'>
                      Publishing your profile...
                    </span>
                  </div>
                </div>
              )}

              {/* Profile form */}
              <div className={`space-y-4 text-left ${isPublishing ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className='space-y-2'>
                  <label htmlFor='profile-name' className='text-sm font-medium'>
                    Display Name
                  </label>
                  <Input
                    id='profile-name'
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder='Your name'
                    className='rounded-lg'
                    disabled={isPublishing}
                  />
                </div>

                <div className='space-y-2'>
                  <label htmlFor='profile-about' className='text-sm font-medium'>
                    Bio
                  </label>
                  <Textarea
                    id='profile-about'
                    value={profileData.about}
                    onChange={(e) => setProfileData(prev => ({ ...prev, about: e.target.value }))}
                    placeholder='Tell others about yourself...'
                    className='rounded-lg resize-none'
                    rows={3}
                    disabled={isPublishing}
                  />
                </div>

                <div className='space-y-2'>
                  <label htmlFor='profile-picture' className='text-sm font-medium'>
                    Avatar
                  </label>
                  <div className='flex gap-2'>
                    <Input
                      id='profile-picture'
                      value={profileData.picture}
                      onChange={(e) => setProfileData(prev => ({ ...prev, picture: e.target.value }))}
                      placeholder='https://example.com/your-avatar.jpg'
                      className='rounded-lg flex-1'
                      disabled={isPublishing}
                    />
                    <input
                      type='file'
                      accept='image/*'
                      className='hidden'
                      ref={avatarFileInputRef}
                      onChange={handleAvatarUpload}
                    />
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      onClick={() => avatarFileInputRef.current?.click()}
                      disabled={isUploading || isPublishing}
                      className='rounded-lg shrink-0'
                      title='Upload avatar image'
                    >
                      {isUploading ? (
                        <div className='w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin' />
                      ) : (
                        <Upload className='w-4 h-4' />
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className='space-y-3'>
                <Button
                  className='w-full rounded-full py-4 text-base font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transform transition-all duration-200 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none'
                  onClick={() => finishSignup(false)}
                  disabled={isPublishing || isUploading}
                >
                  {isPublishing ? (
                    <>
                      <div className='w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin' />
                      Creating Profile...
                    </>
                  ) : (
                    <>
                      <User className='w-4 h-4 mr-2' />
                      Create Profile & Finish
                    </>
                  )}
                </Button>

                <Button
                  variant='outline'
                  className='w-full rounded-full py-3 disabled:opacity-50 disabled:cursor-not-allowed'
                  onClick={() => finishSignup(true)}
                  disabled={isPublishing || isUploading}
                >
                  {isPublishing ? (
                    <>
                      <div className='w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin' />
                      Setting up account...
                    </>
                  ) : (
                    'Skip for now'
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignupDialog;
