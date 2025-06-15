
import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCcw, X, SwitchCamera } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

interface MealCameraProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (imageDataUrl: string) => void;
}

const MealCamera = ({ open, onOpenChange, onCapture }: MealCameraProps) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startCamera = async (mode: 'user' | 'environment') => {
    stopCamera();
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: mode } });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access camera. Please check permissions.");
      toast({
        title: "Camera Error",
        description: "Could not access the camera. Please ensure you have granted permission in your browser settings.",
        variant: "destructive"
      });
      onOpenChange(false);
    }
  };
  
  useEffect(() => {
    if (open) {
      setCapturedImage(null);
      const initialMode = 'environment';
      setFacingMode(initialMode);
      startCamera(initialMode);
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
        stopCamera();
      }
    }
  };
  
  const handleRetake = () => {
      setCapturedImage(null);
      startCamera(facingMode);
  };

  const handleFlipCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    startCamera(newMode);
  };
  
  const handleConfirm = () => {
      if (capturedImage) {
          onCapture(capturedImage);
          onOpenChange(false);
      }
  };

  const handleClose = () => {
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-screen h-screen max-w-none rounded-none border-none sm:max-w-lg sm:h-auto sm:rounded-lg sm:border p-0 gap-0">
        <div className="flex flex-col h-full">
            <DialogHeader className="p-6 pb-2">
                <DialogTitle className="text-2xl font-bold text-gray-900 text-center sm:text-left">Log Meal</DialogTitle>
            </DialogHeader>
            <div className="relative flex-grow bg-black flex items-center justify-center overflow-hidden">
                {capturedImage ? (
                    <img src={capturedImage} alt="Captured meal" className="w-full h-full object-contain" />
                ) : (
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                )}
                <Button size="icon" variant="ghost" className="absolute top-4 right-4 text-white bg-black/30 hover:bg-black/50 hover:text-white rounded-full z-10" onClick={handleClose}>
                    <X className="w-5 h-5"/>
                </Button>
                {!capturedImage && stream && (
                    <Button size="icon" variant="ghost" className="absolute bottom-4 left-4 text-white bg-black/30 hover:bg-black/50 hover:text-white rounded-full z-10" onClick={handleFlipCamera}>
                        <SwitchCamera className="w-6 h-6" />
                    </Button>
                )}
                {error && <p className="absolute text-white bg-red-500/80 p-4 rounded-md">{error}</p>}
            </div>
            <DialogFooter className="p-4 border-t">
            {capturedImage ? (
                <div className="flex w-full justify-between gap-2">
                    <Button variant="outline" onClick={handleRetake} className="w-full flex items-center gap-2">
                        <RefreshCcw className="w-4 h-4" /> Retake
                    </Button>
                    <Button onClick={handleConfirm} className="w-full">Confirm</Button>
                </div>
            ) : (
                <Button onClick={handleCapture} className="w-full flex items-center gap-2" disabled={!!error || !stream}>
                    <Camera className="w-4 h-4" /> Capture
                </Button>
            )}
            </DialogFooter>
        </div>
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};

export default MealCamera;
