import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Mail, Lock, User, Chrome } from 'lucide-react';

export default function Auth() {
  const {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle
  } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
      } else {
        await signIn(email, password);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-vice-pink mx-auto mb-4" />
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-vice-purple via-black to-vice-blue relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-black/20 z-0" />

      {/* Animated waves */}
      <div className="absolute bottom-0 left-0 w-full overflow-hidden opacity-30 z-10">
        <div className="wave-bg h-16 bg-gradient-to-r from-vice-cyan to-vice-pink animate-wave-1"></div>
        <div className="wave-bg h-12 bg-gradient-to-r from-vice-pink to-vice-purple animate-wave-2 -mt-6"></div>
        <div className="wave-bg h-8 bg-gradient-to-r from-vice-blue to-vice-cyan animate-wave-3 -mt-4"></div>
      </div>

      {/* Lens flares */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-vice-cyan rounded-full opacity-20 blur-xl animate-lens-flare-1 z-10"></div>
      <div className="absolute top-20 right-16 w-16 h-16 bg-vice-pink rounded-full opacity-30 blur-lg animate-lens-flare-2 z-10"></div>
      <div className="absolute bottom-20 left-16 w-24 h-24 bg-vice-purple rounded-full opacity-15 blur-2xl animate-lens-flare-3 z-10"></div>
      <div className="absolute bottom-10 right-10 w-12 h-12 bg-vice-orange rounded-full opacity-25 blur-md animate-lens-flare-4 z-10"></div>

      {/* Content */}
      <div className="relative flex flex-col justify-center items-center min-h-screen py-6 px-4 z-30">
        <div className="w-full max-w-sm space-y-6">
          {/* Logo - Enhanced for true transparency and larger size */}
          <div className="text-center mb-8">
            <div className="spr-logo-container">
              <img
                src="/vicecity.png"
                alt="SPR Vice City Logo"
                className="spr-logo mx-auto w-48 h-auto sm:w-56 md:w-64 lg:w-72 xl:w-80 max-w-[90vw] object-contain"
                style={{
                  // Force transparent background
                  backgroundColor: 'transparent',
                  background: 'none',
                  // Prevent any box or border artifacts
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  // Optimize rendering
                  imageRendering: 'crisp-edges'
                }}
                onLoad={(e) => {
                  // Ensure the image background is truly transparent
                  const img = e.target as HTMLImageElement;
                  img.style.backgroundColor = 'transparent';
                  img.style.background = 'transparent';

                  // Remove any potential canvas or container backgrounds
                  const parent = img.parentElement;
                  if (parent) {
                    parent.style.backgroundColor = 'transparent';
                    parent.style.background = 'transparent';
                  }
                }}
                onError={(e) => {
                  console.error('Logo failed to load:', e);
                  // Fallback: show styled text instead
                  const img = e.target as HTMLImageElement;
                  img.style.display = 'none';

                  // Create fallback text element
                  const fallback = document.createElement('div');
                  fallback.className = 'vice-city-font text-4xl sm:text-5xl md:text-6xl text-center';
                  fallback.textContent = 'SPR VICE CITY';
                  img.parentElement?.appendChild(fallback);
                }}
              />
            </div>
          </div>

          {/* Auth Card */}
          <Card className="bg-black/40 border-vice-cyan/30 backdrop-blur-sm">
            <CardHeader className="text-center pb-2 pt-4">
              <CardTitle className="text-white text-xl">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </CardTitle>
              <CardDescription className="text-vice-cyan/80">
                {isSignUp ? 'Register with your invitation email' : 'Access your SPR account'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 pb-3 px-4">
              <form onSubmit={handleSubmit} className="space-y-1.5">
                {isSignUp && (
                  <div className="space-y-0.5">
                    <Label htmlFor="fullName" className="text-white text-sm">Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-vice-cyan/60" />
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Enter your name"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="pl-10 bg-black/30 border-vice-cyan/30 text-white placeholder:text-vice-cyan/40 focus:border-vice-pink h-9"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-0.5">
                  <Label htmlFor="email" className="text-white text-sm">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-vice-cyan/60" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-10 bg-black/30 border-vice-cyan/30 text-white placeholder:text-vice-cyan/40 focus:border-vice-pink h-9"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-0.5">
                  <Label htmlFor="password" className="text-white text-sm">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-vice-cyan/60" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="7+ letters, at least 1 number"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10 bg-black/30 border-vice-cyan/30 text-white placeholder:text-vice-cyan/40 focus:border-vice-pink h-9"
                      minLength={7}
                      pattern="^(?=.*[0-9]).{7,}$"
                      title="Password must be at least 7 characters and contain at least one number"
                      required
                    />
                  </div>
                </div>

                <div className="pt-1">
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-vice-pink to-vice-purple hover:from-vice-purple hover:to-vice-pink text-white font-semibold h-9"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Button>
                </div>
              </form>

              <Separator className="bg-vice-cyan/20 my-3" />

              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full bg-white/10 border-vice-cyan/30 text-white hover:bg-white/20 h-11 text-base"
                disabled={isLoading}
              >
                <Chrome className="h-4 w-4 mr-2" />
                Continue with Google
              </Button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setIsSignUp(!isSignUp)}
                  className="text-vice-cyan hover:text-vice-pink text-sm transition-colors"
                >
                  {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}