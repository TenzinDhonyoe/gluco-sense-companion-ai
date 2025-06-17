
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
    setTimeout(() => setIsPressed(false), 200);
    onClick?.();
  };

  return (
    <button onClick={handlePress} className="p-1">
      <Avatar className={`transition-transform duration-200 ${isPressed ? 'animate-bounce' : ''}`} style={{ width: size, height: size }}>
        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-bold relative overflow-hidden">
          {/* Face */}
          <div className="relative w-full h-full flex items-center justify-center">
            {/* Head shake animation when pressed */}
            <div className={`transition-transform duration-200 ${isPressed ? 'animate-pulse scale-110' : ''}`}>
              {/* Eyes */}
              <div className="flex space-x-1 mb-1">
                <div className={`w-1.5 h-1.5 bg-white rounded-full transition-transform duration-200 ${isPressed ? 'scale-150' : ''}`}></div>
                <div className={`w-1.5 h-1.5 bg-white rounded-full transition-transform duration-200 ${isPressed ? 'scale-150' : ''}`}></div>
              </div>
              {/* Mouth */}
              <div className={`w-2 h-1 bg-white rounded-full transition-all duration-200 ${isPressed ? 'scale-125 bg-yellow-300' : ''}`}></div>
            </div>
            {/* Hair effect */}
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-2 bg-white/30 rounded-full"></div>
          </div>
        </AvatarFallback>
      </Avatar>
    </button>
  );
};

export default DynamicAvatar;
