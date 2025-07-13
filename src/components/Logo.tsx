import { Trophy, BookOpen, Target } from "lucide-react";

interface LogoProps {
  className?: string;
  showText?: boolean;
}

export const Logo = ({ className = "", showText = true }: LogoProps) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="relative">
        {/* Logo Icon with brand colors */}
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-brand-red to-brand-green rounded-lg shadow-md">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div className="absolute -top-1 -right-1">
          <Target className="w-4 h-4 text-brand-black" />
        </div>
      </div>
      
      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-bold text-brand-black leading-none">
            ACHIEVERS
          </span>
          <span className="text-sm font-medium text-brand-red leading-none">
            CLUB
          </span>
        </div>
      )}
    </div>
  );
};