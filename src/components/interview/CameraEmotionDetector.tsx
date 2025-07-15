
import React, { useRef, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, CameraOff, Loader } from 'lucide-react';
import { useEmotionDetection } from '@/hooks/useEmotionDetection';
import EmotionDisplay from './EmotionDisplay';
import { useToast } from '@/hooks/use-toast';

interface CameraEmotionDetectorProps {
  onEmotionUpdate?: (emotion: any) => void;
}

const CameraEmotionDetector: React.FC<CameraEmotionDetectorProps> = ({ onEmotionUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Use real emotion detection
  const emotionState = useEmotionDetection(videoRef, isCameraActive);

  // Notify parent of emotion updates
  useEffect(() => {
    if (onEmotionUpdate && emotionState.confidence > 0) {
      onEmotionUpdate(emotionState);
    }
  }, [emotionState, onEmotionUpdate]);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
        toast({
          title: "Camera activated",
          description: "Real-time emotion detection is now active.",
        });
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setError(err.name === 'NotAllowedError' 
        ? 'Camera access denied. Please allow camera permissions.'
        : 'Unable to access camera. Please check your camera settings.'
      );
      toast({
        title: "Camera Error",
        description: "Unable to access camera for emotion detection.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    toast({
      title: "Camera deactivated",
      description: "Emotion detection has been stopped.",
    });
  };

  const toggleCamera = () => {
    if (isCameraActive) {
      stopCamera();
    } else {
      startCamera();
    }
  };

  return (
    <div className="space-y-4">
      {/* Camera Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Live Camera Feed</span>
            <Button
              onClick={toggleCamera}
              variant={isCameraActive ? "destructive" : "default"}
              size="sm"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : isCameraActive ? (
                <CameraOff className="h-4 w-4" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              {isLoading ? "Starting..." : isCameraActive ? "Stop Camera" : "Start Camera"}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative w-full h-64 bg-gray-900 rounded-lg overflow-hidden">
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-100 text-red-800 p-4 text-center">
                <div>
                  <Camera className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{error}</p>
                  <Button
                    onClick={startCamera}
                    size="sm"
                    className="mt-2"
                    variant="outline"
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            )}
            
            {!isCameraActive && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white">
                <div className="text-center">
                  <Camera className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">Click "Start Camera" to begin emotion detection</p>
                  <Button onClick={startCamera} disabled={isLoading}>
                    {isLoading ? "Starting..." : "Start Camera"}
                  </Button>
                </div>
              </div>
            )}

            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${isCameraActive ? 'opacity-100' : 'opacity-0'}`}
            />
            
            {/* Real-time emotion overlay */}
            {isCameraActive && emotionState.confidence > 0 && (
              <div className="absolute top-2 right-2">
                <div className="bg-black/70 rounded-lg p-2 text-white text-center">
                  <div className="text-2xl mb-1">{emotionState.icon}</div>
                  <div className="text-xs font-medium capitalize">{emotionState.dominant}</div>
                  <div className="text-xs opacity-75">{Math.round(emotionState.confidence * 100)}%</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Emotion Analysis Display */}
      {isCameraActive && (
        <EmotionDisplay
          emotion={emotionState.dominant}
          confidence={emotionState.confidence}
          icon={emotionState.icon}
          scores={emotionState.scores}
          showDetails={true}
        />
      )}
    </div>
  );
};

export default CameraEmotionDetector;
