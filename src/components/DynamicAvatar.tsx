
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface DynamicAvatarProps {
  onClick?: () => void;
  size?: number;
  className?: string;
}

const DynamicAvatar = ({ onClick, size = 40, className }: DynamicAvatarProps) => {
  const [isPressed, setIsPressed] = useState(false);

  const handlePress = () => {
    setIsPressed(true);
    setTimeout(() => setIsPressed(false), 300);
    onClick?.();
  };

  return (
    <button onClick={handlePress} className="p-1">
      <Avatar className={`transition-transform duration-200 border-2 border-white shadow-lg ring-2 ring-blue-200/50 ${isPressed ? 'animate-bounce ring-blue-300/70' : ''} ${className || ''}`} style={{ width: size, height: size }}>
        <AvatarImage 
          src="/lovable-uploads/880f3ea4-efd1-4de5-93a4-d0d91ae981f7.png" 
          alt="Avatar" 
          className={`transition-transform duration-300 ${isPressed ? 'animate-pulse scale-105' : ''}`}
        />
        <AvatarFallback className="bg-gradient-to-br from-slate-200 to-slate-300">
          A
        </AvatarFallback>
      </Avatar>
    </button>
  );
};

export default DynamicAvatar;
