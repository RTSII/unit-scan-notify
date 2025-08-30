import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const SignIn = () => {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-vice-purple via-vice-pink to-vice-orange">
      {/* Background Ocean Image with Animation Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/lovable-uploads/b6712007-fdbb-47bc-9609-07aeba8618e2.png')`
        }}
      >
        {/* Vaporwave Color Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-vice-purple/60 via-vice-pink/40 to-vice-cyan/30"></div>
        
        {/* Moving Waves Animation */}
        <div className="absolute bottom-0 left-0 w-full h-32">
          <div className="wave-animation absolute bottom-0 left-0 w-full h-16 bg-gradient-to-r from-vice-cyan/40 to-vice-blue/40 animate-wave-1"></div>
          <div className="wave-animation absolute bottom-2 left-0 w-full h-12 bg-gradient-to-r from-vice-blue/30 to-vice-purple/30 animate-wave-2"></div>
          <div className="wave-animation absolute bottom-4 left-0 w-full h-8 bg-gradient-to-r from-vice-pink/20 to-vice-cyan/20 animate-wave-3"></div>
        </div>

        {/* Lens Flares */}
        <div className="absolute top-1/4 right-1/3 w-4 h-4 bg-white rounded-full animate-lens-flare-1 opacity-80"></div>
        <div className="absolute top-1/3 right-1/4 w-6 h-6 bg-vice-cyan rounded-full animate-lens-flare-2 opacity-60"></div>
        <div className="absolute top-1/2 right-1/2 w-2 h-2 bg-vice-pink rounded-full animate-lens-flare-3 opacity-90"></div>
        <div className="absolute top-2/5 right-2/5 w-8 h-8 bg-white/40 rounded-full animate-lens-flare-4 opacity-50"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 min-h-screen p-8">
        <div className="w-full max-w-6xl">
          {/* Hero Section with SPR Vice City Logo - Upper Left */}
          <div className="mb-12 text-left">
            <div className="relative mb-4">
              <img 
                src="/lovable-uploads/bdcbae56-499c-449c-bed0-53fa7af42ac6.png" 
                alt="SPR Vice City Logo"
                className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 object-contain drop-shadow-2xl relative z-50"
                style={{ filter: 'drop-shadow(0 0 20px rgba(255, 0, 255, 0.3))' }}
              />
            </div>
          </div>

          {/* Sign In Card - Centered */}
          <div className="flex justify-center items-center min-h-[60vh]">
            <Card className="w-full max-w-md bg-black/40 backdrop-blur-md border-vice-cyan/30 shadow-2xl shadow-vice-purple/20">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white">Sign In</CardTitle>
                <CardDescription className="text-vice-cyan">
                  Enter the neon-soaked paradise
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-vice-pink font-semibold">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    className="bg-black/30 border-vice-cyan/50 text-white placeholder:text-gray-400 focus:border-vice-pink focus:ring-vice-pink"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-vice-pink font-semibold">
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    className="bg-black/30 border-vice-cyan/50 text-white placeholder:text-gray-400 focus:border-vice-pink focus:ring-vice-pink"
                  />
                </div>
              </CardContent>
              <CardFooter className="flex flex-col space-y-4">
                <Button className="w-full bg-gradient-to-r from-vice-pink to-vice-purple hover:from-vice-purple hover:to-vice-pink text-white font-bold py-3 shadow-lg shadow-vice-pink/30 transition-all duration-300 transform hover:scale-105">
                  Sign In
                </Button>
                <div className="text-center space-y-2">
                  <p className="text-sm text-vice-cyan">
                    Don't have an account?{' '}
                    <span className="text-vice-pink font-semibold cursor-pointer hover:underline">
                      Sign up
                    </span>
                  </p>
                  <p className="text-xs text-gray-400">
                    Forgot your password?{' '}
                    <span className="text-vice-cyan cursor-pointer hover:underline">
                      Reset it
                    </span>
                  </p>
                </div>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;