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
      <div className="relative z-10 flex items-center justify-center min-h-screen p-8">
        <div className="w-full max-w-6xl flex flex-col items-center">
          {/* Hero Section with SPR and Vice City Text */}
          <div className="mb-12 text-center">
            {/* SPR Block Letters */}
            <div className="relative mb-4">
              <h1 className="text-9xl md:text-[12rem] font-black text-vice-blue tracking-wider drop-shadow-2xl vice-block-letters">
                SPR
              </h1>
              
              {/* Vice City Cursive Text */}
              <div className="absolute -bottom-8 right-8 md:right-16">
                <h2 className="text-4xl md:text-6xl font-bold text-vice-pink vice-city-font drop-shadow-lg transform rotate-[-5deg]">
                  Vice City
                </h2>
                {/* Decorative Elements */}
                <div className="absolute -top-2 -right-4 w-12 h-1 bg-vice-pink transform rotate-45"></div>
                <div className="absolute -bottom-2 -left-4 w-8 h-1 bg-vice-cyan transform rotate-[-30deg]"></div>
              </div>
            </div>
          </div>

          {/* Sign In Card */}
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
  );
};

export default SignIn;