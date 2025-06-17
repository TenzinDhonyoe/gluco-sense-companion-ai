
import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface DynamicAvatarProps {
  onClick?: () => void;
  size?: number;
}

const DynamicAvatar = ({ onClick, size = 40 }: DynamicAvatarProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 300);
    onClick?.();
  };

  return (
    <button onClick={handlePress} className="p-1">
      <Avatar className={`transition-transform duration-200 ${isPressed ? 'animate-bounce' : ''}`} style={{ width: size, height: size }}>
        <AvatarFallback className="bg-gradient-to-br from-slate-200 to-slate-300 relative overflow-hidden">
          {/* Person illustration */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Head with animation */}
            <div className={`relative transition-transform duration-300 ${isPressed ? 'animate-pulse scale-105' : ''}`}>
              {/* Face/Head background */}
              <div className="w-8 h-10 bg-gradient-to-b from-amber-100 to-amber-200 rounded-full relative">
                
                {/* Hair */}
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-9 h-6 bg-gradient-to-b from-amber-800 to-amber-700 rounded-t-full"></div>
                
                {/* Eyes */}
                <div className="absolute top-3 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
                  <div className={`w-1 h-1 bg-slate-800 rounded-full transition-transform duration-200 ${isPressed ? 'scale-125' : ''}`}></div>
                  <div className={`w-1 h-1 bg-slate-800 rounded-full transition-transform duration-200 ${isPressed ? 'scale-125' : ''}`}></div>
                </div>
                
                {/* Nose */}
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-0.5 h-1 bg-amber-300 rounded-full"></div>
                
                {/* Mouth */}
                <div className={`absolute top-5 left-1/2 transform -translate-x-1/2 w-2 h-0.5 bg-rose-400 rounded-full transition-all duration-200 ${isPressed ? 'scale-110 bg-rose-500' : ''}`}></div>
                
                {/* Eyebrows */}
                <div className="absolute top-2.5 left-1/2 transform -translate-x-1/2 flex space-x-1.5">
                  <div className="w-1.5 h-0.5 bg-amber-800 rounded-full"></div>
                  <div className="w-1.5 h-0.5 bg-amber-800 rounded-full"></div>
                </div>
              </div>
              
              {/* Neck */}
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-gradient-to-b from-amber-200 to-amber-100"></div>
              
              {/* Shirt/Clothing */}
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-6 h-3 bg-gradient-to-b from-blue-500 to-blue-600 rounded-t-lg"></div>
              
              {/* Collar */}
              <div className="absolute -bottom-1.5 left-1/2 transform -translate-x-1/2 w-4 h-1.5 bg-white rounded-t-sm opacity-90"></div>
            </div>
          </div>
        </AvatarFallback>
      </Avatar>
    </button>
  );
};

export default DynamicAvatar;
