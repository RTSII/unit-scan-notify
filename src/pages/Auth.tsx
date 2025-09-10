import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Separator } from '../components/ui/separator';
import { Loader2, Mail, Lock, User } from 'lucide-react';
import { BackgroundGradientAnimation } from '../../components/aceternity/BackgroundGradientAnimation';

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
      <BackgroundGradientAnimation
        gradientBackgroundStart="rgb(139, 47, 160)"
        gradientBackgroundEnd="rgb(65, 105, 225)"
        firstColor="139, 47, 160"
        secondColor="255, 20, 147"
        thirdColor="0, 255, 255"
        fourthColor="255, 99, 71"
        fifthColor="65, 105, 225"
        pointerColor="139, 47, 160"
        size="80%"
        blendingValue="hard-light"
        interactive={true}
      >
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-vice-pink mx-auto mb-4" />
            <p className="text-white">Loading...</p>
          </div>
        </div>
      </BackgroundGradientAnimation>
    );
  }

  return (
    <BackgroundGradientAnimation
      gradientBackgroundStart="rgb(139, 47, 160)"
      gradientBackgroundEnd="rgb(65, 105, 225)"
      firstColor="139, 47, 160"
      secondColor="255, 20, 147"
      thirdColor="0, 255, 255"
      fourthColor="255, 99, 71"
      fifthColor="65, 105, 225"
      pointerColor="139, 47, 160"
      size="80%"
      blendingValue="hard-light"
      interactive={true}
    >
      {/* Mobile-first responsive container with proper safe area handling */}
      <div className="relative">
        {/* Safe area top padding */}
        <div className="h-safe-top bg-transparent"></div>

        <div className="flex flex-col justify-center items-center px-4 pb-8 pt-4 min-h-[calc(100vh-env(safe-area-inset-top)-env(safe-area-inset-bottom))]">
          <div className="w-full max-w-md space-y-4">
            {/* Logo - Enhanced for true transparency and responsive sizing */}
            <div className="text-center mb-4">
              <div className="spr-logo-container">
                <img
                  src="/vicecity.png"
                  alt="SPR Vice City Logo"
                  className="spr-logo mx-auto w-32 h-auto sm:w-40 md:w-48 max-w-[80vw] object-contain"
                  style={{
                    // Force transparent background
                    backgroundColor: 'transparent',
                    background: 'none',
                    // Prevent any box or border artifacts
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    // Optimize rendering
                    imageRendering: 'crisp-edges',
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
                    fallback.className = 'vice-city-font text-2xl sm:text-3xl md:text-4xl text-center';
                    fallback.textContent = 'SPR VICE CITY';
                    img.parentElement?.appendChild(fallback);
                  }}
                />
              </div>
            </div>

            {/* Auth Card with Glassmorphism - Responsive padding and sizing */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 shadow-lg w-full">
              <CardHeader className="text-center pb-3 pt-4">
                <CardTitle className="text-white text-lg sm:text-xl">
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </CardTitle>
                <CardDescription className="text-white/80 text-sm">
                  {isSignUp ? 'Register with your invitation email' : 'Access your SPR account'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pb-4 px-4">
                <form onSubmit={handleSubmit} className="space-y-3">
                  {isSignUp && (
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className="text-white text-sm">Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                        <Input
                          id="fullName"
                          type="text"
                          placeholder="Enter your name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/50 focus:ring-0 h-11 text-sm"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-white text-sm">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/50 focus:ring-0 h-11 text-sm"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-white text-sm">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-white/60" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="7+ letters, at least 1 number"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/50 focus:ring-0 h-11 text-sm"
                        minLength={7}
                        pattern="^(?=.*[0-9]).{7,}$"
                        title="Password must be at least 7 characters and contain at least one number"
                        required
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-vice-pink to-vice-purple hover:from-vice-purple hover:to-vice-pink text-white font-semibold h-11 text-sm"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {isSignUp ? 'Create Account' : 'Sign In'}
                    </Button>
                  </div>
                </form>

                <Separator className="bg-white/20 my-3" />

                <Button
                  onClick={handleGoogleSignIn}
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 h-12 text-base"
                  disabled={isLoading}
                >
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  Continue with Google
                </Button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSignUp(!isSignUp)}
                    className="text-white hover:text-vice-pink text-sm transition-colors"
                  >
                    {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Safe area bottom padding */}
        <div className="h-safe-bottom bg-transparent"></div>
      </div>
    </BackgroundGradientAnimation>
  );
}