import { useState } from "react";
import { RegistrationForm } from "@/components/RegistrationForm";
import { Dashboard } from "@/components/Dashboard";
import { Logo } from "@/components/Logo";
import heroImage from "@/assets/hero-image.jpg";

interface User {
  name: string;
  email: string;
  phone: string;
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleRegistrationComplete = (userData: User) => {
    setUser(userData);
  };

  if (user) {
    return <Dashboard user={user} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/10">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={heroImage} 
            alt="Students studying for KCET exam" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-black/50 to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Hero Content */}
            <div className="space-y-8">
              <div className="space-y-4">
                <Logo className="mb-6" />
                <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight">
                  Master KCET with
                  <span className="text-brand-red"> Smart </span>
                  <span className="text-brand-green">Time Management</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Overcome weak topics in Physics, Chemistry & Mathematics. 
                  Focus on what matters most for KCET success with our targeted approach to 
                  <strong className="text-brand-red"> Thermodynamics, Waves</strong> and more.
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full"></div>
                  <span className="text-foreground font-medium">📚 11th & 12th NCERT Complete Coverage</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-brand-red rounded-full"></div>
                  <span className="text-foreground font-medium">⏱️ Smart Time Management Strategies</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-brand-green rounded-full"></div>
                  <span className="text-foreground font-medium">🎯 Weak Topic Identification & Practice</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-brand-red rounded-full"></div>
                  <span className="text-foreground font-medium">📊 Accuracy Improvement Tools</span>
                </div>
              </div>
              
              <div className="bg-card/80 backdrop-blur-sm rounded-lg p-6 border border-brand-green/20">
                <h3 className="text-lg font-semibold text-foreground mb-2">🔥 Special Focus Areas</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm">
                    <span className="font-medium text-brand-red">Physics:</span>
                    <p className="text-muted-foreground">Thermodynamics, Waves, Mechanics</p>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-brand-green">Chemistry:</span>
                    <p className="text-muted-foreground">Organic, Physical Chemistry</p>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-foreground">Mathematics:</span>
                    <p className="text-muted-foreground">Calculus, Coordinate Geometry</p>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-brand-red">Strategy:</span>
                    <p className="text-muted-foreground">Time management, Accuracy</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right Side - Registration Form */}
            <div className="lg:pl-8">
              <RegistrationForm onRegistrationComplete={handleRegistrationComplete} />
            </div>
          </div>
        </div>
      </div>
      
      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Why Achievers Club Works
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Our proven approach focuses on your exact weak points, saving time and maximizing accuracy for KCET success.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-red to-brand-red/80 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl text-white">🎯</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground">Targeted Learning</h3>
            <p className="text-muted-foreground">
              Focus only on your weak topics. No time wasted on concepts you already know.
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-green to-brand-green/80 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl text-white">⚡</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground">Time Optimization</h3>
            <p className="text-muted-foreground">
              Smart practice schedules that maximize learning in minimum time.
            </p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-brand-black to-gray-700 rounded-full flex items-center justify-center mx-auto">
              <span className="text-2xl text-white">📈</span>
            </div>
            <h3 className="text-xl font-semibold text-foreground">Accuracy Boost</h3>
            <p className="text-muted-foreground">
              Proven methods to reduce silly mistakes and improve problem-solving speed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
